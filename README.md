# Realtime Arena - Color Clash

Real-time multiplayer color Stroop game. Vite + React on the front end,
Express + Socket.IO on the back end, single process deployable to Render.

## How to play

You see a color word (e.g. RED) printed in a different ink (e.g. green).
Tap the button matching the INK color, not the word. Faster = more points.

## Local development

    npm run install:all
    npm run build
    npm start             # serves on http://localhost:3001

With HMR in two terminals:

    npm run dev:server    # http://localhost:3001
    npm run dev:client    # http://localhost:5173

## Smoke test (3 simulated players, full 5-round match)

    npm start             # in terminal A
    npm test              # in terminal B

## Deploy to Render

The included render.yaml makes it a Blueprint deploy. In Render:

- New -> Blueprint -> pick this repo
- It auto-fills build / start / health check
- Wait for "Build successful" then open the issued .onrender.com URL

Or do it manually:

- New -> Web Service -> connect repo
- Build Command: npm run build
- Start Command: npm start
- Health Check Path: /healthz

## License

MIT
