router.get('/list-all', courseController.getAllCoursesList);
// routes/course.routes.js
const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();
// In course.routes.js - add this BEFORE router.get('/:id', ...)
router.get('/structure', courseController.getCourseStructure);
router.get('/list-active', courseController.listAllActiveCourses);
// In course.routes.js - place this BEFORE router.get('/:id', ...)
router.get('/all-simple', courseController.getAllCoursesSimple);
// Basic CRUD
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', courseController.uploadCourse);
router.put('/:id', courseController.editCourse);
router.delete('/:id', courseController.deleteCourse);
// Add this route for debugging
router.get('/debug', courseController.debugRoutes);
// In course.routes.js
router.get('/debug/:courseName', courseController.debugCourseStructure);
// Language-specific endpoints (for Flutter app)
router.get('/language/:language', courseController.getCoursesByLanguage);
router.get('/languages/available', courseController.getAvailableLanguages);

module.exports = router;
