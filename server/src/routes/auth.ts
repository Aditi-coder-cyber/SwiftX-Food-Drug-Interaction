import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateEmailOTP } from '../services/totpService';
import { sendOTPEmail } from '../services/emailService';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new user account and return JWT.
 */
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Name, email, and password are required.',
                },
            });
            return;
        }

        // Check password strength
        if (password.length < 8) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'WEAK_PASSWORD',
                    message: 'Password must be at least 8 characters.',
                },
            });
            return;
        }

        // Check for existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'An account with this email already exists.',
                },
            });
            return;
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    riskProfile: user.riskProfile,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to create account. Please try again.',
            },
        });
    }
});

/**
 * POST /api/auth/login
 * Verify credentials. If 2FA enabled → return tempToken; otherwise → return JWT.
 */
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email and password are required.',
                },
            });
            return;
        }

        // Find user with password field included
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email or password is incorrect.',
                },
            });
            return;
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email or password is incorrect.',
                },
            });
            return;
        }

        /* ─── 2FA Check ────────────────────────────────────────────── */
        if (user.twoFactorEnabled && user.twoFactorMethod) {
            // Generate temp token (NOT usable for auth — type: '2fa')
            const tempToken = jwt.sign(
                { userId: user._id, type: '2fa', method: user.twoFactorMethod },
                process.env.JWT_SECRET || 'fallback-secret',
                { expiresIn: '5m' }
            );

            // If email method, auto-send OTP
            if (user.twoFactorMethod === 'email') {
                const otp = generateEmailOTP();
                await User.findByIdAndUpdate(user._id, {
                    emailOtp: otp,
                    emailOtpExpiry: new Date(Date.now() + 5 * 60 * 1000),
                });
                await sendOTPEmail(user.email, otp, user.name);
            }

            res.json({
                success: true,
                data: {
                    requires2FA: true,
                    method: user.twoFactorMethod,
                    tempToken,
                },
            });
            return;
        }

        // No 2FA — issue full JWT directly
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    riskProfile: user.riskProfile,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Login failed. Please try again.',
            },
        });
    }
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user.
 */
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    riskProfile: user.riskProfile,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to fetch user data.',
            },
        });
    }
});

export default router;
