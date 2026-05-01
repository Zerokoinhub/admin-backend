const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// ============ TEST ROUTES ============
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Routes are working!' });
});

router.get('/language-test/:lang', (req, res) => {
  res.json({ success: true, language: req.params.lang, message: 'Language route is working!' });
});

// ============ POST/PUT/DELETE ROUTES (MUST COME FIRST) ============
router.post('/', courseController.uploadCourse);
router.post('/update-language', courseController.updateCourseLanguage);
router.post('/add-arabic/:courseId', courseController.addArabicContent);
router.post('/add-arabic-to-all', courseController.addArabicToExistingCourses);
router.post('/add-arabic-direct', courseController.addArabicToExistingCoursesDirect);
router.post('/create-all', courseController.createCourseWithBothLanguages);
router.put('/:id', courseController.editCourse);
router.delete('/:id', courseController.deleteCourse);

// ============ GET ROUTES (Specific paths first) ============
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
router.get('/', courseController.getCourses);

// ============ DYNAMIC ID ROUTE (MUST BE ABSOLUTELY LAST) ============
router.get('/:id', courseController.getCourseById);

module.exports = router;
