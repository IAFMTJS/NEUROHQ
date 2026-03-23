# Authenticated Smoke Tests

This folder contains Playwright smoke tests for the core authenticated flow:

- sign in
- dashboard load
- report tabs (`patterns`, `diagnostics`)
- strategy tab deeplink (`alignment`)
- growth tab deeplinks (`command`, `system`)

## Run

```bash
E2E_EMAIL="you@example.com" E2E_PASSWORD="secret" npm run test:smoke
```

On Windows PowerShell:

```powershell
$env:E2E_EMAIL="you@example.com"
$env:E2E_PASSWORD="secret"
npm run test:smoke
```

By default tests use `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`.

If you want Playwright to start the app itself, set:

- `PLAYWRIGHT_START_SERVER=1`

then run `npm run test:smoke`.
