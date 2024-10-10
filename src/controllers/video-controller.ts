import { Request, Response } from 'express';
import storage from '../config/storage';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export async function uploadVideos(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const { courseId, title } = req.body;

		if (!courseId || !title)
			return res.status(400).json({ message: 'Missing required fields' });

		if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

		const localFilePath = req.file.path;
		const destination = `uploads/${req.file.filename}${path.extname(
			req.file.originalname
		)}`;
		const bucketName = 'lbs-bucket';

		await storage.bucket(bucketName).upload(localFilePath, {
			destination: destination,
			metadata: {
				contentType: req.file.mimetype,
			},
		});

		fs.unlinkSync(localFilePath);

		const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

		const videoTableCommand = `
      INSERT INTO videos (course_id, title, url, upload_date)
      VALUES (?, ?, ?, NOW());
    `;

		const [result]: any = await pool.execute(videoTableCommand, [
			courseId,
			title,
			publicUrl,
		]);

		const videoId = result.insertId;

		const updateCourseCommand = `
      UPDATE courses
      SET video_ids = JSON_ARRAY_APPEND(COALESCE(video_ids, JSON_ARRAY()), '$', ?)
      WHERE id = ?;
    `;

		await pool.execute(updateCourseCommand, [videoId, courseId]);

		res.status(200).json({ filePath: publicUrl });
	} catch (error) {
		console.error('Error uploading file:', error);
		res.status(500).json({ message: 'Internal server error', error });
	}
}

export async function getVideos(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const courseId = req.params.id;

		const sql = `
			SELECT id, title, description, url
			FROM videos
			WHERE course_id = ?;
		`;

		const [rows]: any[] = await pool.execute(sql, [courseId]);

		res.status(200).json(rows);
	} catch (error) {
		console.error('Error getting videos:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}

export async function deleteVideo(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};
		const videoId = req.params.id;
		const courseId = req.params.course_id;

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const [rows]: any[] = await pool.execute(
			'SELECT video_ids FROM courses WHERE id = ?',
			[courseId]
		);

		const course = rows[0];

		if (!course) return res.status(404).json({ message: 'Course not found' });

		const updatedVideoIds = course.video_ids.filter(
			(id: number) => id !== Number(videoId)
		);

		const courseTableCommand = `
      UPDATE courses
      SET video_ids = ?
      WHERE id = ?;
    `;

		await pool.execute(courseTableCommand, [
			JSON.stringify(updatedVideoIds),
			courseId,
		]);

		const videoTableCommand = 'DELETE FROM videos WHERE id = ?';
		await pool.execute(videoTableCommand, [videoId]);

		res.status(200).json({ message: 'Course deleted successfully' });
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export function updateVideo(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token)
		return res.status(403).json({ message: 'Authentication required.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
			role: 'educator' | 'learner';
		};
		const videoId = req.params.id;
		const courseId = req.params.course_id;
		const { title, description } = req.body;

		if (decoded.role !== 'educator')
			return res.status(403).json({ message: 'Forbidden' });

		const fields = [];
		const values = [];

		if (title) {
			fields.push('title = ?');
			values.push(title);
		}

		if (description) {
			fields.push('description = ?');
			values.push(description);
		}

		if (fields.length === 0)
			return res.status(400).json({ message: 'No fields to update' });

		values.push(videoId, courseId);

		const sql = `UPDATE videos SET ${fields.join(
			', '
		)} WHERE id = ? AND course_id = ?`;

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
