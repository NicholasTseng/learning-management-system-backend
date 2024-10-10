import { Router } from 'express';
import {
	createCourse,
	getCourses,
	getAllCourses,
	deleteCourse,
	updateCourse,
	subscribeCourse,
	unsubscribeCourse,
} from '../controllers';

const router = Router();

router.post('/create-course', createCourse);
router.get('/get-courses/me', getCourses);
router.get('/get-courses/all', getAllCourses);
router.delete('/delete-course/:id', deleteCourse);
router.put('/update-course/:id', updateCourse);
router.put('/subscribe-course/:id', subscribeCourse);
router.put('/unsubscribe-course/:id', unsubscribeCourse);

export default router;
