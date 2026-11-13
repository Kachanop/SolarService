import 'dotenv/config';
import { app } from './server.js';

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`SolarService payment API listening on port ${port}`));
