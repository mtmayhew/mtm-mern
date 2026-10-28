# MTM MERN — Windows local development (no Docker)

These instructions work with Visual Studio Code and the integrated terminal in full Visual Studio. VS Code has built-in JavaScript/Node debugging; full Visual Studio may need additional Node.js tooling.

## Requirements

- Windows 10/11 and Node.js 22+ with `npm` in PATH.
- MongoDB Community Server locally installed and started, or another accessible MongoDB server.
- PowerShell, Visual Studio Code (recommended) or Visual Studio.

## First run

1. Unzip to e.g. `C:\Projects\mtm-mern` and open the **mtm-mern** folder in your editor.
2. Start MongoDB. If installed as a Windows service: `Get-Service MongoDB` and, if needed, run an elevated PowerShell: `Start-Service MongoDB`.
3. From the project root in PowerShell, run `powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1` once. It copies `server/.env.example` to `server/.env` if missing and installs dependencies.
4. Open two terminals at the project root:
   - Backend: `powershell -ExecutionPolicy Bypass -File .\start-api.ps1`
   - Frontend: `powershell -ExecutionPolicy Bypass -File .\start-web.ps1`
5. Browse to **http://127.0.0.1:5173**. Check API at **http://127.0.0.1:3000/api/health** (expect `database: connected`).

## Where is the connection string?

`server/.env` (created locally by setup script):

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/mtm
```

Backend loads `.env` using `dotenv/config` in `server/index.js`. **Do not commit `server/.env`**; `.gitignore` excludes `.env` files. If your MongoDB requires credentials, place them only in your local `.env` and URL-encode special characters in the username/password.

`client/vite.config.js` proxies browser `/api` calls to `http://127.0.0.1:3000`, and serves static gallery pictures from `client/public/gallery`. No Nginx is needed for development. Editing React files triggers Vite HMR; editing backend files triggers Node watch restart.

## Debugging in Visual Studio Code

The `.vscode/launch.json` contains **Debug Express API** and **Debug React in Chrome**. Run setup first. Start the frontend using the terminal or task; debug the backend with F5 by selecting Debug Express API. MongoDB must already be running.

## Production deployment retained

`docker-compose.yml`, `client/Dockerfile`, `server/Dockerfile`, `helm/`, and `.github/workflows/` remain for Ubuntu deployments. Docker Compose uses MongoDB hostname `mongo`; on Windows local development the database host is `127.0.0.1`. Frontend Docker Nginx upstream was corrected to `api` (the actual Compose service name). Docker Compose frontend currently binds **localhost only** at `127.0.0.1:8080`; to access from another LAN machine, adjust the bind only if your network/firewall policy permits it.

## Troubleshooting

- `ECONNREFUSED 127.0.0.1:27017`: MongoDB service isn't listening or the connection string is wrong.
- `npm` not found: reinstall Node.js and reopen the terminal.
- Port 3000 in use: stop other API instance, or update the Vite proxy and API PORT together.
- Port 5173 in use: stop the other Vite instance (strictPort is enabled).
- Contact form saves inquiries to MongoDB; it does **not** send an email.
