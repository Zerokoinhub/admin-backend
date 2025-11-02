const express = require('express');
const pageController = require('../controllers/page.controller');

const router = express.Router();

// Add a new page
router.post('/', pageController.addPage);

// Get all active pages
router.get('/', pageController.getPages);

// Get a page by slug
router.get('/:slug', pageController.getPageBySlug);

// Update a page
router.put('/:id', pageController.updatePage);

// Delete a page
router.delete('/:id', pageController.deletePage);

module.exports = router; 