// routes/course.routes.js
const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

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
