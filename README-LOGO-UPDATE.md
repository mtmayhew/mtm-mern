# MTM Enterprises — 2026 logo update

This is a *patch* for the existing deployed MTM MERN project. It uses the approved wide metallic blue circuit-wordmark in the navigation and a compact multicolor circuit emblem in the footer. It does not replace the backend, MongoDB, Helm, Argo CD, or GitHub Actions settings.

## Files
- `client/src/main.jsx`: replaces the old header brand block with the approved logo image, and adds an emblem in the footer.
- `client/src/style.css`: responsive sizing for header and footer logos; existing homepage/theme CSS retained.
- `client/public/mtm-logo-wide.webp`: wide logo artwork.
- `client/public/mtm-mark.webp`: compact secondary emblem.
- `client/public/mtm-favicon.png`: optional square icon image (does not overwrite the existing favicon.ico).

## Merge and deploy
1. Back up/commit your latest working repo first. This patch starts from the previously provided **approved homepage** snapshot, not from your private live checkout. Inspect the diff for `main.jsx` and `style.css` if you've changed them since then; don't blindly overwrite newer changes.
2. Extract into your Windows repo preserving the relative paths.
3. Run `cd client; npm install; npm run build; npm run dev` and verify header, footer, admin, gallery, contact and quote pages locally.
4. Commit and push to `main`. Your existing GitHub Actions and Argo CD should pick up the frontend change.
5. No Kubernetes settings or registry credentials are in this patch.

**Optional favicon:** Change the `href` in `client/index.html` from `/favicon.ico` to `/mtm-favicon.png` to use the new emblem as browser tab icon.

**Visual note:** The wide logo artwork includes a dark background rather than alpha transparency, so the dark site header is intentionally used as its backdrop.
