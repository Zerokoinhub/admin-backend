const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// ============ WORKING ROUTES ============
router.get('/', courseController.getCourses);
router.get('/all', courseController.getAllCoursesList);
router.get('/all-simple', courseController.getAllCoursesSimple);
router.get('/list-active', courseController.listAllActiveCourses);
router.get('/structure', courseController.getCourseStructure);
router.get('/language/:language', courseController.getCoursesByLanguage);
router.get('/languages/available', courseController.getAvailableLanguages);
router.get('/:id', courseController.getCourseById);

// ============ POST ROUTES ============
router.post('/', courseController.uploadCourse);
router.put('/:id', courseController.editCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
