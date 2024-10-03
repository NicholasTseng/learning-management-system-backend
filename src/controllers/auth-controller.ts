import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import { ResultSetHeader } from 'mysql2';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export async function register(req: Request, res: Response) {
	try {
		const { username, email, password, role } = req.body;
		const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');

		if (!username || !email || !decodedPassword || !role)
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
		const hashedPassword = await bcrypt.hash(decodedPassword, salt);

		const [result] = await pool.execute(
			'INSERT INTO users (username, email, password, role, salt) VALUES (?, ?, ?, ?, ?)',
			[username, email, hashedPassword, role, salt]
		);

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret)
			return res.status(500).json({ message: 'JWT secret is not defined' });

		const token = jwt.sign(
			{ userId: (result as ResultSetHeader).insertId, role: role },
			jwtSecret,
			{
				expiresIn: '24h',
			}
		);

		res.status(201).json({ token });
	} catch (error) {
		console.error('Error registering user:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}

export async function login(req: Request, res: Response) {
	try {
		const { username, password } = req.body;
		const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');

		if (!username || !decodedPassword)
			return res.status(400).json({ message: 'Missing required fields' });

		const [rows] = await pool.execute(
			'SELECT id, password, role, salt FROM users WHERE username = ?',
			[username]
		);

		const users = rows as any[];

		if (users.length === 0) {
			return res.status(400).json({ message: 'Invalid username or password' });
		}

		const user = users[0];
		const hashedPassword = await bcrypt.hash(decodedPassword, user.salt);
		const passwordMatch = hashedPassword === user.password;

		if (!passwordMatch)
			return res.status(400).json({ message: 'Invalid username or password' });

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret)
			return res.status(500).json({ message: 'JWT secret is not defined' });

		const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
			expiresIn: '24h',
		});

		res.status(200).json({ token });
	} catch (error) {
		console.error('Error logging in user:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}
