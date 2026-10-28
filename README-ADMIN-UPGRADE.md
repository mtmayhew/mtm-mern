# MTM MERN: Admin dashboard & inquiry notifications

## What's added
- `/admin` protected login and dashboard (no public registration).
- Search/filter/paginate inquiries, read full messages, change status, add private notes.
- MongoDB-backed, 8-hour admin sessions using randomly generated tokens hashed in the database; `HttpOnly`, `SameSite=Strict`, and HTTPS-only cookies in production.
- Rate-limited login, same-origin validation on admin mutations.
- Optional SMTP notification on each new inquiry; a mail outage does not prevent saving inquiries.
- Existing `/api/contact`, gallery, and public website stay in place.
- No password-reset/email-sending/customer-reply functionality is included.

## IMPORTANT: Merge into the CURRENT GitHub checkout
This package is based on the previous Windows-ready ZIP, **not a fetch of your currently deployed private GitHub repository**. Since you changed GHCR package names, Helm image tags, SMTP settings and other files later, do NOT overwrite your live `helm/mtm-mern/values.yaml`, `.github/workflows/build-deploy.yml`, or any existing Kubernetes secret with older ZIP contents.

Recommended cherry-pick into your **current** checkout:

- `server/index.js`
- `server/scripts/create-admin.js` (new)
- `server/package.json` (merge new dependencies/scripts; preserve anything added since)
- `server/Dockerfile` (make sure `COPY scripts ./scripts` exists)
- `server/.env.example` (merge the optional entries)
- `client/src/Admin.jsx` (new)
- `client/src/main.jsx` (merge admin routing; preserve your current changes)
- `client/src/style.css` (append Admin CSS; preserve your current changes)
- `helm/mtm-mern/templates/api.yaml`: merge `envFrom` for `notificationSecretName` into current file; keep the `api` Service and existing imagePullSecrets.
- `helm/mtm-mern/values.yaml`: add **only** `notificationSecretName: ""` to your current live values, preserving private image repositories and SHA image tags.

Your current GitHub Actions workflow should build both images automatically when these source changes are pushed. Confirm that it continues publishing the private package names currently in use.

## Local Windows setup
From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1
```

Edit `server/.env` as appropriate. Run two terminals:

```powershell
.\start-api.ps1
.\start-web.ps1
```

Make sure MongoDB is running. Create your first admin from `server`:

```powershell
cd server
npm run create-admin
```

The script prompts for a username and a password of at least **16 characters**. Its terminal input is visible; run it from a private terminal. Alternatively, set a temporary `ADMIN_SETUP_PASSWORD` environment variable before invoking the script and clear it immediately afterward. If an admin with that username already exists, the script refuses to overwrite it.

Then visit `http://localhost:5173/admin`.

## Production account creation on MicroK8s
After the new API image has deployed and is healthy, use an SSH session to your Ubuntu host:

```bash
sudo microk8s kubectl exec -it -n mtm-mern deployment/api -- node scripts/create-admin.js
```

The API Deployment is named `api` in the live cluster. The command uses its existing `MONGODB_URI` Kubernetes secret; do not copy MongoDB credentials into source code. Create an admin once. Do not run this in a shared recorded terminal because the basic prompt displays the typed password. If already created locally, that's a **different MongoDB database** and doesn't create a production account.

## Optional email notification
Notifications are disabled until SMTP settings are provided. They are not customer auto-replies.

Local `.env`:

```dotenv
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_USER=your-account
SMTP_PASS=your-app-specific-password
SMTP_FROM=inquiries@your-domain.example
INQUIRY_NOTIFY_TO=the-inbox-you-control@example.com
```

For production, create a local `.env.smtp` file containing only the SMTP_* keys and INQUIRY_NOTIFY_TO. Keep it out of Git and restrict filesystem permissions to your current user. On Ubuntu, for example:

```bash
umask 077
nano /tmp/mtm-smtp.env
sudo microk8s kubectl -n mtm-mern create secret generic mtm-smtp --from-env-file=/tmp/mtm-smtp.env
shred -u /tmp/mtm-smtp.env
```

If the secret already exists, update it instead of creating a duplicate (e.g., using `--dry-run=client -o yaml | sudo microk8s kubectl apply -f -`). Do not place SMTP credentials in Helm values, a committed `.env`, or a GitHub Actions log.

In your current Helm values add:

```yaml
notificationSecretName: mtm-smtp
```

Check the API Deployment template contains:

```yaml
{{- if .Values.notificationSecretName }}
envFrom:
  - secretRef:
      name: {{ .Values.notificationSecretName | quote }}
{{- end }}
```

The snippet must be placed under the API container at the same level as `env`, not under the `Deployment` root. Commit and push the Helm change to trigger Argo CD sync. Deployments referencing a missing secret will not start, so create the secret first.

SMTP is best-effort; failed mail sends are logged and the inquiry remains saved in MongoDB. For guaranteed notification delivery, a durable queue/retry mechanism would be needed.

## Security and deployment checklist
1. Back up MongoDB before deployment (existing inquiries are retained; new fields have defaults).
2. Keep your current private GHCR names, Kubernetes `ghcr-secret`, and imagePullSecrets configuration.
3. Verify `helm template` renders correctly; watch Argo CD sync and API pod health.
4. Create production admin using the in-cluster script.
5. Verify login, list/search, status update, note saving, logout, and a real inquiry email.
6. Configure password management, MongoDB authentication/backups, and HTTPS before external use. `/admin` is protected at the API, and additional IP allowlisting or VPN for administrators offers extra defense.
7. Do not expose the database port. Do not share real tokens, credentials, SMTP passwords or customer records in chat or Git.

## Quick API reference
- `POST /api/admin/login` `{username,password}`
- `GET /api/admin/me`
- `POST /api/admin/logout`
- `GET /api/admin/inquiries?page=1&status=new&search=...`
- `PATCH /api/admin/inquiries/:id` `{status,adminNotes}`

All inquiry-management APIs require a valid admin session cookie. Mutation endpoints require the browser's same-origin `Origin` header.
