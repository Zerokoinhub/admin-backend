// controllers/course.controller.js
const Course = require("../models/course.model");

// Create/upload a new course
exports.uploadCourse = async (req, res) => {
  try {
    const { languages, uploadedBy } = req.body;

    // Validation
    if (!languages || !languages.en || !uploadedBy) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. English content is required." 
      });
    }

    // Validate English has required content
    if (!languages.en.courseName || !Array.isArray(languages.en.pages)) {
      return res.status(400).json({ 
        success: false, 
        message: "English course name and pages are required" 
      });
    }

    // Filter out empty languages
    const filteredLanguages = {};
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ar'];
    
    supportedLanguages.forEach(lang => {
      if (languages[lang] && languages[lang].courseName) {
        filteredLanguages[lang] = languages[lang];
      }
    });

    const course = new Course({
      languages: filteredLanguages,
      uploadedBy,
      isActive: true
    });

    await course.save();
    
    // Populate uploadedBy
    await course.populate('uploadedBy', 'username email');

    res.status(201).json({ 
      success: true, 
      message: "Course uploaded successfully",
      course 
    });
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
    const { languages } = req.body;

    // Validation
    if (!languages || !languages.en) {
      return res.status(400).json({
        success: false,
        message: "English content is required",
      });
    }

    // Filter out empty languages
    const filteredLanguages = {};
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ar'];
    
    supportedLanguages.forEach(lang => {
      if (languages[lang] && languages[lang].courseName) {
        filteredLanguages[lang] = languages[lang];
      }
    });

    const course = await Course.findByIdAndUpdate(
      id,
      { languages: filteredLanguages },
      { new: true }
    ).populate('uploadedBy', 'username email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Course updated successfully",
      course 
    });
  } catch (error) {
    console.error("Error editing course:", error);
    res.status(500).json({
      success: false,
      message: "Error editing course",
      error: error.message,
    });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('uploadedBy', 'username email')
      .sort('-createdAt');

    // Transform courses for frontend
    const transformedCourses = courses.map(course => {
      const courseObj = course.toObject();
      return {
        ...courseObj,
        // Add helper fields for display
        primaryName: courseObj.languages?.en?.courseName || 'Untitled',
        languageCount: courseObj.availableLanguages?.length || 0,
        hasMultipleLanguages: (courseObj.availableLanguages?.length || 0) > 1
      };
    });

    res.json({ 
      success: true, 
      courses: transformedCourses 
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

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query; // Optional language parameter

    const course = await Course.findById(id)
      .populate('uploadedBy', 'username email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // Get localized content based on requested language
    const localizedContent = course.getLocalizedContent(lang);

    res.json({ 
      success: true, 
      course: {
        ...course.toObject(),
        ...localizedContent
      }
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

// Get courses by language (for Flutter app)
exports.getCoursesByLanguage = async (req, res) => {
  try {
    const { language } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find courses that have this language available
    const query = { 
      [`languages.${language}`]: { $exists: true },
      isActive: true 
    };

    const courses = await Course.find(query)
      .populate('uploadedBy', 'username email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    // Transform courses to include only the requested language content
    const localizedCourses = courses.map(course => ({
      id: course._id,
      courseName: course.languages[language]?.courseName || 'Untitled',
      pages: course.languages[language]?.pages || [],
      uploadedBy: course.uploadedBy,
      availableLanguages: course.availableLanguages,
      createdAt: course.createdAt
    }));

    res.json({ 
      success: true, 
      courses: localizedCourses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCourses: total
      }
    });
  } catch (error) {
    console.error("Error fetching courses by language:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses by language",
      error: error.message,
    });
  }
};

// Get available languages (with course counts)
exports.getAvailableLanguages = async (req, res) => {
  try {
    const languages = await Course.aggregate([
      { $match: { isActive: true } },
      { $project: { languages: { $objectToArray: "$languages" } } },
      { $unwind: "$languages" },
      { $match: { "languages.v.courseName": { $exists: true } } },
      {
        $group: {
          _id: "$languages.k",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          language: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    // Add display names
    const displayNames = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文',
      ar: 'العربية'
    };

    const languagesWithNames = languages.map(lang => ({
      ...lang,
      displayName: displayNames[lang.language] || lang.language
    }));

    res.json({ 
      success: true, 
      languages: languagesWithNames 
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching languages",
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
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Course deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting course",
      error: error.message,
    });
  }
};
