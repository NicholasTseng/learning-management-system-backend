import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import { ResultSetHeader } from 'mysql2';

export async function register(req: Request, res: Response) {
	try {
		const { username, email, password, role } = req.body;

		if (!username || !email || !password || !role)
			return res.status(400).json({ message: 'Missing required fields' });

		const [existingUsers] = await pool.execute(
			'SELECT id FROM user WHERE email = ? OR username = ?',
			[email, username]
		);

		if ((existingUsers as any[]).length > 0)
			return res
				.status(400)
				.json({ message: 'Email or username already in use' });

		const saltRounds = 10;
		const salt = await bcrypt.genSalt(saltRounds);
		const hashedPassword = await bcrypt.hash(password, salt);

		const [result] = await pool.execute(
			'INSERT INTO user (username, email, password, role, salt) VALUES (?, ?, ?, ?, ?)',
			[username, email, hashedPassword, role, salt]
		);

		const userId = (result as ResultSetHeader).insertId;

		res.status(201).json({ user_id: userId });
	} catch (error) {
		console.error('Error registering user:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}
