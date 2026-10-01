import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/env.js';
import { logger } from './observability/logger.js';
import { registerV1Routes } from './api/routes/v1.routes.js';
import { dbService } from './database/client.js';
import { redisService } from './redis/client.js';
import { AuthenticationError } from './auth/authentication/authenticator.js';

export async function buildServer() {
  const app = Fastify({
    logger: false, // Managed by our custom structured ScopedLogger
    trustProxy: true,
  });

  // 1. Setup CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // 2. Setup OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'AI Chatbot Orchestration Service API',
        description: 'OpenAPI specification for LangGraph AI Service handling commerce, support, and RAG workflows',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: 'Local development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // 3. Map authentication failures to 401 on every route
  app.setErrorHandler((err: any, _req, reply) => {
    if (err instanceof AuthenticationError) {
      reply.status(401).send({ error: 'Unauthorized', message: err.message });
      return;
    }

    const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    if (statusCode >= 500) {
      logger.error('Unhandled request error', err);
    }
    reply.status(statusCode).send({
      error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Request Error',
      message: err.message,
    });
  });

  // 4. Register Versioned Routes
  await app.register(registerV1Routes, { prefix: '/api/v1' });

  // Root redirect
  app.get('/', async (_req, reply) => {
    reply.send({
      name: 'AI Chatbot Platform API',
      version: '1.0.0',
      docs: '/docs',
      health: '/api/v1/health',
    });
  });

  return app;
}

async function startServer() {
  const app = await buildServer();

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info(`🚀 AI Service running on http://${config.HOST}:${config.PORT}`);
    logger.info(`📚 OpenAPI Documentation available at http://localhost:${config.PORT}/docs`);
  } catch (err) {
    logger.error('Failed to start AI Service', err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    await dbService.close();
    await redisService.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start if executed directly
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  startServer();
}
