// const express = require('express');
// const notificationController = require('../controllers/notification.controller');
// const upload = require('../config/multer');
// const router = express.Router();


// // router.post('/general', notificationController.sendGeneralNotification);
// router.post('/top-users', notificationController.sendTopUsersNotification);
// router.post('/single-user', notificationController.sendSingleUserNotification);
// router.post('/general-with-image', upload.single('image'), notificationController.sendGeneralNotificationWithImage);

// module.exports = router; 




const express = require("express")
const notificationController = require("../controllers/notification.controller")
const upload = require("../config/multer")

const router = express.Router()

// POST routes (existing)
router.post("/general", notificationController.sendGeneralNotification)
router.post("/top-users", notificationController.sendTopUsersNotification)
router.post("/single-user", notificationController.sendSingleUserNotification)
router.post("/general-with-image", upload.single("image"), notificationController.sendGeneralNotificationWithImage)

// GET routes (new)
router.get("/", notificationController.getNotifications)
router.get("/:id", notificationController.getNotificationById)

module.exports = router
