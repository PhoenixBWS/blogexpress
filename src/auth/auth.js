import * as jwt from '../utils/jwt.js';
import authorsModel from '../models/authorsModel.js';

const normalizeAuthorId = (authorId) => {
    if (!authorId) return null;

    if (typeof authorId === 'string') {
        return authorId;
    }

    if (typeof authorId?.toHexString === 'function') {
        return authorId.toHexString();
    }

    if (authorId?.buffer && typeof authorId.buffer === 'object') {
        const bytes = Object.values(authorId.buffer);
        if (bytes.length === 12) {
            return Buffer.from(bytes).toString('hex');
        }
    }

    return null;
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || res.status(400).json({ message: 'Invalid email format' });

        const author = await authorsModel.findOne({ email });
        if (!author) {
            return res.status(401).json({ status: false, message: 'Invalid email or password' });
        }

        const isPasswordValid = await author.verifyPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ status: false, message: 'Invalid email or password' });
        }

        const token = await jwt.encrypt({ authorId: author._id.toString() });
        res.status(200).json({ 
            status: true,
            message: 'Login successful',
            token: token
         });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Internal server error', error: error.message });
    }
};

const authenticate = async (req, res, next) => {
    try {
        const apiKeyHeader = req.headers['x-api-key'];
        if (!apiKeyHeader) {
            return res.status(401).json({ status: false, message: 'x-api-key header is missing' });
        }

        const [scheme, token] = apiKeyHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ status: false, message: 'x-api-key must be a Bearer token' });
        }

        const payload = await jwt.decrypt(token);
        const normalizedAuthorId = normalizeAuthorId(payload.authorId);

        if (!normalizedAuthorId) {
            return res.status(401).json({ status: false, message: 'Invalid token payload' });
        }

        req.authorId = normalizedAuthorId;
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        res.status(401).json({ status: false, message: 'Invalid or expired token' });
    }
};

export { login, authenticate };