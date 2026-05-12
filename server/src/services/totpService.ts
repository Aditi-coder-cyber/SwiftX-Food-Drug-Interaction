import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

/* ─── Encryption for TOTP secrets at rest ───────────────────────────────────── */

const ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(process.env.JWT_SECRET || 'fallback-secret')
    .digest(); // 32 bytes for AES-256

const IV_LENGTH = 16;

export function encryptSecret(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decryptSecret(ciphertext: string): string {
    const [ivHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/* ─── TOTP Operations ───────────────────────────────────────────────────────── */

const ISSUER = 'SafeMed AI';

/**
 * Generate a new TOTP secret + QR code for setup.
 */
export async function generateSecret(email: string): Promise<{
    secret: string;         // encrypted — store in DB
    rawSecret: string;      // plain base32 — show to user for manual entry
    qrCodeUrl: string;      // data URL of QR code
}> {
    const totp = new OTPAuth.TOTP({
        issuer: ISSUER,
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: new OTPAuth.Secret({ size: 20 }),
    });

    const rawSecret = totp.secret.base32;
    const uri = totp.toString();
    const qrCodeUrl = await QRCode.toDataURL(uri);

    return {
        secret: encryptSecret(rawSecret),
        rawSecret,
        qrCodeUrl,
    };
}

/**
 * Verify a 6-digit TOTP token against an encrypted secret.
 */
export function verifyToken(encryptedSecret: string, token: string): boolean {
    const rawSecret = decryptSecret(encryptedSecret);

    const totp = new OTPAuth.TOTP({
        issuer: ISSUER,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(rawSecret),
    });

    // Allow ±1 time step for clock drift (window = 1)
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
}

/**
 * Generate a random 6-digit OTP for email verification.
 */
export function generateEmailOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}
