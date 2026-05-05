import { initDb } from './db.js';
import { startWorker } from './worker.js';
import server from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

initDb();
startWorker();

const transport = new StdioServerTransport();
await server.connect(transport);
