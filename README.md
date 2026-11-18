# Nexora Health Labs: Agency Website for MediSlot

A marketing website for your agency that sells **MediSlot**, a white-label doctor appointment platform with **Patient**, **Doctor** and **Admin** portals.

Built with **React 19 + TypeScript + Vite**. The code is split into typed components, data files and a single site config, so it's easy to extend later with routing, a backend, auth, or the real portals.

📄 **Docs:** [How the website works](docs/HOW_IT_WORKS.md) · [Deployment guide (hosting remotely)](docs/DEPLOYMENT.md)

## What's on the site

| Section | What it does |
|---|---|
| Hero | Headline, call-to-action and an animated dashboard mockup |
| Why clinics switch | Before/after comparison and the three portals |
| **Live demo** | Interactive preview: book a slot as a patient, manage the queue as a doctor, switch analytics ranges as an admin |
| Features, How we work | 9 product features, 4-step onboarding process |
| **ROI calculator** | Prospects estimate the extra monthly revenue they'd get |
| Pricing | 3 plans with an INR / USD toggle. Clicking a plan pre-selects it in the contact form |
| Testimonials, FAQ | Social proof and objection handling |
| **Contact form** | Validated demo-request form (email delivery via Formspree / Web3Forms, or mailto fallback) |
| WhatsApp button | Floating "chat on WhatsApp" link |

Fully responsive, keyboard accessible, and it respects "reduced motion".

## Project structure

```
.
├── index.html                 # HTML shell, SEO meta tags, fonts
├── public/favicon.svg
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Page composition (section order lives here)
│   ├── config/site.ts         # ⭐ Agency name, product name, email, phone, WhatsApp, nav links
│   ├── data/
│   │   ├── marketing.ts       # ⭐ Features, pricing plans, testimonials, FAQs, stats
│   │   └── demo.ts            # Mock doctors, queue and analytics used by the live demo
│   ├── sections/              # One component per page section
│   │   ├── Hero.tsx, WhySwitch.tsx, Features.tsx, Process.tsx, RoiCalculator.tsx,
│   │   ├── Pricing.tsx, Testimonials.tsx, Faq.tsx, Contact.tsx, CtaBand.tsx, Logos.tsx
│   │   └── demo/              # DemoSection + PatientDemo, DoctorDemo, AdminDemo
│   ├── components/
│   │   ├── layout/            # Navbar, Footer, Logo, WhatsAppButton
│   │   └── ui/                # Icon, Reveal (scroll animation), CountUp, Toast, SectionHeader
│   ├── hooks/useInView.ts
│   ├── lib/
│   │   ├── format.ts          # Currency/date helpers, `cx` class-name helper
│   │   └── leads.ts           # Contact-form submission (swap for your own API later)
│   ├── types/index.ts         # Shared TypeScript types
│   └── styles/global.css      # All styling. Brand colours are CSS variables at the top
├── vite.config.ts             # `@/` import alias → src/
└── tsconfig.json
```

---

## 1. Run it locally

Requirements: **Node.js 20+** (check with `node -v`).

```bash
npm install        # first time only
npm run dev        # start the dev server with hot reload
```

Open **http://localhost:5173**. Edits to any file update the page instantly.

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks, then builds an optimized static site into `dist/` |
| `npm run preview` | Serves the built `dist/` locally at http://localhost:4173 to test the production build |
| `npm run typecheck` | Type-checks only |

To test on your phone (same Wi-Fi): run `npm run dev -- --host` and open the "Network" URL it prints.

---

## 2. Customise before you share it

1. **Names & contact details**: edit `src/config/site.ts`. Agency name, product name, logo initial, email, phone, WhatsApp number and location are all used throughout the site from here.
   - Also update the `<title>` / meta description in `index.html` and the letter in `public/favicon.svg`.
2. **Pricing, features, FAQs, testimonials, stats**: edit `src/data/marketing.ts`.
3. **Brand colours**: change `--primary` and `--teal` at the top of `src/styles/global.css`.
4. **Testimonials and client logos are placeholders.** Replace them with real ones as soon as you have them.

### Receive contact-form submissions by email (free)

By default, submitting the form opens the visitor's email app with a pre-filled message. To receive submissions straight to your inbox instead:

```bash
cp .env.example .env
```

