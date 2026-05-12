import { Router, Response } from 'express';
import { Interaction } from '../models/Interaction';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { analyzeInteraction } from '../services/interactionAnalyzer';

const router = Router();

/**
 * POST /api/interactions/check
 * Analyze a food-drug interaction. Auth is optional (guests can check).
 * If authenticated, the result is saved to history.
 */
router.post(
    '/check',
    optionalAuth,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { medication, food, inputType } = req.body;

            if (!medication || !food) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Both medication and food are required.',
                    },
                });
                return;
            }

            // Get risk profile if user is authenticated
            const riskProfile = req.user?.riskProfile || null;

            // Run analysis
            const result = await analyzeInteraction(medication, food, riskProfile);

            // Save to history if user is authenticated
            if (req.user) {
                await Interaction.create({
                    userId: req.user._id,
                    ...result,
                    inputType: inputType || 'text',
                });
            }

            res.json({
                success: true,
                data: {
                    interaction: {
                        ...result,
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to analyze interaction.',
                },
            });
        }
    }
);

/**
 * GET /api/interactions/history
 * Get the authenticated user's interaction history.
 * Sorted by most recent first.
 */
router.get(
    '/history',
    requireAuth,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            const [interactions, total] = await Promise.all([
                Interaction.find({ userId: req.user!._id })
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Interaction.countDocuments({ userId: req.user!._id }),
            ]);

            res.json({
                success: true,
                data: {
                    interactions,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to fetch interaction history.',
                },
            });
        }
    }
);

export default router;
