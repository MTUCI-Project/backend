import express, { type NextFunction, type Request, type Response } from 'express';
import pinoHttp from 'pino-http';
import type { IncomingHttpHeaders } from 'node:http';
import 'reflect-metadata';

import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { httpLogger } from './config/logger';
import { env } from './config/env';
import { requestIdMiddleware } from './http/middlewares/requestId.middleware';
import { notFoundMiddleware } from './http/middlewares/notFound.middleware';
import { errorMiddleware } from './http/middlewares/error.middleware';

import { RegisterRoutes } from './generated/routes';
import { healthRouter } from './http/routes/health.route';
import swaggerSpec from './generated/swagger.json';

function shouldIgnoreHttpLog(url?: string) {
    if (!url) return false;
    return (
        url === '/health' ||
        url === '/healthz' ||
        (env.NODE_ENV === 'production' && url.startsWith('/docs'))
    );
}

function serializeHeaders(headers: IncomingHttpHeaders) {
    if (env.NODE_ENV === 'production') {
        return undefined;
    }

    return headers;
}

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
    const origin = req.header('Origin');

    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'
        );
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Authorization, Content-Type, X-Request-Id'
        );
        res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
}

export function createApp() {
    const app = express();

    app.disable('x-powered-by');
    app.use(requestIdMiddleware);

    app.use(
        pinoHttp({
            logger: httpLogger,
            genReqId: (req) => (req as any).requestId,
            customLogLevel: (_req, res, err) => {
                if (err || res.statusCode >= 500) return 'error';
                if (res.statusCode >= 400) return 'warn';
                if (env.NODE_ENV === 'production') return 'silent';
                if (res.statusCode >= 300) return 'debug';
                return 'info';
            },
            customProps: (req) => ({
                requestId: (req as any).requestId,
                userId: (req as any).user?.id,
                remoteAddress: req.socket?.remoteAddress,
            }),
            autoLogging: {
                ignore: (req) => shouldIgnoreHttpLog(req.url),
            },
            serializers: {
                req(req) {
                    return {
                        method: req.method,
                        url: req.url,
                        headers: serializeHeaders(req.headers),
                    };
                },
                res(res) {
                    return {
                        statusCode: res.statusCode,
                    };
                },
            },
        })
    );

    app.use(corsMiddleware);
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use(cookieParser());

    RegisterRoutes(app);

    // Health check route
    app.use('/', healthRouter);

    if (env.NODE_ENV !== 'production') {
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
}
