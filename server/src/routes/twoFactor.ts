import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateSecret, verifyToken, generateEmailOTP } from '../services/totpService';
import { sendOTPEmail } from '../services/emailService';

const router = Router();

/* ─── In-memory rate limiter for OTP verification ───────────────────────────── */

const otpAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

    const record = otpAttempts.get(key);

    if (record) {
        if (Date.now() < record.lockedUntil) {
            return { allowed: false, remaining: 0 };
        }
        if (record.count >= MAX_ATTEMPTS) {
            record.lockedUntil = Date.now() + LOCKOUT_MS;
            record.count = 0;
            otpAttempts.set(key, record);
            return { allowed: false, remaining: 0 };
        }
    }

    return { allowed: true, remaining: MAX_ATTEMPTS - (record?.count || 0) };
}

function recordAttempt(key: string): void {
    const record = otpAttempts.get(key) || { count: 0, lockedUntil: 0 };
    record.count += 1;
    otpAttempts.set(key, record);
}

function clearAttempts(key: string): void {
    otpAttempts.delete(key);
}

// Clean up stale rate-limit entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of otpAttempts.entries()) {
        if (now > record.lockedUntil + 600000) otpAttempts.delete(key);
    }
}, 10 * 60 * 1000);

/* ─── Helper: verify tempToken ──────────────────────────────────────────────── */

function verifyTempToken(token: string): { userId: string; method: string } | null {
    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const payload = jwt.verify(token, secret) as any;
        if (payload.type !== '2fa') return null; // MUST be a 2FA tempToken
        return { userId: payload.userId, method: payload.method };
    } catch {
        return null;
    }
}

/* ─── GET /api/2fa/status ───────────────────────────────────────────────────── */

router.get('/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        res.json({
            success: true,
            data: {
                enabled: user.twoFactorEnabled,
                method: user.twoFactorMethod,
            },
        });
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get 2FA status.' } });
    }
});

/* ─── POST /api/2fa/setup/email ─────────────────────────────────────────────── */

router.post('/setup/email', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;

        // Generate OTP and save
        const otp = generateEmailOTP();
        await User.findByIdAndUpdate(user._id, {
            emailOtp: otp,
            emailOtpExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        });

        // Send OTP email
        const sent = await sendOTPEmail(user.email, otp, user.name);
        if (!sent) {
            res.status(500).json({ success: false, error: { code: 'EMAIL_FAILED', message: 'Failed to send verification email.' } });
            return;
        }

        res.json({
            success: true,
            data: { message: 'Verification code sent to your email.' },
        });
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to setup email 2FA.' } });
    }
});

/* ─── POST /api/2fa/setup/totp ──────────────────────────────────────────────── */

router.post('/setup/totp', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;

        const { secret, rawSecret, qrCodeUrl } = await generateSecret(user.email);

        // Save encrypted secret (not yet enabled — user must verify first)
        await User.findByIdAndUpdate(user._id, {
            twoFactorSecret: secret,
        });

        res.json({
            success: true,
            data: {
                qrCode: qrCodeUrl,
                manualKey: rawSecret,
                message: 'Scan the QR code with your authenticator app, then verify with a code.',
            },
        });
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to setup TOTP.' } });
    }
});

/* ─── POST /api/2fa/verify-setup ────────────────────────────────────────────── */

router.post('/verify-setup', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { code, method } = req.body;

        if (!code || !method) {
            res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Code and method are required.' } });
            return;
        }

        if (method === 'totp') {
            // Get the stored encrypted secret
            const userWithSecret = await User.findById(user._id).select('+twoFactorSecret');
            if (!userWithSecret?.twoFactorSecret) {
                res.status(400).json({ success: false, error: { code: 'NO_SECRET', message: 'Please setup TOTP first.' } });
                return;
            }

            const valid = verifyToken(userWithSecret.twoFactorSecret, code);
            if (!valid) {
                res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } });
                return;
            }

            // Enable 2FA
            await User.findByIdAndUpdate(user._id, {
                twoFactorEnabled: true,
                twoFactorMethod: 'totp',
            });

        } else if (method === 'email') {
            const userWithOtp = await User.findById(user._id).select('+emailOtp +emailOtpExpiry');
            if (!userWithOtp?.emailOtp || !userWithOtp?.emailOtpExpiry) {
                res.status(400).json({ success: false, error: { code: 'NO_OTP', message: 'Please request an OTP first.' } });
                return;
            }

            if (new Date() > userWithOtp.emailOtpExpiry) {
                res.status(400).json({ success: false, error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new one.' } });
                return;
            }

            if (userWithOtp.emailOtp !== code) {
                res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } });
                return;
            }

            // Enable 2FA
            await User.findByIdAndUpdate(user._id, {
                twoFactorEnabled: true,
                twoFactorMethod: 'email',
                emailOtp: null,
                emailOtpExpiry: null,
            });

        } else {
            res.status(400).json({ success: false, error: { code: 'INVALID_METHOD', message: 'Method must be "email" or "totp".' } });
            return;
        }

        res.json({
            success: true,
            data: { message: 'Two-factor authentication has been enabled!' },
        });
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify 2FA setup.' } });
    }
});

