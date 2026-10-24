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

## Editing the site

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
