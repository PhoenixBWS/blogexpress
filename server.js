import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import dns from 'node:dns';
import router from './src/router.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/plain' }));

try {
    await mongoose.connect(process.env.MongoDB);
    console.log('Connected to MongoDB');
} catch (error) {
    console.error('Error connecting to MongoDB:', error);
}

app.use('/', router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});