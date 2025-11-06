# InfoHub — GitHub Pages + Optional Backend

This repo contains:
- `client/` — Vite + React app (works on GitHub Pages using public APIs; no secrets required).
- `server/` — Optional Express API (deploy to Render if you want your own backend).
- `.github/workflows/deploy.yml` — GitHub Actions to build & publish the client to **GitHub Pages**.

## Deploy Frontend to GitHub Pages
1. Push to GitHub (main branch):
   ```bash
   git init
   git add .
   git commit -m "InfoHub (Pages ready)"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   git push -u origin main
   ```

2. In your GitHub repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Trigger the workflow by pushing to `main` or running it manually.  
   Your site will be available at: `https://<YOUR_USERNAME>.github.io/<REPO_NAME>/`

> Vite `base` is set to `./` so assets load correctly on Pages without extra config.

## Optional: Deploy Backend to Render
- Create a **Web Service** with root directory `server/`, Build `npm install`, Start `node index.js`.
- Add env var `OPENWEATHER_KEY` if you want OpenWeather data.
- Update the client to use your API by replacing public API calls with your backend calls (or set a VITE_API_BASE and adapt code).

## Run locally (full stack)
```bash
# terminal 1
cd server
npm install
npm run dev

# terminal 2
cd client
npm install
npm run dev
```
Open the client dev URL (usually http://localhost:5173).

(c) 2025 InfoHub
