import { httpServerHandler } from 'cloudflare:node';
import { createApp, expirePendingPayments } from './server.js';

export default {
  fetch(request, env, _ctx) {
    // Create the Express app per-request using the Worker env binding.
    // This ensures env vars (SUPABASE_URL, STRIPE_SECRET_KEY, etc.) are
    // resolved from Cloudflare secrets rather than process.env.
    const app = createApp(env);
    const server = app.listen(8080);
    const httpHandler = httpServerHandler(server);
    return httpHandler.fetch(request, env, _ctx);
  },

  scheduled(_controller, env, context) {
    context.waitUntil(expirePendingPayments(env));
  },
};
