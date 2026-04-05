const Course = require("../models/course.model");

// Create/upload a new course
// Add to course.controller.js
// Add this function to course.controller.js
// Add this function to course.controller.js
// Add this function to course.controller.js
// Add to course.controller.js
// Get all courses (simple list for dropdown)
// Update course language content
// View all courses content
exports.viewAllCoursesContent = async (req, res) => {
  try {
    console.log('📚 Viewing all courses content');
    
    const courses = await Course.find({ isActive: true })
      .select('languages availableLanguages')
      .lean();
    
    const result = courses.map(course => ({
      id: course._id,
      availableLanguages: course.availableLanguages || [],
      languages: {}
    }));
    
    // Add language details
    const languageNames = {
      en: 'English',
      ar: 'Arabic',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      zh: 'Chinese',
      hi: 'Hindi',
      ur: 'Urdu'
    };
    
    courses.forEach((course, index) => {
      if (course.languages) {
        Object.keys(course.languages).forEach(lang => {
          if (course.languages[lang] && course.languages[lang].courseName) {
            result[index].languages[lang] = {
              name: languageNames[lang] || lang,
              courseName: course.languages[lang].courseName,
              pagesCount: course.languages[lang].pages?.length || 0
            };
          }
        });
      }
    });
    
    res.json({
      success: true,
      totalCourses: courses.length,
      courses: result
    });
  } catch (error) {
    console.error('Error viewing courses content:', error);
    res.status(500).json({
      success: false,
      message: 'Error viewing courses content',
      error: error.message
    });
  }
};
exports.updateCourseLanguage = async (req, res) => {
  try {
    const { courseId, language, content } = req.body;
    
    if (!courseId || !language || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, language, content'
      });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Update the language content
    if (!course.languages) course.languages = {};
    course.languages[language] = content;
    
    // Update available languages if needed
    if (!course.availableLanguages) course.availableLanguages = [];
    if (!course.availableLanguages.includes(language)) {
      course.availableLanguages.push(language);
    }
    
    await course.save();
    
    res.json({
      success: true,
      message: `Language ${language} updated successfully`,
      course
    });
  } catch (error) {
    console.error('Error updating course language:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course language',
      error: error.message
    });
  }
};
exports.getAllCourses = async (req, res) => {
  try {
    console.log('📚 Fetching all course names');
    
    // Find all active courses
    const courses = await Course.find({ isActive: true })
      .select('languages availableLanguages')
      .lean();
    
    // Extract course names from all available languages
    const courseNames = [];
    
    courses.forEach(course => {
      if (course.languages) {
        // Add course names from each language
        Object.values(course.languages).forEach(langContent => {
          if (langContent && langContent.courseName) {
            courseNames.push(langContent.courseName);
          }
        });
      }
    });
    
    // Remove duplicates
    const uniqueCourseNames = [...new Set(courseNames)];
    
    console.log(`✅ Found ${uniqueCourseNames.length} unique course names`);
    
    res.json({
      success: true,
      courseNames: uniqueCourseNames,
      totalCourses: uniqueCourseNames.length
    });
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};
const syncFirebaseUser = async (req, res) => {
    try {
        console.log('🔄 SYNC endpoint hit!');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        
        // Get user data from request body
        const { uid, email, name, photoURL } = req.body;
        
        if (!uid || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: uid and email are required'
            });
        }
        
        console.log(`🔄 Syncing user: ${email} (UID: ${uid})`);
        
        // Check if user already exists by uid or email
        let user = await User.findOne({ $or: [{ uid: uid }, { email: email }] });
        
        if (!user) {
            // Create new user
            const username = name ? name.toLowerCase().replace(/\s/g, '') : email.split('@')[0];
            
            user = new User({
                uid: uid,
                email: email,
                name: name || email.split('@')[0],
                username: username,
                photoURL: photoURL || '',
                balance: 0,
                isActive: true,
                role: 'user',
                lastLogin: new Date(),
                // Initialize sessions
                sessions: [
                    { sessionNumber: 1, isLocked: false },
                    { sessionNumber: 2, isLocked: true },
                    { sessionNumber: 3, isLocked: true },
                    { sessionNumber: 4, isLocked: true }
                ]
            });
            
            // Generate invite code
            user.generateInviteCode();
            
            await user.save();
            console.log(`✅ New user created: ${email}`);
        } else {
            // Update existing user
            if (!user.uid && uid) user.uid = uid;
            if (name) user.name = name;
            if (photoURL) user.photoURL = photoURL;
            user.lastLogin = new Date();
            
            await user.save();
            console.log(`✅ User updated: ${email}`);
        }
        
        // Clear cache to refresh data
        cache.clear();
        
        res.json({
            success: true,
            message: 'User synced successfully',
            user: {
                id: user._id,
                uid: user.uid,
                email: user.email,
                name: user.name,
                username: user.username,
                balance: user.balance,
                isActive: user.isActive,
                role: user.role,
                photoURL: user.photoURL,
                inviteCode: user.inviteCode
            }
        });
    } catch (error) {
        console.error('❌ Error syncing user:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getCourseStructure = async (req, res) => {
  try {
    // Get all courses without filtering
    const courses = await Course.find({})
      .select('_id languages isActive')
      .lean();
    
    const result = courses.map(course => ({
      id: course._id,
      isActive: course.isActive,
      languages: Object.keys(course.languages || {}),
      hasEnglish: !!course.languages?.en,
      hasArabic: !!course.languages?.ar,
      englishName: course.languages?.en?.courseName || null,
      arabicName: course.languages?.ar?.courseName || null,
      englishPagesCount: course.languages?.en?.pages?.length || 0,
      arabicPagesCount: course.languages?.ar?.pages?.length || 0,
      firstEnglishPageTitle: course.languages?.en?.pages?.[0]?.title || null,
      firstArabicPageTitle: course.languages?.ar?.pages?.[0]?.title || null
    }));
    
    res.json({
      success: true,
      totalCourses: courses.length,
      courses: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getAllCoursesList = async (req, res) => {
  try {
    console.log('📚 Fetching ALL courses from database');
    
    // Don't filter by isActive - get everything
    const courses = await Course.find({})
      .select('_id languages availableLanguages isActive')
      .lean();
    
    const result = courses.map(course => ({
      id: course._id,
      isActive: course.isActive,
      availableLanguages: course.availableLanguages || [],
      hasEnglish: !!(course.languages?.en?.courseName),
      hasArabic: !!(course.languages?.ar?.courseName),
      englishName: course.languages?.en?.courseName || null,
      arabicName: course.languages?.ar?.courseName || null,
      englishPages: course.languages?.en?.pages?.length || 0,
      arabicPages: course.languages?.ar?.pages?.length || 0
    }));
    
    console.log(`✅ Found ${courses.length} total courses`);
    
    res.json({
      success: true,
      totalCourses: courses.length,
      courses: result
    });
  } catch (error) {
    console.error('Error listing courses:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
exports.listAllActiveCourses = async (req, res) => {
  try {
    console.log('📚 Listing all active courses');
    
    const courses = await Course.find({ isActive: true })
      .select('_id languages availableLanguages isActive')
      .lean();
    
    const result = courses.map(course => ({
      id: course._id,
      isActive: course.isActive,
      availableLanguages: course.availableLanguages || [],
      englishName: course.languages?.en?.courseName || null,
      arabicName: course.languages?.ar?.courseName || null,
      hasEnglish: !!course.languages?.en?.courseName,
      hasArabic: !!course.languages?.ar?.courseName,
      pagesCount: {
        en: course.languages?.en?.pages?.length || 0,
        ar: course.languages?.ar?.pages?.length || 0
      }
    }));
    
    res.json({
      success: true,
      totalActiveCourses: courses.length,
      courses: result
    });
  } catch (error) {
    console.error('Error listing courses:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
exports.getAllCoursesSimple = async (req, res) => {
  try {
    console.log('📚 Fetching all courses with their languages');
    
    const courses = await Course.find({ isActive: true })
      .select('languages availableLanguages')
      .lean();
    
    const result = courses.map(course => ({
      id: course._id,
      englishName: course.languages?.en?.courseName || null,
      availableLanguages: course.availableLanguages || [],
      languages: Object.keys(course.languages || {}).map(lang => ({
        language: lang,
        hasContent: !!course.languages[lang]?.courseName,
        courseName: course.languages[lang]?.courseName || null,
        pagesCount: course.languages[lang]?.pages?.length || 0,
        firstPageTitle: course.languages[lang]?.pages?.[0]?.title || null
      }))
    }));
    
    res.json({
      success: true,
      totalCourses: courses.length,
      courses: result
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
exports.debugCourseStructure = async (req, res) => {
  try {
    const { courseName } = req.params;
    
    const course = await Course.findOne({ 
      'languages.en.courseName': courseName 
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const debug = {
      id: course._id,
      availableLanguages: course.availableLanguages,
      languages: {}
    };
    
    // Show what languages actually have content
    const langKeys = ['en', 'ar', 'es', 'fr', 'de', 'zh'];
    langKeys.forEach(lang => {
      if (course.languages && course.languages[lang]) {
        debug.languages[lang] = {
          exists: true,
          courseName: course.languages[lang].courseName,
          pagesCount: course.languages[lang].pages?.length || 0,
          firstPageTitle: course.languages[lang].pages?.[0]?.title || null
        };
      } else {
        debug.languages[lang] = { exists: false };
      }
    });
    
    res.json(debug);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.uploadCourse = async (req, res) => {
  try {
    const { languages, uploadedBy } = req.body;

    // Validation: Check if at least one language has content
    if (!languages || Object.keys(languages).length === 0 || !uploadedBy) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. At least one language content is required." 
      });
    }

    // Find the first language that has content (any language, not necessarily English)
    const firstLanguage = Object.keys(languages).find(
      lang => languages[lang] && languages[lang].courseName
    );
    
    if (!firstLanguage) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one language must have a course name" 
      });
    }

    // Validate that the first found language has pages
    const firstLangData = languages[firstLanguage];
    if (!firstLangData.courseName || !Array.isArray(firstLangData.pages)) {
      return res.status(400).json({ 
        success: false, 
        message: "Course name and pages are required for at least one language" 
      });
    }

    // Filter out empty languages
    const filteredLanguages = {};
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'hi', 'ur'];
    
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

// Edit/update an existing course - FIXED: No longer requires English
exports.editCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { languages } = req.body;

    // ✅ FIX: Check if at least ONE language has content
    if (!languages || Object.keys(languages).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one language content is required",
      });
    }

    // Find the existing course first
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // Merge existing languages with new/updated languages
    const mergedLanguages = { ...existingCourse.languages.toObject() };
    
    // Add/update the provided languages
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'hi', 'ur'];
    supportedLanguages.forEach(lang => {
      if (languages[lang] && languages[lang].courseName) {
        mergedLanguages[lang] = languages[lang];
      }
    });

    // Filter out empty languages (keep only those with valid course names)
    const filteredLanguages = {};
    supportedLanguages.forEach(lang => {
      if (mergedLanguages[lang] && mergedLanguages[lang].courseName) {
        filteredLanguages[lang] = mergedLanguages[lang];
      }
    });

    // Update the course
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
// Get course by ID
// Get course by ID
// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    console.log(`📚 Fetching course ${id} in language: ${lang}`);

    const course = await Course.findById(id)
      .populate('uploadedBy', 'username email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // ✅ Get localized content based on requested language
    const localizedContent = course.getLocalizedContent(lang);

    console.log(`✅ Found course: ${localizedContent.courseName}`);
    console.log(`📄 Pages: ${localizedContent.pages?.length || 0}`);

    // ✅ Return ONLY the localized content
    res.json({ 
      success: true, 
      course: {
        _id: course._id,
        courseName: localizedContent.courseName,
        pages: localizedContent.pages,
        language: lang,
        isActive: course.isActive,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        uploadedBy: course.uploadedBy,
        availableLanguages: course.availableLanguages || []
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

    console.log(`📚 Fetching courses in language: ${language}`);

    // Find courses that have this language available
    const query = { 
      [`languages.${language}`]: { $exists: true },
      isActive: true 
    };

    const courses = await Course.find(query)
      .populate('uploadedBy', 'username email')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    console.log(`✅ Found ${courses.length} courses in ${language}`);

    // Transform courses to include only the requested language content
    const localizedCourses = courses.map(course => {
      const langContent = course.languages[language];
      
      if (!langContent) {
        console.log(`⚠️ No ${language} content for course ${course._id}`);
        return null;
      }
      
      return {
        id: course._id,
        courseName: langContent.courseName || 'Untitled',
        pages: langContent.pages || [],
        uploadedBy: course.uploadedBy,
        availableLanguages: course.availableLanguages || [],
        createdAt: course.createdAt
      };
    }).filter(course => course !== null); // Remove null entries

    res.json({ 
      success: true, 
      courses: localizedCourses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
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
};// Get available languages (with course counts)
// Get course by name (for convenience)
exports.getCourseByName = async (req, res) => {
  try {
    const { name } = req.params;
    const { lang = 'en' } = req.query;
    
    console.log(`📚 Finding course by name: ${name} in language: ${lang}`);
    
    // Search for course where any language has this name
    const course = await Course.findOne({
      $or: [
        { 'languages.en.courseName': decodeURIComponent(name) },
        { 'languages.ar.courseName': decodeURIComponent(name) },
        { 'languages.es.courseName': decodeURIComponent(name) },
        { 'languages.fr.courseName': decodeURIComponent(name) }
      ]
    }).populate('uploadedBy', 'username email');
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }
    
    // Get localized content
    const localizedContent = course.getLocalizedContent(lang);
    
    res.json({
      success: true,
      course: {
        _id: course._id,
        courseName: localizedContent.courseName,
        pages: localizedContent.pages,
        language: lang,
        isActive: course.isActive,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        uploadedBy: course.uploadedBy,
        availableLanguages: course.availableLanguages || []
      }
    });
  } catch (error) {
    console.error("Error getting course by name:", error);
    res.status(500).json({
      success: false,
      message: "Error getting course",
      error: error.message,
    });
  }
};
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
      ar: 'العربية',
      hi: 'हिंदी',
      ur: 'اردو'
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
// Add this to course.controller.js
exports.debugRoutes = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Course routes are working",
      availableLanguages: ['en', 'ar', 'es', 'fr', 'de', 'zh'],
      testEndpoint: '/api/courses/language/ar should work'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
