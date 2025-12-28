import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from './app-error';
import { logger } from '@/lib/logger';

type ApiHandler<T> = (req: Request, ...args: any[]) => Promise<T>;

/**
 * Wraps an API route handler with standard error handling and logging.
 */
export function apiHandler<T>(handler: ApiHandler<T>) {
    return async (req: Request, ...args: any[]) => {
        const start = Date.now();
        const method = req.method;
        const url = req.url;

        // Generate Request ID (simplified)
        const requestId = crypto.randomUUID();
        const requestLog = logger.child({ requestId, method, url });

        try {
            // requestLog.info('Request started');

            const result = await handler(req, ...args);

            const duration = Date.now() - start;
            // requestLog.info({ duration }, 'Request completed');

            // If the handler returns a Response object directly, return it
            if (result instanceof Response) {
                return result;
            }

            // Otherwise, assume it's a JSON payload
            return NextResponse.json({
                success: true,
                data: result,
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`
                }
            });

        } catch (err) {
            const duration = Date.now() - start;
            requestLog.error({ err, duration }, 'Request failed');

            if (err instanceof AppError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: err.code,
                            message: err.message,
                        },
                        meta: {
                            requestId,
                            timestamp: new Date().toISOString()
                        }
                    },
                    { status: err.statusCode }
                );
            }

            if (err instanceof z.ZodError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid request data',
                            details: err.errors
                        },
                        meta: {
                            requestId,
                            timestamp: new Date().toISOString()
                        }
                    },
                    { status: 400 }
                );
            }

            // Fallback for unhandled errors
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An unexpected error occurred'
                    },
                    meta: {
                        requestId,
                        timestamp: new Date().toISOString()
                    }
                },
                { status: 500 }
            );
        }
    };
}