/* ─── POST /api/2fa/disable ─────────────────────────────────────────────────── */

router.post('/disable', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { password } = req.body;

        if (!password) {
            res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Password is required.' } });
            return;
        }

        // Verify password first
        const userWithPassword = await User.findById(user._id).select('+password');
        if (!userWithPassword) {
            res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
            return;
        }

        const isMatch = await userWithPassword.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Incorrect password.' } });
            return;
        }

        // Disable 2FA
        await User.findByIdAndUpdate(user._id, {
            twoFactorEnabled: false,
            twoFactorMethod: null,
            twoFactorSecret: null,
            emailOtp: null,
            emailOtpExpiry: null,
        });

        res.json({
            success: true,
            data: { message: 'Two-factor authentication has been disabled.' },
        });
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to disable 2FA.' } });
    }
});

/* ─── POST /api/2fa/send-otp  (during login challenge) ─────────────────────── */

router.post('/send-otp', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tempToken } = req.body;
        if (!tempToken) {
            res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Temp token is required.' } });
            return;
        }

        const payload = verifyTempToken(tempToken);
        if (!payload) {
            res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired temp token.' } });
            return;
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
            return;
        }

        const otp = generateEmailOTP();
        await User.findByIdAndUpdate(user._id, {
            emailOtp: otp,
            emailOtpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        });

        const sent = await sendOTPEmail(user.email, otp, user.name);
        if (!sent) {
            res.status(500).json({ success: false, error: { code: 'EMAIL_FAILED', message: 'Failed to send OTP email.' } });
            return;
        }

        res.json({
            success: true,
            data: { message: 'Verification code sent to your email.' },
        });
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to send OTP.' } });
    }
});

/* ─── POST /api/2fa/verify  (during login challenge) ───────────────────────── */

router.post('/verify', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken || !code) {
            res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Temp token and code are required.' } });
            return;
        }

        const payload = verifyTempToken(tempToken);
        if (!payload) {
            res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired temp token.' } });
            return;
        }

        // Rate limit check
        const rateLimitKey = `2fa:${payload.userId}`;
        const rateCheck = checkRateLimit(rateLimitKey);
        if (!rateCheck.allowed) {
            res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait 5 minutes.' } });
            return;
        }

        const user = await User.findById(payload.userId).select('+twoFactorSecret +emailOtp +emailOtpExpiry');
        if (!user) {
            res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
            return;
        }

        let valid = false;

        if (payload.method === 'totp' && user.twoFactorSecret) {
            valid = verifyToken(user.twoFactorSecret, code);
        } else if (payload.method === 'email') {
            if (!user.emailOtp || !user.emailOtpExpiry) {
                res.status(400).json({ success: false, error: { code: 'NO_OTP', message: 'No OTP found. Please request a new one.' } });
                return;
            }
            if (new Date() > user.emailOtpExpiry) {
                res.status(400).json({ success: false, error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new one.' } });
                return;
            }
            valid = user.emailOtp === code;
        }

        if (!valid) {
            recordAttempt(rateLimitKey);
            res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } });
            return;
        }

        // Clear rate limit and OTP
        clearAttempts(rateLimitKey);
        await User.findByIdAndUpdate(user._id, { emailOtp: null, emailOtpExpiry: null });

        // Issue real JWT
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
    } catch {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify 2FA.' } });
    }
});

export default router;
