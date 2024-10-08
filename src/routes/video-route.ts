import { Router, Request } from 'express';
import {
	uploadVideos,
	getVideos,
	deleteVideo,
	updateVideo,
} from '../controllers';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

const router = Router();

const generateHash = (originalName: string): string => {
	return crypto
		.createHash('sha256')
		.update(`${Date.now()}-${originalName}`)
		.digest('hex');
};

const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, '');
	},
	filename: (req, file, callback) => {
		const hashedFileName = `${generateHash(file.originalname)}`;
		callback(null, hashedFileName);
	},
});

const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	callback: multer.FileFilterCallback
) => {
	if (file.mimetype === 'video/mp4') {
		callback(null, true);
	} else {
		callback(null, false);
	}
};

const upload = multer({ storage, fileFilter });

router.post('/upload', upload.single('video'), uploadVideos);
router.get('/get-videos/:id', getVideos);
router.delete('/delete-video/:course_id/:id', deleteVideo);
router.put('/update-video/:course_id/:id', updateVideo);

export default router;
