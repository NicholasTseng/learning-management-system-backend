import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

(async () => {
	try {
		const connection = await pool.getConnection();
		console.log('Database connection successful!');
		connection.release();
	} catch (error) {
		console.error('Database connection failed:', error);
	}
})();

export default pool;
