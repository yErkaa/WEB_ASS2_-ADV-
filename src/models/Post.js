const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Связь с User
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true }, // Связь с University
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
