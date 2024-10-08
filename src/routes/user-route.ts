import { Router } from 'express';
import { getUser, updateUsername, updatePassword } from '../controllers';

const router = Router();

router.get('/me', getUser);
router.put('/update-username', updateUsername);
router.put('/update-password', updatePassword);

export default router;
