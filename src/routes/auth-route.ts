import { Router } from 'express';
import { register } from '../controllers';

const router = Router();

router.post('/register', register);

export default router;
