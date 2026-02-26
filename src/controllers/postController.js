import postModel from "../models/postModel.js";

const add = async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            res.status(400).send({
                status: false,
                message: 'Request body must be a valid JSON object',
            });
            return;
        }

        if (Array.isArray(req.body)) {
            for (const postData of req.body) {
                if (postData.author != req.authorId) {
                    res.status(403).send({
                        status: false,
                        message: 'You are not authorized to create a post for this author',
                    });
                    return;
                }
            }
        } else {
            if (req.body.author != req.authorId) {
                res.status(403).send({
                    status: false,
                    message: 'You are not authorized to create a post for this author',
                });
                return;
            }
        }

        const post = await postModel.create(req.body);

        res.status(201).send({
            status: true,
            message: 'Post added successfully',
            data: post,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error adding post',
            error: error.message,
        });
    }
};

const get = async (req, res) => {
    const postId = req.params?.id || req.query?.id;
    const finder = postId ? { _id: postId, deleted: false } : { deleted: false };
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    try {
        const populateOptions = {
            path: 'author',
            select: {
                title: 1,
                fname: 1,
                lname: 1,
                email: 1,
                _id: 0,
            },
        };

        let posts;

        if (postId) {
            posts = await postModel.findOne(finder).populate(populateOptions);

            if (!posts) {
                res.status(404).send({
                    status: false,
                    message: 'Post not found',
                });
                return;
            }
        } else {
            posts = await postModel
                .find(finder)
                .sort({ publishedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate(populateOptions);
            
            if (posts.length === 0) {
                res.status(404).send({
                    status: false,
                    message: 'No posts found',
                });
                return;
            }
        }

        res.status(200).send({
            status: true,
            data: posts,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error retrieving posts',
            error: error.message,
        });
    }
};

const update = async (req, res) => {
    try {
        const post = await postModel.findOne({ _id: req.params.id, deleted: false });

        if (!post) {
            res.status(404).send({
                status: false,
                message: 'Post not found',
            });
            return;
        }

        if(req.body.hasOwnProperty('createdAt') || req.body.hasOwnProperty('updatedAt') || req.body.hasOwnProperty('_id') || req.body.hasOwnProperty('deleted') || req.body.hasOwnProperty('deletedAt') || req.body.hasOwnProperty('publishedAt')) {
            res.status(400).send({
                status: false,
                message: 'Cannot update particular fields',
            });
            return;
        }

        if(post.author != req.authorId) {
            res.status(403).send({
                status: false,
                message: 'You are not authorized to update this post',
            });
            return;
        }

        const updatedPost = await postModel.findOneAndUpdate({ _id: req.params.id }, req.body, { returnDocument: 'after' });

        res.status(200).send({
            status: true,
            message: 'Post(s) updated successfully',
            data: updatedPost
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error updating post(s)',
            error: error.message,
        });
    }
};

const remove = async (req, res) => {
    try {
        if (req.params.id) {
            const post = await postModel.findOne({ _id: req.params.id, deleted: false });

            if (!post) {
                res.status(404).send({
                    status: false,
                    message: 'Post not found',
                });
                return;
            }

            if(post.author.toString() != req.authorId) {
                res.status(403).send({
                    status: false,
                    message: 'You are not authorized to delete this post',
                });
                return;
            }

            await postModel.updateOne({ _id: req.params.id }, { deleted: true, deletedAt: new Date() });

            res.status(200).send({
                status: true,
                message: 'Post(s) deleted successfully',
            });
            return;
        }

        const allowedFilters = ['title', 'category', 'tags', 'subcategory', 'published', 'author'];
        const finder = {};

        for (const [key, value] of Object.entries(req.query)) {
            if (allowedFilters.includes(key) && value !== '') {
                if(key == 'author') {
                    if(value.toString() !== req.authorId.toString()) {
                        res.status(403).send({
                            status: false,
                            message: 'You are not authorized to delete posts for this author',
                        });
                        return;
                    }

                    finder[key] = value;
                    continue;
                } else if (key === 'tags' || key === 'subcategory') {
                    finder[key] = { $in: value.split(',').map(tag => tag.trim()) };
                    continue;
                } else if (key === 'published') {
                    finder[key] = value === 'true';
                    continue;
                }

                finder[key] = value;
            }
        }

        if (Object.keys(finder).length === 0) {
            res.status(400).send({
                status: false,
                message: `Provide at least one valid query field to delete posts. Valid query fields are ${allowedFilters.join(', ')}.`,
            });
            return;
        }

        finder.deleted = false;

        const result = await postModel.updateMany(finder, { deleted: true, deletedAt: new Date() });

        if (result.matchedCount === 0) {
            res.status(404).send({
                status: false,
                message: 'No posts found for the provided query',
            });
            return;
        }

        res.status(200).send({
            status: true,
            message: `${result.modifiedCount} post(s) deleted successfully`,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error deleting post',
            error: error.message,
        });
    }
};

export { add, get, update, remove };