import { Router, Response } from 'express';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/profile
 * Get the current user's risk profile.
 */
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        res.json({
            success: true,
            data: {
                riskProfile: user.riskProfile,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to fetch risk profile.',
            },
        });
    }
});

/**
 * PUT /api/profile
 * Create or update the current user's risk profile.
 */
router.put('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { age, conditions, allergies } = req.body;

        if (!age) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Age range is required.',
                },
            });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.user!._id,
            {
                riskProfile: {
                    age,
                    conditions: conditions || [],
                    allergies: allergies || [],
                },
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                riskProfile: user!.riskProfile,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to update risk profile.',
            },
        });
    }
});

export default router;
