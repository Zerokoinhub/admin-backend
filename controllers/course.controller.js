const Course = require("../models/course.model");

// Create/upload a new course
exports.uploadCourse = async (req, res) => {
  try {
    const { courseName, pages, uploadedBy, language } = req.body;

    // Validation
    if (
      !courseName ||
      !Array.isArray(pages) ||
      pages.length === 0 ||
      !uploadedBy
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const course = new Course({
      courseName,
      pages,
      uploadedBy,
      language,
    });

    await course.save();
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Error uploading course:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error uploading course",
        error: error.message,
      });
  }
};

// Edit/update an existing course
exports.editCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, pages, language } = req.body;

    // Validation
    if (!courseName || !Array.isArray(pages)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing or invalid fields for update",
        });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { courseName, pages, language },
      { new: true }
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error("Error editing course:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error editing course",
        error: error.message,
      });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting course",
        error: error.message,
      });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate(
      "uploadedBy",
      "username email"
    );
    res.json({ success: true, courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching courses",
        error: error.message,
      });
  }
};
