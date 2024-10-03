import { Router } from 'express';
import authRoutes from './auth-route';
import uploadRoutes from './upload-route';

const router = Router();

router.use('/auth', authRoutes);
router.use('', uploadRoutes);

export default router;
