const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseName: { type: String, required: true },
    language: { type: String, default: "en" },
    pages: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        time: { type: String, required: true },
      },
    ],
    uploadedBy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
