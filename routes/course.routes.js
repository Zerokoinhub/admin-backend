const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// ============ SPECIFIC ROUTES FIRST ============
// These must come BEFORE the dynamic /:id route

// List/View routes
router.get('/', courseController.getCourses);
router.get('/all-simple', courseController.getAllCoursesSimple);
router.get('/list-all', courseController.getAllCoursesList);
router.get('/list-active', courseController.listAllActiveCourses);
router.get('/structure', courseController.getCourseStructure);
router.get('/view-all', courseController.viewAllCoursesContent);

// Debug routes
router.get('/debug', courseController.debugRoutes);
router.get('/debug/:courseName', courseController.debugCourseStructure);
router.get('/by-name/:name', courseController.getCourseByName);

// Language-specific routes (CRITICAL - these must be BEFORE /:id)
router.get('/language/:language', courseController.getCoursesByLanguage);
router.get('/languages/available', courseController.getAvailableLanguages);

// ============ DYNAMIC ROUTE LAST ============
// This catches everything that didn't match above
router.get('/:id', courseController.getCourseById);

// ============ POST/PUT/DELETE ROUTES ============
// These don't conflict with GET routes
router.post('/', courseController.uploadCourse);
router.post('/update-language', courseController.updateCourseLanguage);
router.post('/add-arabic/:courseId', courseController.addArabicContent);
router.post('/add-arabic-to-all', courseController.addArabicToExistingCourses);
router.post('/add-arabic-direct', courseController.addArabicToExistingCoursesDirect);
router.post('/create-all', courseController.createCourseWithBothLanguages);
router.put('/:id', courseController.editCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