Then fill in **one** of these:

- **Formspree** (50/month free): create a form at <https://formspree.io> and set
  `VITE_FORM_ENDPOINT=https://formspree.io/f/yourid`
- **Web3Forms** (250/month free, no account): get a key at <https://web3forms.com> and set
  `VITE_FORM_ENDPOINT=https://api.web3forms.com/submit` and `VITE_WEB3FORMS_KEY=your-key`

Restart `npm run dev` after editing `.env`. When you deploy, either build locally (the values are baked into `dist/`) or add the same variables in your host's *Environment variables* settings.

> These keys are public by design (they end up in the browser bundle). Don't put real secrets in `VITE_*` variables.

---

## 3. Host it for free

First build the site:

```bash
npm run build
```

This creates a `dist/` folder: plain static files you can upload anywhere. **None of the options below require pushing to a Git repository.**

### Option A: Netlify Drop (easiest, ~1 minute, no CLI)

1. Run `npm run build`.
2. Go to <https://app.netlify.com/drop>.
3. Drag and drop the **`dist` folder** (not the whole project) onto the page.
4. You get a live URL like `https://random-name-123.netlify.app` instantly.
5. Without an account, the site expires after about an hour. Sign up for free (or click "claim site") to keep it, then rename it under *Site configuration → Change site name*.

To update: rebuild, then drag `dist` onto the site's *Deploys* tab.

### Option B: Surge.sh (one command)

```bash
npm run build
npx surge dist nexora-health.surge.sh
```

On first run it asks for an email and password to create a free account. Re-run to redeploy.

### Option C: Vercel CLI

```bash
npx vercel          # log in with email; accept the detected "Vite" settings
npx vercel --prod   # promote to your production URL
```

Vercel builds the project for you. You get a URL like `https://your-project.vercel.app`.

### Option D: Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name nexora-health
```

Or use the dashboard: <https://dash.cloudflare.com> → *Workers & Pages* → *Create* → *Pages* → *Upload assets* → drop `dist`. You get `https://nexora-health.pages.dev`.

### Option E: Share your localhost temporarily (no deploy at all)

Good for showing a client the site live on a call. The link works only while your computer is running it.

```bash
# Terminal 1
npm run build && npm run preview      # serves on http://localhost:4173

# Terminal 2: pick one
npx localtunnel --port 4173                         # → https://xxxx.loca.lt
cloudflared tunnel --url http://localhost:4173      # → https://xxxx.trycloudflare.com (needs cloudflared)
```

> If a tunnel shows "Blocked request. This host is not allowed", add `preview: { allowedHosts: true }` to `vite.config.ts`.

### Later: GitHub Pages

When you're ready to use a repository, build with the repo name as the base path, then publish `dist/`:

```bash
BASE_PATH=/your-repo-name/ npm run build
```

(Or use the official "Deploy static content to Pages" GitHub Action.)

### Custom domain

All of the hosts above (except tunnels) let you attach your own domain for free under their *Domains* settings. You only pay for the domain itself (~₹800–1,000/year).

---

## 4. Extending it later

- **More pages** (blog, case studies, privacy policy): `npm i react-router-dom`, wrap `App` in a router, and move the current sections into a `pages/Home.tsx`. If you deploy a router-based site, add an SPA fallback (Netlify: a `public/_redirects` file with `/* /index.html 200`).
- **Real lead handling / CRM**: replace the body of `submitLead()` in `src/lib/leads.ts` with a call to your own API, HubSpot, Supabase, etc. The form component doesn't need to change.
- **The actual product portals**: the demo components in `src/sections/demo/` are a good starting point for real Patient/Doctor/Admin screens backed by an API.
- **Analytics**: add Google Analytics, Plausible or Umami by pasting their script tag into `index.html`.

## 5. Pre-launch checklist

- [ ] `src/config/site.ts` updated (name, email, phone, WhatsApp)
- [ ] `<title>` and meta description in `index.html` updated
- [ ] Contact form endpoint configured and tested with a real submission
- [ ] Pricing reviewed in `src/data/marketing.ts`
- [ ] Placeholder testimonials/logos replaced or removed
- [ ] Privacy / Terms links in the footer pointed to real pages
- [ ] Tested on mobile
# Health-Appointment-Assistant
