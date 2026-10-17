# UniTask frontend

React and Vite client for UniTask. See the [project README](../README.md) for environment requirements, backend setup, features, and troubleshooting.

```powershell
npm ci
npm run dev
npm run build
npm run lint
npm test
```

The development server proxies `/api` to port 5000. Vitest runs tests under `src/`; Playwright runs browser tests under `tests/` using `npx playwright test`.
