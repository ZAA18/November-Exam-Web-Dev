# UniCompanion

UniCompanion is a static website for exploring South African universities, comparing study options and getting course suggestions.

## GitHub Pages deployment

1. Push the repository to GitHub.
2. Open **Settings â†’ Pages**.
3. Select **Deploy from a branch**, choose the branch containing the site, and select **/(root)**.
4. Save and wait for the Pages deployment to finish.

The site uses relative paths so it works both at a custom domain root and at a GitHub project URL such as `username.github.io/repository/`.

## Gemini setup

The website sends Gemini requests through a Cloudflare Worker. The browser config contains only the Worker URL; the API key stays in the Worker secret binding.

### Local development

Add your new key to the ignored root `.env` file as `GEMINI_API_KEY=your-key`, serve the website on port 5500 or 5173, and run:

```powershell
npx wrangler dev --config wrangler.jsonc
```

Wrangler reads the root `.env` for local Worker development. Keep that file out of Git.

### GitHub Pages deployment

1. Install Node.js LTS, then run `npx wrangler login` from the project folder.
2. Set the production secret with `npx wrangler secret put GEMINI_API_KEY`. Paste the key into Wrangler's prompt; do not put it in a command or source file.
3. Deploy with `npx wrangler deploy --config wrangler.jsonc`.
4. Copy the Worker URL shown by Wrangler into the production `apiBase` in `js/gemini-config.js`.
5. Push the site changes to GitHub Pages.

`wrangler.jsonc` allows the local Live Server/Vite origins and `https://zaa18.github.io`. Update `ALLOWED_ORIGINS` if the published website uses a different origin.
