import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use('/api', routes);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
