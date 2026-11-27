import { httpServerHandler } from 'cloudflare:node';
import { createApp, expirePendingPayments, sendInstallmentReminders } from './server.js';

export default {
  fetch(request, env, _ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    // Create the Express app per-request using the Worker env binding.
    // This ensures env vars (SUPABASE_URL, STRIPE_SECRET_KEY, etc.) are
    // resolved from Cloudflare secrets rather than process.env.
    const app = createApp(env);
    const server = app.listen(8080);
    const httpHandler = httpServerHandler(server);
    return httpHandler.fetch(request, env, _ctx);
  },

  scheduled(_controller, env, context) {
    context.waitUntil(Promise.all([
      expirePendingPayments(env),
      sendInstallmentReminders(env),
    ]));
  },
};
