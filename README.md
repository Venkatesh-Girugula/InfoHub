# InfoHub (Final Build)
Single-page app with Weather, Currency Converter, and Motivational Quotes.

## Prerequisites
- Node.js 18+ and npm

## 1) Run backend
```bash
cd server
npm install
npm run dev
```
Expected: `InfoHub API listening on 4000`

Optional: create `server/.env` and add `OPENWEATHER_KEY=YOUR_KEY`

## 2) Run client
```bash
cd client
npm install
echo "VITE_API_BASE=http://localhost:4000" > .env
npm run dev
```
Open the printed URL (usually http://localhost:5173).

## Quick tests (new terminal)
```bash
curl "http://localhost:4000/api/quote"
curl "http://localhost:4000/api/convert?from=INR&to=USD&amount=100"
curl "http://localhost:4000/api/weather?city=Hyderabad"
```

## Notes
- Weather uses OpenWeather when `OPENWEATHER_KEY` is set; otherwise geocodes and uses Open-Meteo or a mock.
- Converter uses exchangerate.host (no key) with safe fallbacks.
- Quotes uses Quotable with local fallback.

(c) 2025 InfoHub
