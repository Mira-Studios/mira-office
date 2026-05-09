package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Mira Office Server is running")
	})

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status": "ok", "message": "Mira Office API is healthy"}`)
	})

	fmt.Println("Mira Office server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
