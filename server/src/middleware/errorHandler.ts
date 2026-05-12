import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', err.message);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
            },
        });
        return;
    }

    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
        res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'An account with this email already exists.',
            },
        });
        return;
    }

    // Mongoose cast error (bad ObjectId, etc.)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: 'Invalid resource identifier.',
            },
        });
        return;
    }

    // Default server error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: {
            code: 'SERVER_ERROR',
            message:
                process.env.NODE_ENV === 'production'
                    ? 'An unexpected error occurred.'
                    : err.message,
        },
    });
};
