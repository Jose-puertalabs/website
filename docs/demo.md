[demo.md](https://github.com/user-attachments/files/34094779/demo.md)
# Demo app

A simulated prototype of the Puerta app, for conversations with partners. Everything in it is made up.

## Where it lives

| URL | What | File |
|---|---|---|
| `/demo/` | Demo landing page with an "App" link | `public/demo/index.html` |
| `/demo/app/` | The simulated app (wallet connect, subscribe, redeem, pledge) | `public/demo/app/` |

The demo is **unlisted**: it is not linked from the main site, `public/robots.txt` asks search engines to skip `/demo/`,
and both pages carry `noindex`. That discourages discovery but is not security. Anyone with the link can open it.

## Folder structure

```
public/
├── robots.txt
└── demo/
    ├── index.html          Landing page with the "App" link
    ├── assets/logo.svg     Logo (outlined, no font needed)
    └── app/
        ├── index.html      Page structure and wallet dialog
        ├── styles.css      Palette and layout
        └── app.js          Wallet connection and simulated flows
docs/
└── demo.md                 This file (not published: it is outside public/)
```

## Rules for the demo

1. Keep the "Simulated demonstration" banner and the footer disclaimer on every page.
2. Use placeholder names only ("Example ..."). Do not name real asset managers, custodians, exchanges or investors.
3. Do not show real yields, returns or prices, and do not describe anything as available to buy.
4. The demo must never request a signature or a transaction from a wallet. It only reads the address and network.
5. Do not link the demo from the public homepage, or share it beyond partners and counsel, until your lawyers
   have reviewed it. Before authorisation, anything that looks like a live product can be read as marketing an
   investment service.
6. Do not commit secrets, keys or personal data. This repository is public.

## Running it locally

From the repository root:

```
cd public
python3 -m http.server 8000
```

Open http://localhost:8000/demo/ in a browser. (Opening the files directly also works, except the favicon.)

## What the demo does

- **Connect** (top right): a browser wallet (any EIP-1193 EVM wallet such as MetaMask) or a simulated demo wallet.
  It reads the address and network. Nothing else.
- **Simulated verification**: stands in for professional-investor checks and registry whitelisting.
- **Subscribe and redeem**: orders are priced at the next NAV and step through the real flow (distributor, depositary
  cash, pricing, registry mint or burn). Units appear in "Your position".
- **Pledge as collateral**: lock units for an example counterparty and see a simulated credit line after a haircut.

## Changing the simulated data

All in `public/demo/app/app.js`, near the top:

- `COUNTERPARTIES`: names and haircuts.
- `MIN_SUBSCRIPTION`: minimum order.
- `navAt`: the simulated NAV curve.
- `STEP_MS`: speed of the order steps.

Copy changes are in `public/demo/app/index.html`. Colours are the variables at the top of `styles.css`.

## Working in GitHub

1. Create a branch called `demo` (Branch menu, "New branch").
2. Make changes on that branch and commit them.
3. Open a pull request into `main` and read the diff.
4. Merge. The "Deploy website to GitHub Pages" workflow publishes everything in `public/`, so the demo goes live
   at `puertalabs.com/demo/` once merged.

## Later phases (not built)

- Testnet smart contracts: a permissioned fund-unit token with whitelist, mint and burn restricted to the registry
  role, and lock and pledge functions.
- Other wallet types (Cardano CIP-30, Solana Wallet Standard) if the target chain changes.
- A connection to a partner's sandbox API for real order status, once a partner exists.
- Legal review of the demo before any public link.
