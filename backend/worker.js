import { httpServerHandler } from 'cloudflare:node';
import { app, expirePendingPayments } from './server.js';

const server = app.listen(8080);
const httpHandler = httpServerHandler(server);

export default {
  fetch: httpHandler.fetch,
  scheduled(_controller, _env, context) {
    context.waitUntil(expirePendingPayments());
  },
};
