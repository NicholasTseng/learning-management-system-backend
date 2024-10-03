import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const storage = new Storage({
	projectId: process.env.GCS_PROJECT_ID,
	keyFilename: path.resolve(__dirname, '../../google-cloud-storage-key.json'),
});

export default storage;
