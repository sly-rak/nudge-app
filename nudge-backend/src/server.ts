import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { authRoutes } from './modules/auth/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { friendRoutes } from './modules/friends/routes.js';
import { chatRoutes } from './modules/chat/routes.js';
import { storyRoutes } from './modules/stories/routes.js';
import { gameRoutes } from './modules/games/routes.js';
import { realtimeGateway } from './realtime/gateway.js';

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
    },
  });

  // Allow empty bodies on JSON requests (e.g. POST /archive)
  server.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      const trimmed = typeof body === 'string' ? body.trim() : '';
      const json = trimmed ? JSON.parse(trimmed) : {};
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Enable CORS
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Register JWT
  await server.register(jwt, {
    secret: config.jwtSecret,
  });

  // Register WebSockets
  await server.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', service: 'nudge-backend', timestamp: new Date().toISOString() };
  });

  // Real-time WebSocket Gateway
  server.register(async function (fastify) {
    fastify.get('/v1/ws', { websocket: true }, (socket, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        socket.send(JSON.stringify({ t: 'error', d: { code: 'UNAUTHENTICATED', message: 'Token required' } }));
        socket.close();
        return;
      }

      try {
        const decoded = fastify.jwt.verify<{ id: string; username: string }>(token);
        realtimeGateway.register(decoded.id, socket);
      } catch (err) {
        socket.send(JSON.stringify({ t: 'error', d: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } }));
        socket.close();
      }
    });
  });

  // REST API Routes under /v1
  server.register(authRoutes, { prefix: '/v1/auth' });
  server.register(userRoutes, { prefix: '/v1/users' });
  server.register(friendRoutes, { prefix: '/v1/friends' });
  server.register(chatRoutes, { prefix: '/v1/conversations' });
  server.register(storyRoutes, { prefix: '/v1/stories' });
  server.register(gameRoutes, { prefix: '/v1/games' });

  return server;
}
