# 3D Printing Quote Requests — MTM MERN

## Features

- Public quote form with STL/3MF upload (max 20 MB), material, color, quantity, dimensions and details.
- Files stored privately in MongoDB GridFS (`quoteModels`); metadata in `printquotes`.
- Admin dashboard **3D Print Quotes** tab: list/filter requests, download files, set status, internal notes, estimated USD price.
- Optional email notification uses existing SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, INQUIRY_NOTIFY_TO values. Notifications contain metadata only, **never file attachments**.
- No public file retrieval route; quote creation does not send a price to a customer or create an order.

## Windows

Run `npm install` in `server` (adds `yauzl`), `npm install` in `client`, then run existing start-api.ps1/start-web.ps1. Local MongoDB required. Check http://localhost:5173/#quote and /admin.

## Kubernetes / GitHub

**Merge these changed files into your CURRENT live repository** (do not overwrite working private GHCR, Helm values, Argo CD, Kubernetes Secrets). The existing server Dockerfile installs updated package.json dependencies. Push to `main` after local build testing. No new environment variables or Kubernetes volume required; storage uses existing MongoDB PVC.

## Safety and operations

- Backup MongoDB before deployment. Uploaded files increase your MongoDB storage use; the current PVC is 5Gi. Set up monitored storage and off-server backups.
- The app limits model uploads to 20MiB; your host Nginx needs `client_max_body_size 25m;` in the HTTPS server block and then `sudo nginx -t && sudo systemctl reload nginx`. Ensure all reverse proxies permit the upload.
- Do not render/extract customer models on your production host. Downloaded files are untrusted. The ZIP/3MF validator checks container structure/size, not all semantic 3D model content. Scan files with suitable malware tooling before processing.
- Enable MongoDB authentication and restrict access. The current admin login requires existing secure session cookies; same-origin checks apply to admin changes.
- Run `node --check server/index.js` and `npm run build` from client after dependency installation.
- Status/price changes do **not** send customers email automatically.
