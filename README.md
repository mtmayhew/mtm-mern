**Windows development:** Read [README-WINDOWS.md](README-WINDOWS.md) for no-Docker setup, connection string, and debugging.

# MTM Enterprises MERN application

Converted from the supplied Nginx static-site archive. Preserves the site sections and gallery assets, with React, an Express gallery/contact API, MongoDB storage, Docker, Helm and GitHub Actions + Argo CD continuous deployment.

## Local preview

Install Docker Compose and run `docker compose up --build -d`; open `http://localhost:8080`. Stop using `docker compose down` (do **not** use `-v` if you want to preserve inquiries).

## Ubuntu 24.04 + Helm + Argo CD setup

1. Install/configure a Kubernetes cluster such as single-node k3s. Docker alone does not run Helm workloads. Ensure a working default StorageClass/PV provisioner and sufficient disk for MongoDB. Note k3s commonly bundles Traefik on ports 80/443; disable or reconfigure it so the host Nginx remains on those ports.
2. Install Argo CD in the `argocd` namespace and confirm its controller is running. See https://argo-cd.readthedocs.io/en/stable/getting_started/ .
3. Create GitHub repository and push the project on `main`. Replace `REPLACE_WITH_GITHUB_OWNER` and `REPLACE_WITH_REPO` in `deploy/argocd-application.yaml`. You can leave image repositories in values.yaml as placeholders until the first successful workflow.
4. Set the GitHub repository Actions workflow permissions to **Read and write permissions** (the workflow commits back updated image SHA tags). GitHub Actions builds both images and pushes them to GHCR, then commits their SHA into `helm/mtm-mern/values.yaml`. If your repo has branch protection, allow an appropriate bot identity or use a GitHub App credential with permission to update the GitOps values.
5. Make the GHCR images public **or** create a registry pull secret in namespace `mtm` and set `imagePullSecrets` in `values.yaml`. The images are generally private by default.
6. Apply `deploy/argocd-application.yaml` using `kubectl apply -f deploy/argocd-application.yaml`. Argo CD watches `main` and automatically syncs changed Helm values. It will roll out new deployments after the images are built and their tags committed. The repository must be accessible to Argo CD (configure repository credentials if private).
7. Expose the app via NodePort 30080. On a single-node cluster running on the same server as your existing host Nginx, copy **only the `location /` block** from `deploy/host-nginx.conf.example` into your existing HTTPS virtual host, keeping your existing TLS settings, then run `sudo nginx -t && sudo systemctl reload nginx`. If Kubernetes runs elsewhere, replace `127.0.0.1` with an accessible node IP and ensure firewall policies restrict NodePort exposure appropriately.

### Deployment cycle

`git push origin main` → GitHub Actions builds & publishes `mtm-web:<commit-sha>` and `mtm-api:<commit-sha>` → GitHub Actions updates both image tags in Helm values and pushes a commit → Argo CD detects the new Git state and upgrades the deployment. You do **not** need the production server to git-pull files.

### Important production hardening

- The bundled MongoDB is a single-node *development/small-site starting point*, not a production hardened database: **it has no authentication**. Never expose port 27017 publicly. For a production deployment, prefer managed MongoDB or an authenticated/secured MongoDB deployment; set `mongodb.enabled=false`, create a Kubernetes secret holding `MONGODB_URI`, and set `mongodb.existingUriSecret` in values. Ensure backups, updates, and storage recovery.
- The inquiry endpoint saves messages to MongoDB but **does not send emails** or provide a private admin page. Add notifications, CAPTCHA or additional anti-spam protection, and authenticated admin access before relying on it for customer contacts. It has simple IP rate-limiting which is not shared between multiple API replicas.
- GitHub Actions dependencies use major version tags; pin immutable SHAs for stricter supply-chain controls. Use Node package lockfiles and `npm ci` for reproducible builds after locking dependencies.
- For a private GHCR registry, create an imagePullSecret in the `mtm` namespace before Argo CD deploys. `imagePullSecrets` applies to web/api, not MongoDB.
- Retain your host Nginx certificate renewal configuration; don't overwrite it with the example. Ensure node port 30080 is reachable from Nginx, but ideally not exposed to the Internet.
- Review resources, persistence, secrets, backup policy, ingress, securityContext and multi-node networking before production usage.

### Verify

`kubectl -n mtm get pods,svc,pvc` and `kubectl -n mtm rollout status deploy/mtm-web` and `kubectl -n mtm rollout status deploy/mtm-api`. Run `curl -fsS https://mtm-ent.org/api/health` and confirm database state is connected.
