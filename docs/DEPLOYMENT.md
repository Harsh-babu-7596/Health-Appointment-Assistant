# Deployment Guide: Hosting the Website Remotely

This site is a **static website**. `npm run build` turns the React + TypeScript source into plain HTML, CSS and JavaScript in a `dist/` folder. No server or database is needed, so it can be hosted for free on any static host.

There are two ways to deploy:

| Approach | Best for | Needs Git? | Updates |
|---|---|---|---|
| **A. Upload the built folder** | Quick demo link today | No | Re-upload `dist/` each time |
| **B. Connect a Git repository** | Your real, long-term site | Yes | Automatic on every `git push` |

Start with **A** to get a link in minutes, then move to **B** when you're ready.

---

## Before you deploy (both approaches)

1. **Update your details**: `src/config/site.ts` (name, email, phone, WhatsApp) and the `<title>` in `index.html`.
2. **Set up the contact form** (optional but recommended). See [Contact form email](#contact-form-email) below.
3. **Build and check locally**:
   ```bash
   npm install
   npm run build      # creates dist/
   npm run preview    # open http://localhost:4173 and click through the site
   ```
   If `npm run build` shows a TypeScript error, fix it before deploying. The build stops on type errors on purpose.

---

## Approach A: Upload the built folder (no Git)

### A1. Netlify Drop (recommended, no CLI)

1. Run `npm run build`.
2. Open <https://app.netlify.com/drop>.
3. Drag the **`dist`** folder (not the project folder) onto the page.
4. You get a URL like `https://lucky-otter-123.netlify.app` within seconds.
5. **Sign up or log in (free) and claim the site**, otherwise it is deleted after about an hour.
6. Rename it: *Site configuration → Site details → Change site name* → `nexora-health` → `https://nexora-health.netlify.app`.

**To update:** run `npm run build`, open the site in Netlify → *Deploys* tab → drag `dist` onto the upload area.

### A2. Surge.sh (terminal, one command)

```bash
npm run build
npx surge dist nexora-health.surge.sh
```

- First run: enter an email and password to create a free account.
- Update: run the same two commands again.
- Remove: `npx surge teardown nexora-health.surge.sh`.

### A3. Cloudflare Pages (terminal)

```bash
npm run build
npx wrangler login                                        # opens browser once
npx wrangler pages deploy dist --project-name nexora-health
```

URL: `https://nexora-health.pages.dev`. Free plan has unlimited bandwidth.

### A4. Vercel CLI (terminal, builds for you)

```bash
npx vercel           # log in, accept the defaults (Framework: Vite, Output: dist)
npx vercel --prod    # publish to the production URL
```

URL: `https://<project-name>.vercel.app`.

---

## Approach B: Connect a Git repository (auto-deploy)

With this setup, every time you `git push`, the host rebuilds and publishes the site automatically.

### Step 1: Create a local Git repository

```bash
cd "/home/ar-in-u-461/Scheduler Assistant"
git init
git add .
git commit -m "Initial agency website"
```

`.gitignore` already excludes `node_modules`, `dist` and `.env`, so secrets and build output aren't committed.

### Step 2: Push to a remote

**GitHub:**
1. Create an **empty** repository at <https://github.com/new> (no README, no .gitignore). Private is fine.
2. Connect and push:
   ```bash
   git remote add origin https://github.com/<your-username>/nexora-health-site.git
   git branch -M main
   git push -u origin main
   ```

GitLab and Bitbucket work the same way. Use the remote URL they show you.

### Step 3: Connect a host to the repository

Pick **one**. All of them are free for a site like this.

#### Netlify
1. <https://app.netlify.com> → *Add new site* → *Import an existing project* → choose GitHub → select the repo.
2. Settings are read from `netlify.toml` in this project automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Click *Deploy*. URL: `https://<name>.netlify.app`.

#### Vercel
1. <https://vercel.com/new> → import the GitHub repo.
2. Framework preset **Vite** is detected (Build: `npm run build`, Output: `dist`).
3. Click *Deploy*. URL: `https://<name>.vercel.app`.

#### Cloudflare Pages
1. <https://dash.cloudflare.com> → *Workers & Pages* → *Create* → *Pages* → *Connect to Git*.
2. Framework preset: **Vite** (or set Build command `npm run build`, Output directory `dist`).
3. Under *Environment variables*, add `NODE_VERSION` = `22`.
4. *Save and Deploy*. URL: `https://<name>.pages.dev`.

#### GitHub Pages
GitHub Pages serves the site from a sub-path (`https://<user>.github.io/<repo>/`), so the build needs to know that path.

1. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: npm
         - run: npm ci
         - run: npm run build
           env:
             BASE_PATH: /${{ github.event.repository.name }}/
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
         - uses: actions/deploy-pages@v4
   ```
2. In the repo: *Settings → Pages → Source: GitHub Actions*.
3. Push to `main`. The site appears at `https://<user>.github.io/<repo>/`.

### Step 4: Ship updates

```bash
git add .
git commit -m "Update pricing"
git push
```

The host rebuilds and the live site updates in about a minute. Netlify, Vercel and Cloudflare also create a **preview URL for every branch or pull request**, which is useful for showing changes to someone before they go live.

---

## Contact form email

The form works without setup: it opens the visitor's email app with a pre-filled message. To receive submissions directly in your inbox:

1. Pick a free form service:
   - **Web3Forms**: <https://web3forms.com>. Enter your email to get an access key (250 submissions/month).
   - **Formspree**: <https://formspree.io>. Create a form to get an endpoint (50 submissions/month).
2. Set the variables:

   | Variable | Web3Forms | Formspree |
   |---|---|---|
   | `VITE_FORM_ENDPOINT` | `https://api.web3forms.com/submit` | `https://formspree.io/f/<id>` |
   | `VITE_WEB3FORMS_KEY` | your access key | *(leave empty)* |

3. Where to set them:
   - **Local / Approach A:** copy `.env.example` to `.env`, fill it in, then run `npm run build`. The values are baked into `dist/`.
   - **Approach B:** add them in the host's dashboard (*Site settings → Environment variables* on Netlify, *Project → Settings → Environment Variables* on Vercel, *Settings → Variables* on Cloudflare), then redeploy.
4. Submit a test request on the live site and confirm the email arrives.

> `VITE_*` values end up in the public JavaScript bundle. That's expected for these form keys. Never put private secrets (database passwords, payment secret keys) in `VITE_*` variables.

---

## Custom domain (e.g. `nexorahealth.com`)

1. Buy a domain from any registrar (GoDaddy, Namecheap, Cloudflare, Hostinger; ~₹800–1,000/year for `.com`, less for `.in`).
2. In your host: *Domains → Add custom domain* → enter it.
3. Add the DNS records the host shows you at your registrar. Usually that's:
   - `CNAME` `www` → `<your-site>.netlify.app` (or the Vercel / Pages equivalent)
   - an `A` / `ALIAS` record for the root domain, if the host asks for one
4. HTTPS certificates are issued automatically and for free, usually within minutes. DNS changes can take up to 24 hours.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page after deploy, console shows 404s for `/assets/...` | You're on a sub-path (e.g. GitHub Pages). Build with `BASE_PATH=/<repo>/ npm run build`. |
| Build fails on the host with a Node / syntax error | Set Node version 22 (`NODE_VERSION=22` env var; already set in `netlify.toml`). |
| Build fails with a TypeScript error | Run `npm run build` locally, fix the error shown, commit, push. |
| Contact form still opens the email app | `VITE_FORM_ENDPOINT` wasn't set at **build** time. Add it and redeploy. |
| Netlify Drop site disappeared | It wasn't claimed. Log in and drop `dist` again. |
| Changes not showing | Hard refresh (Ctrl+Shift+R). Check the host's deploy log finished successfully. |
| Fonts look different | Google Fonts is blocked on that network. The site falls back to system fonts automatically. |
