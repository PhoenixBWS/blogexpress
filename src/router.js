import { Router } from "express";
import * as postModel from './controllers/postController.js';
import * as authorsModel from './controllers/authorController.js';
import * as auth from './auth/auth.js';

const router = Router();

router.get('/', (req, res) => {
    res.status(200).send({
        status: true,
        message: 'Welcome to the Blog API',
        endpoints: {
            'GET /blogs': 'Get all posts',
            'POST /blogs': 'Create a new post',
            'GET /blogs/:id': 'Get a post by ID',
            'PUT /blogs/:id': 'Update a post by ID',
            'DELETE /blogs/:id': 'Delete a post by ID',
            'DELETE /blogs?query': 'Delete posts by query',
            'GET /authors': 'Get all authors',
            'POST /authors': 'Create a new author',
            'POST /login': 'Login an author'
        }
    });
});

router.post('/blogs', auth.authenticate, postModel.add);
router.get('/blogs', auth.authenticate, postModel.get);
router.get('/blogs/:id', auth.authenticate, postModel.get);
router.put('/blogs/:id', auth.authenticate, postModel.update);
router.delete('/blogs', auth.authenticate, postModel.remove);
router.delete('/blogs/:id', auth.authenticate, postModel.remove);
router.get('/authors', authorsModel.get);
router.post('/authors', authorsModel.add);
router.post('/login', auth.login);

export default router;