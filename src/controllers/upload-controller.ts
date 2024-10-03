import { Request, Response } from 'express';
import storage from '../config/storage';
import path from 'path';
import fs from 'fs';

export async function uploadVideos(req: Request, res: Response) {
	try {
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

		res.status(200).json({ filePath: publicUrl });
	} catch (error) {
		console.error('Error uploading file:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}
