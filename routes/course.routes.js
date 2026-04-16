// Add this at the very beginning, before all other routes
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Routes are working!' });
});

router.get('/language-test/:lang', (req, res) => {
  res.json({ success: true, language: req.params.lang, message: 'Language route is working!' });
});
const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// ============ GET ROUTES ============
router.get('/', courseController.getCourses);
router.get('/all', courseController.getAllCourses);
router.get('/all-simple', courseController.getAllCoursesSimple);
router.get('/list-all', courseController.getAllCoursesList);
router.get('/list-active', courseController.listAllActiveCourses);
router.get('/structure', courseController.getCourseStructure);
router.get('/view-all', courseController.viewAllCoursesContent);
router.get('/debug', courseController.debugRoutes);
router.get('/debug/all', courseController.debugAllCourses);
router.get('/debug/:courseName', courseController.debugCourseStructure);
router.get('/by-name/:name', courseController.getCourseByName);
router.get('/language/:language', courseController.getCoursesByLanguage);
router.get('/languages/available', courseController.getAvailableLanguages);

// ============ DYNAMIC ID ROUTE (MUST BE LAST GET ROUTE) ============
router.get('/:id', courseController.getCourseById);

// ============ POST/PUT/DELETE ROUTES ============
router.post('/', courseController.uploadCourse);
router.post('/update-language', courseController.updateCourseLanguage);
router.post('/add-arabic/:courseId', courseController.addArabicContent);
router.post('/add-arabic-to-all', courseController.addArabicToExistingCourses);
router.post('/add-arabic-direct', courseController.addArabicToExistingCoursesDirect);
router.post('/create-all', courseController.createCourseWithBothLanguages);
router.put('/:id', courseController.editCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
