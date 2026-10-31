# MTM Enterprises: 100 MB upload update

This is a *changes-only* patch based on the available `mtm-approved-theme-complete.zip` project source. Review diffs before applying if your branch has newer backend/frontend changes. It intentionally contains only four files and does not change Helm, image registry, credentials, or application routing.

## What changes
- Gallery upload: 5 MiB -> 100 MiB (Multer, interface copy, import-image checks, admin selection check)
- 3D quote model upload: 20 MiB -> 100 MiB (Multer and React validation)
- Frontend Nginx request size: 110m. This is deliberately higher than the **100 MiB maximum individual file** to allow multipart form fields and headers. If you set Nginx to exactly 100m, a 100 MiB file may be rejected due to the extra form-data bytes.

## Host Ubuntu Nginx: required manual step
Add `client_max_body_size 110m;` inside the HTTPS `server` block for mtm-ent.org. Find the correct config via `sudo nginx -T | grep -n 'server_name.*mtm-ent.org'`. Verify via `sudo nginx -t && sudo systemctl reload nginx`. The public host config is **not** part of this repository and is not changed by this ZIP.

## Installation (Windows PowerShell)
From your existing repo, back up or commit outstanding changes, then extract this ZIP at the *repository root*, preserving `client/` and `server/`. Review `git diff` before committing because the backend and frontend files are complete replacements based on an earlier snapshot.

    cd C:\Projects\mtm-mern
    git diff
    cd client
    npm install
    npm run build
    cd ..
    git add client/nginx.conf client/src/Admin.jsx client/src/QuoteForm.jsx server/index.js
    git commit -m "Raise MTM gallery and 3D quote upload limits to 100 MB"
    git push origin main

After GitHub Actions and Argo CD sync, test with a smaller image first and then a 30+ MB GIF. A `413 Request Entity Too Large` generally means an Nginx limit is still active; a JSON `LIMIT_FILE_SIZE` means the application limit is active.

## Operational cautions
Both upload handlers use `multer.memoryStorage()`. A 100 MiB upload occupies substantial Node.js memory and concurrent uploads can cause out-of-memory failures. For heavy production usage migrate to disk-backed/streamed upload processing and enforce rate limits and storage quotas. A successful 100 MiB upload also requires adequate MongoDB GridFS storage and available server memory. Do **not** disable size limits on the public-facing API.
