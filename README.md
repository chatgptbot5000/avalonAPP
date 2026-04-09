# Avalon Web Game

Local MVP for hosting an Avalon room in the browser, joining with a room code, and progressing from lobby setup into the game table flow.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start the app locally:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

## Oracle Cloud VM

This app runs best on a single always-on Node server.

1. Create an Oracle Cloud Always Free VM.
2. Allow inbound TCP on port `3000` in the VM firewall/security list.
3. Install Node.js 20+.
   - If you use `nvm`, make sure the VM user shell loads it for non-interactive sessions or install Node into a system path like `/usr/local/bin`.
4. Clone this repo onto the VM.
5. From `avalonAPP/`, run:

```bash
npm install
npm run build
npm start
```

6. Open `http://<your-vm-public-ip>:3000` in a browser.

The in-memory room state stays available while the VM process is running, which keeps room joins, live updates, and game phases reliable without Redis or a serverless rewrite.

## Auto deploy from GitHub

Pushes to `main` can redeploy the Oracle VM with GitHub Actions.

1. On the VM, clone this repo into a stable path such as `/home/ubuntu/avalonAPP`.
2. From that directory, run the deploy script once:

```bash
bash deploy/oracle/deploy.sh
```

3. In GitHub, add these repository secrets:

- `ORACLE_HOST`
- `ORACLE_USER`
- `ORACLE_PORT`
- `ORACLE_APP_DIR`
- `ORACLE_SSH_KEY`

4. The workflow at `.github/workflows/deploy-oracle.yml` SSHes into the VM, pulls `main`, runs `npm install`, rebuilds, and restarts the room server.

## Test commands

Run the unit test suite:

```bash
npm test
```

Run the end-to-end suite:

```bash
npm run test:e2e
```

Run the Task 10 room-join flow directly:

```bash
npm run test:e2e -- e2e/avalon.spec.ts
```

If Playwright browsers are not installed yet, run:

```bash
npx playwright install chromium
```

## MVP flow

1. Enter a display name on the home page.
2. The host creates a room and shares the four-character room code.
3. A second player enters the same room code and joins the table.
4. Both players land on the room page and see the shared lobby roster update.
5. The host can use the room as the starting point for the rest of the Avalon MVP game flow.
