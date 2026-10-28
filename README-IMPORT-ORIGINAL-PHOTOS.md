# Import original gallery photos into admin management

Previous gallery release left the eight original files in `client/public/gallery` and only listed newly uploaded MongoDB photos in Admin.

This release adds **Import original photos** under `/admin` > **Project gallery**. After deploying the changes, sign in and click it once. It uses same-origin authenticated uploads and stores copies in MongoDB GridFS. Large original JPEGs are resized as WebP in the browser to fit the 5 MB limit. The original static assets remain untouched as a backup; imported originals are excluded from the public legacy list, avoiding duplicates. Imported records can then be renamed, recategorized, hidden or deleted in the admin editor.

**Important:** If an imported original is deleted, the original static file will appear in the public gallery again because this release only hides it while an imported record exists. To permanently remove a legacy photo, remove that asset from `client/public/gallery` and its name from the backend `galleryFiles` list in a follow-up deployment.

For the safest rollout, merge changed files into your current repository, retaining your private GHCR names, Kubernetes Helm values and secrets. Back up MongoDB first, test locally, push to GitHub, wait for Argo CD, then click Import original photos on the live admin page. Do not repeatedly click Import while it is running.
