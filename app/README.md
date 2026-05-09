# Mira Office — Tauri wrapper

This folder contains a Tauri-based desktop wrapper for the `website/dist` output.

Quick start

- Requirements: Rust (stable), Node.js, and Tauri prerequisites for your platform.
- From this workspace root:

```bash
cd app
npm install
npx tauri info   # verify requirements
npm run dev      # run in dev mode
npm run build    # build native installers
```

Building installers

Run the build command on the target platform (or use cross-build tools):

```bash
cd app
npm ci
npm run build
```

This will produce platform-specific bundles (MSI/NSIS on Windows, DMG on macOS, AppImage/.deb on Linux) in the `src-tauri/target/release/bundle` folder.

What the app does

- On startup the app checks GitHub for changes under `Mira-Studios/mira-office/website/dist`.
- If the remote `dist` differs from the local copy, it's downloaded into `program/dist` next to the executable.
- The window then loads the local `program/dist/index.html` (served via a custom `assets://` scheme).

Note: the app always fetches the site from GitHub and does not use the local `website/dist` folder in this repository. During development the fallback `src/index.html` is used while the updater runs.
