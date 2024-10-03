import { Router } from 'express';
import authRoutes from './auth-route';
import uploadRoutes from './upload-route';
import courseRoutes from './course-route';

const router = Router();

router.use('/auth', authRoutes);
router.use('', uploadRoutes);
router.use('/course', courseRoutes);

export default router;
