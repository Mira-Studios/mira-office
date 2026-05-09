# Mira Office

Office suite with a lightweight Go backend and React frontend.

## Structure

```
mira-office/
├── website/          # React + Vite frontend
│   ├── src/
│   └── package.json
├── server/           # Go backend
│   ├── *.go
│   └── go.mod
└── mira-office.exe   # Compiled backend
```

## Quick Start

### 1. Build Frontend

```bash
cd website
npm install
npm run build
```

### 2. Build Backend

```bash
cd server
go mod download
go build -o ../mira-office.exe .
```

### 3. Run

```bash
./mira-office.exe
```

The server will:
- Serve the frontend at `http://localhost:8080`
- Expose API at `http://localhost:8080/api`

## Tech Stack

- **Backend:** Go 1.21
- **Frontend:** React, Vite, TypeScript
