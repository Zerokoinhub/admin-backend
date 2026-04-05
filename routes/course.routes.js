const express = require('express');
const router = express.Router();

// Simple working routes
router.get('/', (req, res) => {
  res.json({ success: true, message: "Courses API working" });
});

router.get('/all', (req, res) => {
  res.json({ success: true, courses: [] });
});

router.get('/language/:language', (req, res) => {
  res.json({ success: true, courses: [] });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: "Course found" });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: "Course created" });
});

module.exports = router;
