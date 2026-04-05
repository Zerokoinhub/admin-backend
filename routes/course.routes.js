const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// ============ SPECIFIC GET ROUTES (MUST BE FIRST) ============
router.get('/', courseController.getCourses);
// router.get('/all', courseController.getAllCourses);  // ❌ COMMENTED - Function missing
router.get('/all-simple', courseController.getAllCoursesSimple);
router.get('/list-all', courseController.getAllCoursesList);
router.get('/list-active', courseController.listAllActiveCourses);
router.get('/structure', courseController.getCourseStructure);
// router.get('/view-all', courseController.viewAllCoursesContent);  // ❌ COMMENTED - Function missing
router.get('/debug', courseController.debugRoutes);
router.get('/debug/:courseName', courseController.debugCourseStructure);
router.get('/by-name/:name', courseController.getCourseByName);
router.get('/language/:language', courseController.getCoursesByLanguage);
router.get('/languages/available', courseController.getAvailableLanguages);

// ============ DYNAMIC ID ROUTE (MUST BE LAST GET ROUTE) ============
router.get('/:id', courseController.getCourseById);

// ============ POST/PUT/DELETE ROUTES ============
router.post('/', courseController.uploadCourse);
// router.post('/update-language', courseController.updateCourseLanguage);  // ❌ COMMENTED - Function missing
router.post('/add-arabic/:courseId', courseController.addArabicContent);
router.post('/add-arabic-to-all', courseController.addArabicToExistingCourses);
router.post('/add-arabic-direct', courseController.addArabicToExistingCoursesDirect);
router.post('/create-all', courseController.createCourseWithBothLanguages);
router.put('/:id', courseController.editCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
