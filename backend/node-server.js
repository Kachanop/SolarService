import 'dotenv/config';
import { createApp } from './server.js';

const port = Number(process.env.PORT) || 3001;
const app = createApp(process.env);
app.listen(port, () => console.log(`SolarService payment API listening on port ${port}`));
