# MTM Enterprises — Meet the Founder update

This update uses the approved MTM blue/navy homepage and latest wide/emblem logo branding. It adds:

- A shorter **Meet Michael** section on the homepage with the requested portrait.
- A full **/about** page written in a personal, first-person voice.
- Working header/footer links between the homepage, About page, and existing contact section.
- A locally bundled optimized headshot: `client/public/michael-headshot.webp`.
- Responsive desktop/mobile styles.

The update changes only `client/src/main.jsx`, `client/src/style.css`, and adds the portrait file. It does NOT replace or modify the API, MongoDB, admin/quote components, Docker, Helm, Argo CD, private GHCR image settings, or GitHub Actions.

## Install over your CURRENT checkout

1. Back up or commit your working directory first.
2. Extract `mtm-about-me-changes.zip` into the repository root, preserving the `client/` folder hierarchy. Review the changes before committing if your project has diverged from the previous MTM logo update.
3. On Windows PowerShell:

```powershell
cd C:\Projects\mtm-mern\client
npm install
npm run build
npm run dev
```

4. Preview `/` and `/about`, and verify that gallery, `/admin`, and the quote/contact forms still work. On the production Nginx container, `try_files $uri $uri/ /index.html;` must be configured for `/about` to work on direct refresh (the prior project's client/nginx.conf already includes this).
5. After testing:

```powershell
cd C:\Projects\mtm-mern
git add client/src/main.jsx client/src/style.css client/public/michael-headshot.webp
git commit -m "Add personal founder story and About page"
git push origin main
```

Argo CD will follow your existing GitOps workflow. No changes were made directly to the running server.

**Validation limitation:** This environment has no cached npm dependencies and cannot complete the Vite build. Run `npm run build` on your development machine before pushing.

**Privacy:** You provided the portrait for use on the public-facing About page; publishing this update makes that portrait publicly visible.
