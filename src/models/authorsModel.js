import { Schema, model } from 'mongoose';
import argon2 from 'argon2';

const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
    saltLength: 16,
};

const authorsSchema = new Schema({
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    title: { type: String, enum: ['Mr', 'Miss', 'Mrs', 'Dr'], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

authorsSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await argon2.hash(this.password, ARGON2_OPTIONS);
});

authorsSchema.methods.verifyPassword = async function(password) {
    return await argon2.verify(this.password, password, ARGON2_OPTIONS);
};

const authorsModel = model('authors', authorsSchema);

export default authorsModel;