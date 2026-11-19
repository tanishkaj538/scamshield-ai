# ScamShield AI – Frontend (React + Vite)

## Run
```bash
npm install
npm run dev        # http://localhost:5173
```
Works immediately in **demo mode** (built-in mock detector, no backend needed).

## Connect a backend (Python OR Java)
1. Copy `.env.example` to `.env`
2. Set `VITE_API_URL` (FastAPI: `http://localhost:8000`, Spring Boot: `http://localhost:8080`)
3. Backend must expose `POST /api/scan` – contract is documented at the top of `src/api.js`.
4. Enable CORS on the backend for `http://localhost:5173`.

## Features
- Scan message / link / screenshot
- 0–100 risk gauge + scam category (phishing, KYC, job, parcel)
- Explanations in English, Hinglish, Hindi
- Scan history (last 20, saved in browser)
- PDF report (Download PDF report -> choose "Save as PDF")

## Build
`npm run build` -> output in `dist/`
