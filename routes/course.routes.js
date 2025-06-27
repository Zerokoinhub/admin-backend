const express = require('express');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// Get all courses
router.get('/', courseController.getCourses);

// Upload course
router.post('/', courseController.uploadCourse);

// Edit course
router.put('/:id', courseController.editCourse);

// Delete course
router.delete('/:id', courseController.deleteCourse);

module.exports = router; 