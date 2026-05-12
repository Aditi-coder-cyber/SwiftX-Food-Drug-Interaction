import { Router } from 'express';
import { analyzePrescription } from '../services/visionService';

const router = Router();

// POST /api/vision/analyze
router.post('/analyze', async (req, res, next) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_IMAGE',
                    message: 'No image data provided',
                },
            });
        }

        const medicationName = await analyzePrescription(image);

        res.json({
            success: true,
            data: {
                medicationName,
            },
        });
    } catch (error: any) {
        next(error);
    }
});

export default router;
