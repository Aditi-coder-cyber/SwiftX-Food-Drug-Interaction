import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import interactionRoutes from './routes/interactions';
import chatRoutes from './routes/chat';
import twoFactorRoutes from './routes/twoFactor';
import visionRoutes from './routes/vision';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('❌ MONGODB_URI is not defined');
}

const mongoUri: string = MONGODB_URI;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://aipoweredfooddruginteraction.vercel.app',
            /\.vercel\.app$/, // allow all Vercel preview URLs
        ],
        credentials: true,
    })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
        },
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many authentication attempts. Please try again later.',
        },
    },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/vision', visionRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

// ─── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ─── Database Connection & Server Start ────────────────────────────────────────
async function startServer() {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
        });

        // ─── Graceful Shutdown ───────────────────────────────────────────────────
        const gracefulShutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                await mongoose.disconnect();
                console.log('🔌 MongoDB disconnected');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

startServer();
