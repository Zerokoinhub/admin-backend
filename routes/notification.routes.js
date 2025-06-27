const express = require('express');
const notificationController = require('../controllers/notification.controller');
const upload = require('../config/multer');
const router = express.Router();


// router.post('/general', notificationController.sendGeneralNotification);
router.post('/top-users', notificationController.sendTopUsersNotification);
router.post('/single-user', notificationController.sendSingleUserNotification);
router.post('/general-with-image', upload.single('image'), notificationController.sendGeneralNotificationWithImage);

module.exports = router; 