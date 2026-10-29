# Puerta Labs website

Public website for Puerta Labs B.V., served with GitHub Pages.

## Structure

```
website/
├── .github/workflows/pages.yml   Deploys the public/ folder automatically
├── public/                       Everything in here is published
│   ├── index.html                The one-page site
│   └── favicon.svg               Browser tab icon
├── .gitignore
└── README.md
```

Only the `public/` folder is published. Nothing else in this repository is visible on the website.

## Investment application demo

The landing page remains at `/`. Its **Go to app** link opens `/app/`.
The app uses plain HTML, CSS and JavaScript modules, with no runtime dependencies or build step.
Hash routes (`/app/#/explore` and `/app/#/fund/spanish-sovereign`) work on GitHub Pages, including direct links and refreshes.

With Node.js 22 or newer installed:

```sh
npm run dev
```

On Windows PowerShell with script execution restricted, use `npm.cmd run dev`, `npm.cmd run check` and `npm.cmd test`.

Open http://127.0.0.1:4173 (landing) or http://127.0.0.1:4173/app/ (app).
Use an HTTP server rather than opening the app as a local file, because it uses JavaScript modules.

```sh
npm run check
npm test
```

`check` runs JavaScript syntax checks; tests cover fund data, filters, sorting and subscription arithmetic.
There is no configured linter, TypeScript checker or build command. GitHub Pages continues to publish `public/` directly.

App files:

- `public/app/index.html`: accessible application shell and loading state.
- `public/app/app.css`: responsive styles using the existing Puerta palette and type families.
- `public/app/funds.js`: centralized fictional funds, formatting, selection and calculation functions.
- `public/app/app.js`: Explore table, reusable fund details, tabs, charts, routing and simulated subscriptions.

All 16 funds, bond positions, NAV paths and allocations are fictional. Summary analytics are independently illustrative, not calculated from a priced portfolio. Risk labels are internal demo categories. Documents are planned placeholders. AUM sorting compares numeric amounts in each fund's local currency without FX conversion. No return or distribution is projected. No wallet, payments, backend, portfolio dashboard or actual subscriptions are implemented.

The existing policy below describes the public landing page. This explicitly requested application is a fictional product demo, not a live fund offering. Review it before any publication; changes are not automatically pushed by local development.

## Editing the landing page

1. Open `public/index.html` on GitHub and click the pencil icon.
2. Change the text between the tags, then commit to `main`.
3. The "Deploy website to GitHub Pages" workflow runs and the site updates in a minute or two.

Preview a change before committing by downloading the file and opening it in a browser.

Placeholders to replace before launch are listed in an HTML comment at the top of `index.html`
(contact email, KVK number, registered address, VAT number).

## Deployment

- Settings → Pages → Source must be set to **GitHub Actions**.
- The custom domain is set in Settings → Pages (a `CNAME` file is not used with this method).
- If a deployment fails, open the run in the **Actions** tab and read the red step.

## Rules for this repository

This repository is public. Never commit:

- strategy, legal, regulatory or partner information (that belongs in the private `internal` repository)
- passwords, API keys, ID documents or personal data
- unreleased material about any asset manager, custodian or partner

The site must stay on the technology side of the line: no offers, yields, product lists or investor sign-ups
until licensing and partners allow it. See `internal/docs/02-regulatory-map.md`.

## Licence

Copyright (c) Puerta Labs B.V. All rights reserved.
No licence is granted to copy or reuse the code, text or brand assets.
