# UniCompanion

UniCompanion is a static website for exploring South African universities, comparing study options and getting course suggestions.

## GitHub Pages deployment

1. Push the repository to GitHub.
2. Open **Settings â†’ Pages**.
3. Select **Deploy from a branch**, choose the branch containing the site, and select **/(root)**.
4. Save and wait for the Pages deployment to finish.

The site uses relative paths so it works both at a custom domain root and at a GitHub project URL such as `username.github.io/repository/`.

## Gemini setup

The website is static HTML, CSS and JavaScript. Browsers cannot read `.env` or `process.env`, and a key embedded in browser JavaScript is public. The checked-in `js/gemini-config.js` therefore contains no API key. To use Gemini on a deployed site without exposing credentials, route requests through a server-side proxy that reads `GEMINI_API_KEY` from its environment.
