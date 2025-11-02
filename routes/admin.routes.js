const express = require('express');
const adminController = require('../controllers/admin.controller');
const router = express.Router();


router.post('/register', adminController.adminRegister);
router.post('/login', adminController.adminLogin);
router.get('/', adminController.getAdmins);
router.put('/:id', adminController.editAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router; 