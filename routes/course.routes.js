const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// Get all courses (with optional language parameter)
// Example: /api/courses?lang=hi
router.get('/', courseController.getCourses);

// Get single course by ID (with optional language parameter)
// Example: /api/courses/123456?lang=ur
router.get('/:id', courseController.getCourseById);

// Upload course
router.post('/', courseController.uploadCourse);

// Edit course
router.put('/:id', courseController.editCourse);

// Delete course
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
