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

    // Validate that each page has required language fields
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Check if English title and content exist (required)
      if (!page.title?.en || !page.content?.en) {
        return res.status(400).json({ 
          success: false, 
          message: `Page ${i + 1}: English title and content are required` 
        });
      }
    }

    const course = new Course({
      courseName,
      pages,
      uploadedBy,
      language, // This field might not be needed anymore with the new schema
    });

    await course.save();
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Error uploading course:", error);
    res.status(500).json({
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
      return res.status(400).json({
        success: false,
        message: "Missing or invalid fields for update",
      });
    }

    // Validate language fields
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.title?.en || !page.content?.en) {
        return res.status(400).json({ 
          success: false, 
          message: `Page ${i + 1}: English title and content are required` 
        });
      }
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
    res.status(500).json({
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
    res.status(500).json({
      success: false,
      message: "Error deleting course",
      error: error.message,
    });
  }
};

// Get all courses (with language support)
exports.getCourses = async (req, res) => {
  try {
    const { lang = 'en' } = req.query; // Get language from query parameter, default to 'en'
    
    // Validate language
    const validLanguages = ['en', 'hi', 'ur', 'ar', 'es'];
    if (!validLanguages.includes(lang)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid language code. Supported: en, hi, ur, ar, es' 
      });
    }

    const courses = await Course.find()
      .populate("uploadedBy", "username email");

    // Transform each course to return only the requested language
    const transformedCourses = courses.map(course => {
      const courseObj = course.toObject();
      
      // Transform pages to include only the requested language
      courseObj.pages = course.pages.map(page => ({
        title: page.title[lang] || page.title.en, // Fallback to English
        content: page.content[lang] || page.content.en, // Fallback to English
        time: page.time
      }));
      
      return courseObj;
    });

    res.json({ 
      success: true, 
      courses: transformedCourses,
      language: lang 
    });
    
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message,
    });
  }
};

// Get single course by ID with language support
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    // Validate language
    const validLanguages = ['en', 'hi', 'ur', 'ar', 'es'];
    if (!validLanguages.includes(lang)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid language code. Supported: en, hi, ur, ar, es' 
      });
    }

    const course = await Course.findById(id)
      .populate("uploadedBy", "username email");

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // Transform to return only requested language
    const courseObj = course.toObject();
    courseObj.pages = course.pages.map(page => ({
      title: page.title[lang] || page.title.en,
      content: page.content[lang] || page.content.en,
      time: page.time
    }));

    res.json({ 
      success: true, 
      course: courseObj,
      language: lang 
    });
    
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course",
      error: error.message,
    });
  }
};

// Get course names only (for dropdowns, etc.)
exports.getCourseNames = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;

    const courses = await Course.find({}, 'courseName pages.title');
    
    const courseNames = courses.map(course => {
      // Get the title of first page in requested language as preview
      const previewTitle = course.pages[0]?.title[lang] || 
                          course.pages[0]?.title.en || 
                          course.courseName;
      
      return {
        name: course.courseName,
        previewTitle
      };
    });

    res.json({ 
      success: true, 
      courses: courseNames,
      language: lang 
    });
    
  } catch (error) {
    console.error("Error fetching course names:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course names",
      error: error.message,
    });
  }
};
