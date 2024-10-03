import { Router } from 'express';
import {
	createCourse,
	getCourses,
	deleteCourse,
	updateCourse,
} from '../controllers';

const router = Router();

router.post('/create-course', createCourse);
router.get('/get-courses', getCourses);
router.delete('/delete-course/:id', deleteCourse);
router.put('/update-course/:id', updateCourse);

export default router;
