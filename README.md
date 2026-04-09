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
