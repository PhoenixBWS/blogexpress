import { Schema, model } from 'mongoose';

const postSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: { type: [String], default: [] },
    category: { type: String, required: true },
    subcategory: { type: [String], default: [] },
    author: { type: Schema.Types.ObjectId, ref: 'authors', required: true },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const postModel = model('posts', postSchema);

export default postModel;