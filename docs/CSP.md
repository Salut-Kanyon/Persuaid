# Content Security Policy (CSP) and live transcript

If live transcription works on `localhost` but fails on the deployed site with **CSP / `unsafe-eval` / script-src blocked**:

1. **This repo** sets a CSP in `next.config.js` that allows what Next.js and the mic/WebSocket stack typically need (`script-src` includes `'unsafe-eval'` and `'unsafe-inline'`, `connect-src` allows `https:` / `wss:` / `ws:` for APIs and STT).

2. **If you still see CSP errors**, another layer may be adding a **second** CSP (stricter). Browsers apply **all** CSPs — every policy must be satisfied — so a Cloudflare / reverse-proxy / GitHub rule without `'unsafe-eval'` can still block scripts.
   - Check **Cloudflare** → Security → Settings (disable “Replace insecure JS” experiments if any).
   - Check **Vercel** → Project → no extra CSP in `vercel.json` that conflicts.
   - Check **browser extensions** (ad blockers) — try an incognito window with extensions disabled.

3. **Do not** rely on disabling CSP globally in production without review; tighten `connect-src` to your real Supabase host and STT relay URL when you can.

4. **Static export** (`OUTPUT_STATIC=1` / GitHub Pages): `next.config.js` `headers()` may not apply. Use your host’s header rules (e.g. Cloudflare Page Rules, Netlify `_headers`) with the same CSP ideas, or deploy the full Next server (e.g. Vercel) so `headers()` runs.
