# EventStream / HookRelay — Operations Console

React/Vite operations console for the EventStream / HookRelay API. It includes protected client-side routes for the overview, event activity, dead letter queue, endpoints, workspace settings, and sign-in.

```text
src/
├── api/          # HTTP and SSE endpoint configuration
├── components/   # Small presentational dashboard blocks
├── pages/        # Route-level console views
├── auth/         # Local development session provider
├── data/         # Demo data shown before the live SSE stream connects
├── hooks/         # Reusable connection/state logic
├── styles/        # Global Tailwind styles and design tokens
├── App.jsx        # Page composition and user interactions
└── main.jsx       # Browser entry point
```

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` must point at the backend's `/api/v1` base URL. The dashboard keeps a small sample feed visible until it receives live `delivery` events from the backend SSE route.
