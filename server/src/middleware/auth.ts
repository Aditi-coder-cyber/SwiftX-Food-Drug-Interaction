import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
    user?: IUser;
}

/**
 * Required auth middleware — rejects unauthenticated requests.
 */
export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Authentication required. Please log in.',
                },
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'fallback-secret';

        const decoded = jwt.verify(token, secret, {
            ignoreExpiration: false,
        }) as { id: string };

        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User associated with this token no longer exists.',
                },
            });
            return;
        }

        req.user = user;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Session expired. Please log in again.',
                },
            });
            return;
        }
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid authentication token.',
                },
            });
            return;
        }
        next(error);
    }
};

/**
 * Optional auth middleware — attaches user if token is present, but doesn't reject.
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'fallback-secret';

            const decoded = jwt.verify(token, secret, {
                ignoreExpiration: false,
            }) as { id: string };

            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch {
        // If token is invalid for optional auth, just continue without user
        next();
    }
};
