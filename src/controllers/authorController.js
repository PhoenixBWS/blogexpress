import authorsModel from "../models/authorsModel.js";

const add = async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            res.status(400).send({
                status: false,
                message: 'Request body must be a valid JSON object',
            });
            return;
        }

        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            res.status(400).send({
                status: false,
                message: 'Email is required',
            });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            res.status(400).send({
                status: false,
                message: 'Invalid email format',
            });
            return;
        }

        req.body.email = normalizedEmail;

        const author = await authorsModel.create(req.body);
        res.status(201).send({
            status: true,
            message: 'Author added successfully',
            data: author,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error adding author',
            error: error.message,
        });
    }
};

const get = async (req = '', res) => {
    const finder = req.query.name ? { fname: req.query.name, isDeleted: false } : { isDeleted: false };

    try {
        const authors = await authorsModel.find(finder);
        res.status(200).send({
            status: true,
            message: 'Authors retrieved successfully',
            data: authors,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error retrieving authors',
            error: error.message,
        });
    }
};

const update = async (req, res) => {
    try {
        const author = await authorsModel.findOne({ _id: req.params.id, isDeleted: false });

        if (!author) {
            res.status(404).send({
                status: false,
                message: 'Author not found',
            });
            return;
        }

        if (req.body.hasOwnProperty('username')) {
            res.status(400).send({
                status: false,
                message: 'Username cannot be updated',
            });
            return;
        }

        await authorsModel.updateOne({ _id: req.params.id }, req.body);

        res.status(200).send({
            status: true,
            message: 'Author updated successfully',
            data: author,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error updating author',
            error: error.message,
        });
    }
};

const remove = async (req, res) => {
    try {
        const author = await authorsModel.findOne({ _id: req.params.id, isDeleted: false });

        if (!author) {
            res.status(404).send({
                status: false,
                message: 'Author not found',
            });
            return;
        }

        await authorsModel.updateOne({ _id: req.params.id }, { isDeleted: true });

        res.status(200).send({
            status: true,
            message: 'Author deleted successfully',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: 'Error deleting author',
            error: error.message,
        });
    }
};

export { add, get, update, remove };