// Import the config first to ensure environment variables are loaded
import { config } from './lib/config.js';

import express from 'express';
import cors from 'cors';
import mcpRoutes from './routes/mcp.js';
import hubRoutes from './routes/hub.js';
import hostRoutes from './routes/host.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/v1/mcp', mcpRoutes);
app.use('/v1/hub', hubRoutes);
app.use('/v1/host', hostRoutes);

app.listen(config.server.port, '0.0.0.0', () => {
  console.log(`Server running on port ${config.server.port}`);
});