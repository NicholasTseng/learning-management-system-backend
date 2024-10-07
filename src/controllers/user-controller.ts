import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export async function getUser(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
		};

		const sql = 'SELECT * FROM users WHERE id = ?';

		const [result] = await pool.execute(sql, [decoded.userId]);

		return res.json(result);
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export async function updateUsername(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
		};

		const { username } = req.body;

		if (!username)
			return res.status(400).json({ message: 'Missing required fields' });

		const sql = 'UPDATE users SET username = ? WHERE id = ?';

		await pool.execute(sql, [username, decoded.userId]);

		return res.json({ message: 'Username updated successfully' });
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export async function updatePassword(req: Request, res: Response) {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) return res.status(401).json({ message: 'Invalid token.' });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: number;
		};

		const { password } = req.body;

		if (!password)
			return res.status(400).json({ message: 'Missing required fields' });

		const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
		const [rows] = await pool.execute('SELECT salt FROM users WHERE id = ?', [
			decoded.userId,
		]);

		const users = rows as any[];

		if (users.length === 0)
			return res.status(400).json({ message: 'Invalid email or password' });

		const user = users[0];
		const hashedPassword = await bcrypt.hash(decodedPassword, user.salt);

		const sql = 'UPDATE users SET password = ? WHERE id = ?';

		await pool.execute(sql, [hashedPassword, decoded.userId]);

		return res.json({ message: 'Password updated successfully' });
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error' });
	}
}
