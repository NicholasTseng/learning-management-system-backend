import { Request, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function createCourse(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const managerUserId = decoded.userId;
		const course = req.body;

		const sql =
			'INSERT INTO courses (course_name, manager_user_id, description, creation_date) VALUES (?, ?, ?, NOW())';

		pool
			.execute(sql, [course.course_name, managerUserId, course.description])
			.then(() =>
				res.status(201).json({
					course_name: course.course_name,
					description: course.description,
				})
			)
			.catch((error) =>
				res.status(500).json({ message: 'Error creating course', error })
			);
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export async function getCourses(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const managerUserId = decoded.userId;

		const sql = 'SELECT * FROM courses WHERE manager_user_id = ?';

		const [result] = await pool.execute(sql, [managerUserId]);

		return res.json(result);
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export function deleteCourse(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return res.status(403).json({ message: 'Authentication required.' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};
		const managerUserId = decoded.userId;
		const courseId = req.params.id;

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const sql =
			'DELETE FROM courses WHERE course_id = ? AND manager_user_id = ?';

		pool
			.execute(sql, [courseId, managerUserId])
			.then(() =>
				res.status(200).json({ message: 'Course deleted successfully' })
			)
			.catch((error) =>
				res.status(500).json({ message: 'Error deleting course', error })
			);
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export function updateCourse(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return res.status(403).json({ message: 'Authentication required.' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};
		const managerUserId = decoded.userId;
		const courseId = req.params.id;
		const course = req.body;

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const fields = [];
		const values = [];

		if (course.course_name) {
			fields.push('course_name = ?');
			values.push(course.course_name);
		}

		if (course.description) {
			fields.push('description = ?');
			values.push(course.description);
		}

		if (fields.length === 0)
			return res.status(400).json({ message: 'No fields to update' });

		values.push(courseId, managerUserId);

		const sql = `UPDATE courses SET ${fields.join(
			', '
		)} WHERE course_id = ? AND manager_user_id = ?`;

		pool
			.execute(sql, values)
			.then(() =>
				res.status(200).json({ message: 'Course updated successfully' })
			)
			.catch((error) =>
				res.status(500).json({ message: 'Error updating course', error })
			);
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}
