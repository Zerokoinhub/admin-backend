// const express = require('express');
// const notificationController = require('../controllers/notification.controller');
// const upload = require('../config/multer');
// const router = express.Router();


// // router.post('/general', notificationController.sendGeneralNotification);
// router.post('/top-users', notificationController.sendTopUsersNotification);
// router.post('/single-user', notificationController.sendSingleUserNotification);
// router.post('/general-with-image', upload.single('image'), notificationController.sendGeneralNotificationWithImage);

// module.exports = router; 




// const express = require("express")
// const notificationController = require("../controllers/notification.controller")
// const upload = require("../config/multer")

// const router = express.Router()

// // POST routes (existing)
// router.post("/general", notificationController.sendGeneralNotification)
// router.post("/top-users", notificationController.sendTopUsersNotification)
// router.post("/single-user", notificationController.sendSingleUserNotification)
// router.post("/general-with-image", upload.single("image"), notificationController.sendGeneralNotificationWithImage)

// // GET routes (new)
// router.get("/", notificationController.getNotifications)
// router.get("/:id", notificationController.getNotificationById)

// module.exports = router


const express = require("express")
const notificationController = require("../controllers/notification.controller")
const upload = require("../config/multer")

const router = express.Router()

// ==========================
// POST Routes
// ==========================

// Send general notification to all users
// Body: { title, message, imageUrl, link?, priority? }
router.post("/general", notificationController.sendGeneralNotification)

// Send notification to top N users
// Body: { title, message, imageUrl, link?, limit?, priority? }
router.post("/top-users", notificationController.sendTopUsersNotification)

// Send notification to a single user
// Body: { title, message, imageUrl, link?, firebaseUid, priority? }
router.post("/single-user", notificationController.sendSingleUserNotification)

// Send general notification with image upload
// FormData: { title, message, link?, priority?, image (file) }
router.post(
  "/general-with-image",
  upload.single("image"),
  notificationController.sendGeneralNotificationWithImage
)

// ==========================
// GET Routes
// ==========================

// Get paginated list of notifications
// Query params: page?, limit?, type?, priority?
router.get("/", notificationController.getNotifications)

// Get single notification by ID
router.get("/:id", notificationController.getNotificationById)

module.exports = router
