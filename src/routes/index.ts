import { Router } from 'express';
import authRoutes from './auth-route';
import videoRoutes from './video-route';
import courseRoutes from './course-route';
import userRoutes from './user-route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/video', videoRoutes);
router.use('/course', courseRoutes);
router.use('/user', userRoutes);

export default router;
