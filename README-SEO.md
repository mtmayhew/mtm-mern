# MTM Enterprises — SEO Starter Update

This patch is based on the most recent **About Me** React source package. It does not modify the backend, MongoDB, Helm, GHCR, or deployment workflow.

## Included
- `client/index.html`: homepage title, description, canonical URL, social sharing metadata
- `client/src/main.jsx`: mounts SEO metadata handler alongside existing routes
- `client/src/SEO.jsx`: route-specific titles/descriptions, canonical, social metadata, structured data, admin noindex
- `client/public/robots.txt`: crawler instructions and sitemap reference
- `client/public/sitemap.xml`: homepage and About page URLs
- `client/public/mtm-social-preview.jpg`: social preview from your existing hero artwork

## Install
Unzip into your current `mtm-mern` repository; **review changes to `main.jsx` first** if you have edited it since the About Me update. From the `client` directory run `npm install` and `npm run build`, then test `/`, `/about`, and `/admin` in the browser. Commit the client files and push to your GitHub main branch when satisfied.

## Verify after deployment
- https://mtm-ent.org/robots.txt  should return text/plain and show sitemap
- https://mtm-ent.org/sitemap.xml should return XML
- https://mtm-ent.org/mtm-social-preview.jpg should return image/jpeg
- `/about` should display its own title and description when rendered in browser
- `/admin` should have `noindex` in its meta robots tag (also ideally add an X-Robots-Tag: noindex response header for the admin location at Nginx for stronger crawler control).

## Search Console setup
1. Visit https://search.google.com/search-console .
2. Add a **Domain** property for `mtm-ent.org`.
3. Create the TXT verification record that Google gives you at your DNS provider.
4. After verification and deployment, submit `sitemap.xml` from the Sitemaps screen.
5. Use URL Inspection for `/` and `/about` and check Page Indexing and Performance reports.

## Notes
Google can render client-side JavaScript, but server-side rendered or prerendered metadata is generally more robust for sharing and search crawlers. Since this site currently serves a single Vite HTML shell for all routes, `/about` SEO tags are updated by JavaScript. A future prerender/SSR upgrade will make route-specific tags directly available in the initial HTTP HTML response. `robots.txt` discourages crawling but does not protect admin access; authorization is still required. No private addresses or fictitious customer reviews were added to JSON-LD.
