const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    pages: [
        {
            title: { type: String, required: true },
            content: { type: String, required: true },
            time: { type: Number, required: true }  
        }
    ],
    uploadedBy: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 