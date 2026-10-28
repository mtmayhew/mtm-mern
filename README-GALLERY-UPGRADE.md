# MTM Gallery upgrade

This upgrade builds on `mtm-mern-admin-upgrade.zip` (not a clone of the current GitHub repository).

## Features
- Responsive project-card grid with modal lightbox and captions.
- `/admin` > **Project gallery** upload, edit details, show/hide and delete.
- Images stored as MongoDB GridFS objects. Uploads survive API/web pod redeployments as long as MongoDB PVC persists.
- Validated JPEG/PNG/WebP/GIF, max 5 MB each. Authenticated admin mutations and same-origin check.
- Previously bundled eight images remain viewable in an archive section of the public gallery; admin management applies to **newly uploaded** images only.

## Local Windows development
1. Merge changes into your current Windows repository. Preserve your GitHub Actions, Helm and private GHCR settings.
2. From `server`, run `npm install` to install the new `multer` dependency.
3. Run MongoDB and your usual `start-api.ps1` / `start-web.ps1`.
4. Log into `/admin` with your existing admin account, choose **Project gallery**, add a photo and confirm it appears on `/`.

## Live Kubernetes deployment
1. **Before deploying, back up MongoDB** (especially the persistent volume). This feature increases storage use. The 5 Gi PVC may need more capacity; `microk8s-hostpath` storage is not automatically expandable.
2. Copy/merge the changed source files into your **current** repository. Do not overwrite the production Helm chart or workflow with the older versions bundled in the full zip. If you previously renamed GHCR images to private packages, keep those settings.
3. Commit and push. Verify GitHub Actions builds images and Argo CD syncs successfully.
4. Check `sudo microk8s kubectl get pods -n mtm-mern`; log into `https://mtm-ent.org/admin` and test with a small image.
5. Verify public `https://mtm-ent.org/api/gallery` includes the new item and `https://mtm-ent.org/` shows it.

## Security / deployment notes
- GridFS is used, not local container files; only expose the API via the frontend proxy.
- Uploads cannot be executed as scripts via this endpoint; images are served with a fixed image MIME type and `nosniff`.
- Additional production hardening recommended: MongoDB auth and regular backups; image re-encoding / metadata stripping; storage quotas and image moderation if more admins will be added.
- If you already have a gallery DB collection or routes in your current repo, reconcile manually to avoid duplicate endpoints.
