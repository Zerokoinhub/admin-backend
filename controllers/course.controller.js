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
// Update course language content
// Get all courses (simple list for dropdown)
// Debug endpoint to check all courses
// Add Arabic content to a specific course
exports.addArabicContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { arabicContent } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    
    course.languages.ar = arabicContent;
    if (!course.availableLanguages.includes('ar')) {
      course.availableLanguages.push('ar');
    }
    
    await course.save();
    
    res.json({ success: true, message: "Arabic content added successfully", course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add Arabic to all existing courses
exports.addArabicToExistingCourses = async (req, res) => {
  try {
    const { arabicContent } = req.body;
    const courses = await Course.find({});
    
    for (const course of courses) {
      course.languages.ar = arabicContent;
      if (!course.availableLanguages.includes('ar')) {
        course.availableLanguages.push('ar');
      }
      await course.save();
    }
    
    res.json({ success: true, message: `Arabic content added to ${courses.length} courses` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add Arabic to existing courses direct
exports.addArabicToExistingCoursesDirect = async (req, res) => {
  try {
    const { arabicContent } = req.body;
    const result = await Course.updateMany(
      {},
      { 
        $set: { 'languages.ar': arabicContent },
        $addToSet: { availableLanguages: 'ar' }
      }
    );
    
    res.json({ success: true, message: `Updated ${result.modifiedCount} courses` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create course with both languages
exports.createCourseWithBothLanguages = async (req, res) => {
  try {
    const { englishContent, arabicContent, uploadedBy } = req.body;
    
    const course = new Course({
      languages: {
        en: englishContent,
        ar: arabicContent
      },
      uploadedBy: uploadedBy,
      isActive: true,
      availableLanguages: ['en', 'ar']
    });
    
    await course.save();
    
    res.status(201).json({ success: true, message: "Course created with both languages", course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.debugAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({});
    console.log(`📚 Total courses in DB: ${courses.length}`);
    
    res.json({
      success: true,
      totalCourses: courses.length,
      courses: courses.map(c => ({
        id: c._id,
        isActive: c.isActive,
        hasLanguages: !!c.languages,
        languages: Object.keys(c.languages || {}),
        englishName: c.languages?.en?.courseName || null,
        arabicName: c.languages?.ar?.courseName || null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
// Get all course names (for dropdown) - RETURN ONLY PRIMARY/ENGLISH NAMES
exports.getAllCourses = async (req, res) => {
  try {
    console.log('📚 Fetching all course names - PRIMARY ONLY');
    
    const courses = await Course.find({ isActive: true })
      .select('courseName languages primaryName')
      .lean();
    
    const courseNames = [];
    
    courses.forEach(course => {
      // ✅ ONLY get the English/primary name
      let primaryName = null;
      
      // Priority 1: Get from languages.en
      if (course.languages && course.languages.en && course.languages.en.courseName) {
        primaryName = course.languages.en.courseName;
      }
      // Priority 2: Get from primaryName field
      else if (course.primaryName && course.primaryName.trim()) {
        primaryName = course.primaryName;
      }
      // Priority 3: Get from direct courseName field
      else if (course.courseName && course.courseName.trim()) {
        primaryName = course.courseName;
      }
      
      // Add only if not already added and if it's English (not Arabic)
      if (primaryName && !courseNames.includes(primaryName)) {
        // Skip Arabic course names
        const hasArabic = /[\u0600-\u06FF]/.test(primaryName);
        if (!hasArabic) {
          courseNames.push(primaryName);
          console.log(`✅ Added course: ${primaryName}`);
        }
      }
    });
    
    console.log(`✅ Total unique English courses: ${courseNames.length}`);
    
    res.status(200).json({ 
      success: true,
      courseNames: courseNames,
      totalCourses: courseNames.length
    });
  } catch (error) {
    console.error('Get courses error:', error.message);
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
    
    const courses = await Course.find({})
      .select('_id languages availableLanguages isActive')
      .lean();
    
    const result = courses.map(course => ({
      id: course._id,
      isActive: course.isActive,
      availableLanguages: course.availableLanguages || [],
      nameInEnglish: course.languages?.en?.courseName || null,
      nameInHindi: course.languages?.hi?.courseName || null,
      nameInUrdu: course.languages?.ur?.courseName || null,
      nameInArabic: course.languages?.ar?.courseName || null,
      nameInSpanish: course.languages?.es?.courseName || null,
      hasContent: {
        en: !!course.languages?.en?.courseName,
        hi: !!course.languages?.hi?.courseName,
        ur: !!course.languages?.ur?.courseName,
        ar: !!course.languages?.ar?.courseName,
        es: !!course.languages?.es?.courseName
      }
    }));
    
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
};// admin-backend/controllers/course.controller.js

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
      hindiName: course.languages?.hi?.courseName || null,
      urduName: course.languages?.ur?.courseName || null,
      arabicName: course.languages?.ar?.courseName || null,
      spanishName: course.languages?.es?.courseName || null,
      hasEnglish: !!course.languages?.en?.courseName,
      hasHindi: !!course.languages?.hi?.courseName,
      hasUrdu: !!course.languages?.ur?.courseName,
      hasArabic: !!course.languages?.ar?.courseName,
      hasSpanish: !!course.languages?.es?.courseName,
      pagesCount: {
        en: course.languages?.en?.pages?.length || 0,
        hi: course.languages?.hi?.pages?.length || 0,
        ur: course.languages?.ur?.pages?.length || 0,
        ar: course.languages?.ar?.pages?.length || 0,
        es: course.languages?.es?.pages?.length || 0
      }
    }));
    
    console.log(`✅ Found ${courses.length} active courses`);
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
    let { languages, uploadedBy, courseName, pages, language, name, description, title, content } = req.body;

    console.log('📚 Received course data:', JSON.stringify(req.body, null, 2));

    // ✅ Handle multiple possible formats
    if (!languages) {
      languages = {};
      
      // Format 1: { courseName, pages, language }
      if (courseName && pages) {
        const lang = language || 'en';
        languages[lang] = {
          courseName: courseName,
          pages: pages
        };
        console.log('📚 Converted from format 1 (courseName/pages)');
      }
      // Format 2: { name, description, content }
      else if (name && description) {
        const lang = language || 'en';
        languages[lang] = {
          courseName: name,
          pages: [{
            title: description,
            content: content || description,
            time: "120"
          }]
        };
        console.log('📚 Converted from format 2 (name/description)');
      }
      // Format 3: { title, content }
      else if (title && content) {
        const lang = language || 'en';
        languages[lang] = {
          courseName: title,
          pages: [{
            title: title,
            content: content,
            time: "120"
          }]
        };
        console.log('📚 Converted from format 3 (title/content)');
      }
    }

    // Validation
    if (!languages || Object.keys(languages).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. At least one language content is required.",
        received: req.body
      });
    }

    // Get first language that has content
    const firstLang = Object.keys(languages).find(lang => languages[lang]?.courseName);
    if (!firstLang) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one language must have a course name" 
      });
    }

    // Validate pages
    const firstLangData = languages[firstLang];
    if (!firstLangData.pages || !Array.isArray(firstLangData.pages) || firstLangData.pages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one page is required" 
      });
    }

    // Set uploadedBy
    if (!uploadedBy) {
      uploadedBy = req.user?._id || "67c0b5f8e4b0d5a1b2c3d4e5";
    }

    const course = new Course({
      languages: languages,
      uploadedBy: uploadedBy,
      isActive: true,
      availableLanguages: Object.keys(languages)
    });

    await course.save();

    res.status(201).json({ 
      success: true, 
      message: "Course uploaded successfully",
      course: {
        id: course._id,
        languages: course.languages,
        availableLanguages: course.availableLanguages
      }
    });
  } catch (error) {
    console.error("Error uploading course:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading course",
      error: error.message,
    });
  }
};// Edit/update an existing course - FIXED: No longer requires English
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
// Get all courses - WITH ALL LANGUAGES
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({})
      .populate('uploadedBy', 'username email')
      .sort('-createdAt');

    console.log(`📚 Found ${courses.length} total courses in database`);

    const transformedCourses = courses.map(course => {
      const courseObj = course.toObject();
      
      // Get names in all languages
      const languages = {
        en: courseObj.languages?.en?.courseName || null,
        hi: courseObj.languages?.hi?.courseName || null,
        ur: courseObj.languages?.ur?.courseName || null,
        ar: courseObj.languages?.ar?.courseName || null,
        es: courseObj.languages?.es?.courseName || null
      };
      
      // Primary name (English or first available)
      let primaryName = languages.en || languages.hi || languages.ur || languages.ar || languages.es || 'Untitled';
      
      return {
        ...courseObj,
        primaryName: primaryName,
        languages: languages,
        availableLanguages: courseObj.availableLanguages || [],
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
};// Admin Backend - Update this function
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📚 Fetching course ${id} with all languages`);

    const course = await Course.findById(id)
      .populate('uploadedBy', 'username email');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // ✅ Return FULL course with all languages
    res.json({ 
      success: true, 
      course: {
        _id: course._id,
        courseName: course.courseName || course.primaryName,
        languages: course.languages || {},  // ✅ Important: Return all languages
        pages: course.pages,
        availableLanguages: course.availableLanguages || [],
        isActive: course.isActive,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        uploadedBy: course.uploadedBy
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
};// Get courses by language (for Flutter app)
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
