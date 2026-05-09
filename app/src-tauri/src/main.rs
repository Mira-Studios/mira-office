#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, io::Write, path::PathBuf, thread, time::Duration};

use sha2::Digest;
use tauri::Manager;

fn main() {
    // determine exe dir to resolve the runtime program folder
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    let dist_dir = exe_dir.join("program").join("dist");

    tauri::Builder::default()
        .register_uri_scheme_protocol("assets", move |_app_handle, request| {
            // Map assets://... -> program/dist/...
            let uri = request.uri();
            let path = uri.trim_start_matches("assets://");
            let file_path = dist_dir.join(path);
            if !file_path.exists() {
                return tauri::http::ResponseBuilder::new()
                    .status(404)
                    .body(Vec::new())
                    .map_err(|e| e.to_string());
            }
            let mime = mime_guess::from_path(&file_path)
                .first_or_octet_stream()
                .essence_str()
                .to_string();
            match std::fs::read(&file_path) {
                Ok(data) => tauri::http::ResponseBuilder::new()
                    .mimetype(&mime)
                    .status(200)
                    .body(data)
                    .map_err(|e| e.to_string()),
                Err(e) => tauri::http::ResponseBuilder::new()
                    .status(500)
                    .body(Vec::new())
                    .map_err(|_| e.to_string()),
            }
        })
        .setup(|app| {
            let window = app.get_window("main").expect("failed to get main window");

            // run updater in a background thread; when done, navigate the webview to the local site
            let window_for_thread = window.clone();
            thread::spawn(move || {
                if let Err(e) = check_and_update(window_for_thread) {
                    eprintln!("Updater error: {:#?}", e);
                }
                // instruct the webview to navigate to the local site (assets://)
                let _ = window.eval("window.location.replace('assets://index.html');");
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn check_and_update(window: tauri::Window) -> anyhow::Result<()> {
    use reqwest::blocking::Client;
    use serde_json::json;

    let client = Client::builder().timeout(Duration::from_secs(30)).build()?;
    let token = std::env::var("GITHUB_TOKEN").ok();

    let tree_url = "https://api.github.com/repos/Mira-Studios/mira-office/git/trees/main?recursive=1";

    let send_status = |s: &str| {
        let _ = window.emit("updater:status", json!({"status": s}));
    };

    send_status("checking_tree");

    // fetch tree with retries
    let mut tree_json: serde_json::Value = loop {
        let mut req = client.get(tree_url).header("User-Agent", "mira-office-updater");
        req = req.header("Accept", "application/vnd.github.v3+json");
        if let Some(ref t) = token {
            req = req.bearer_auth(t);
        }
        let resp = req.send();
        match resp {
            Ok(r) if r.status().is_success() => {
                let j: serde_json::Value = r.json()?;
                break j;
            }
            Ok(r) => {
                eprintln!("GitHub tree request failed: {}", r.status());
            }
            Err(e) => {
                eprintln!("GitHub tree request error: {}", e);
            }
        }
        // retry once after a short wait
        thread::sleep(Duration::from_secs(2));
        // final attempt
        let mut req2 = client.get(tree_url).header("User-Agent", "mira-office-updater");
        req2 = req2.header("Accept", "application/vnd.github.v3+json");
        if let Some(ref t) = token {
            req2 = req2.bearer_auth(t);
        }
        let r2 = req2.send()?;
        if r2.status().is_success() {
            let j: serde_json::Value = r2.json()?;
            break j;
        } else {
            send_status("tree_fetch_failed");
            return Ok(());
        }
    };

    let tree = tree_json
        .get("tree")
        .and_then(|v| v.as_array())
        .ok_or_else(|| anyhow::anyhow!("missing tree from github response"))?;

    let mut entries: Vec<(String, String)> = Vec::new();
    for item in tree {
        if let (Some(path), Some(typ)) = (
            item.get("path").and_then(|p| p.as_str()),
            item.get("type").and_then(|t| t.as_str()),
        ) {
            if typ == "blob" && path.starts_with("website/dist/") {
                let rel = path.trim_start_matches("website/dist/").to_string();
                let sha = item.get("sha").and_then(|s| s.as_str()).unwrap_or("").to_string();
                entries.push((rel, sha));
            }
        }
    }

    entries.sort_by(|a, b| a.0.cmp(&b.0));
    let mut hasher = sha2::Sha256::new();
    for (p, sha) in &entries {
        hasher.update(p.as_bytes());
        hasher.update(b":");
        hasher.update(sha.as_bytes());
        hasher.update(b"\n");
    }
    let remote_hash = hex::encode(hasher.finalize());

    // runtime path: next to the exe, create program/dist
    let exe = std::env::current_exe()?;
    let exe_dir = exe.parent().unwrap_or_else(|| std::path::Path::new(".")).to_path_buf();
    let dist_dir = exe_dir.join("program").join("dist");
    fs::create_dir_all(&dist_dir)?;
    let manifest_path = dist_dir.join(".manifest");
    let need_update = match fs::read_to_string(&manifest_path) {
        Ok(local) => local != remote_hash,
        Err(_) => true,
    };

    if entries.is_empty() {
        send_status("no_dist_files_found");
        return Ok(());
    }

    if need_update {
        send_status("updating");
        for (i, (rel, _sha)) in entries.iter().enumerate() {
            let raw = format!(
                "https://raw.githubusercontent.com/Mira-Studios/mira-office/main/website/dist/{}",
                rel
            );

            // per-file retry
            let mut success = false;
            for attempt in 0..3 {
                let mut req = client.get(&raw).header("User-Agent", "mira-office-updater");
                if let Some(ref t) = token {
                    // raw.githubusercontent doesn't accept bearer for raw host but it's harmless for public content
                    req = req.bearer_auth(t);
                }
                match req.send() {
                    Ok(r) if r.status().is_success() => {
                        let bytes = r.bytes()?;
                        let out_path = dist_dir.join(rel);
                        if let Some(parent) = out_path.parent() {
                            fs::create_dir_all(parent)?;
                        }
                        let mut f = fs::File::create(&out_path)?;
                        f.write_all(&bytes)?;
                        success = true;
                        break;
                    }
                    Ok(r) => {
                        eprintln!("failed to download {}: {}", raw, r.status());
                    }
                    Err(e) => {
                        eprintln!("error downloading {}: {}", raw, e);
                    }
                }
                thread::sleep(Duration::from_secs(1 << attempt));
            }
            let _ = window.emit(
                "updater:progress",
                json!({"index": i, "total": entries.len(), "file": rel, "done": success}),
            );
        }
        fs::write(manifest_path, remote_hash)?;
        send_status("updated");
    } else {
        send_status("up_to_date");
    }

    Ok(())
}
