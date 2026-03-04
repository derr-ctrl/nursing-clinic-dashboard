# Clinic Dashboard (CRUD)

Dashboard-style website (topbar + left sidebar) with working **CRUD** for:

- **Patients**
- **Doctors**
- **Appointments**

There are **two ways** to run it:

## 1. Pure HTML/CSS/JS version (for GitHub Pages)

Files:

- `index.html`
- `styles.css`
- `app.js`

Everything runs **in the browser only**:

- Data is stored in the browser using `localStorage`.
- No backend / database required.

### Run locally

Just open `index.html` in your browser (double‑click it, or right‑click → *Open with* → browser).

### Publish on GitHub Pages

1. Create a new GitHub repo and **add these three files** (`index.html`, `styles.css`, `app.js`) plus anything else you want.
2. Commit and push.
3. On GitHub, go to **Settings → Pages**.
4. Under **Source**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)` folder, then **Save**.
6. After a minute, GitHub shows the live URL for your site.

## 2. Node/Express version (optional)

If you prefer a small backend API instead of browser storage, you can still use:

- `server.js`
- `db.js`
- `public/*`

Run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

