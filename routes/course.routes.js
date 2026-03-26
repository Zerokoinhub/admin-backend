router.get('/', courseController.getCourses);
router.get('/all-simple', courseController.getAllCoursesSimple);
router.get('/list-all', courseController.getAllCoursesList);
router.get('/list-active', courseController.listAllActiveCourses);
router.get('/structure', courseController.getCourseStructure);
router.get('/view-all', courseController.viewAllCoursesContent);
router.get('/debug', courseController.debugRoutes);
router.get('/debug/:courseName', courseController.debugCourseStructure);
router.get('/by-name/:name', courseController.getCourseByName);
router.get('/language/:language', courseController.getCoursesByLanguage);  // ← This is here
router.get('/languages/available', courseController.getAvailableLanguages);
router.get('/:id', courseController.getCourseById);  // ← This is AFTER language route - GOOD!
