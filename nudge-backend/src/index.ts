import { buildServer } from './server.js';
import { config } from './config/index.js';

async function start() {
  const server = await buildServer();

  try {
    const address = await server.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`[Nudge Backend] Server running at ${address}`);
    console.log(`[Nudge Backend] WebSocket endpoint at ws://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}/v1/ws`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
