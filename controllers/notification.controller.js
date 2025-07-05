// const Notification = require('../models/notification.model');
// const User = require('../models/user.model');
// const notificationService = {
//     send: async (userId, title, message, imageUrl) => {
//         console.log(`Sending notification to user ${userId}: '${title}' - '${message}' - Image: ${imageUrl}`);
//         return Promise.resolve();
//     },
//     sendToAll: async (title, message, imageUrl) => {
//         console.log(`Sending general notification to all users: '${title}' - '${message}' - Image: ${imageUrl}`);
//         return Promise.resolve();
//     }
// };


// exports.sendGeneralNotification = async (req, res) => {
//     try {
//         const { title, message, imageUrl } = req.body;


//         const notification = new Notification({
//             title,
//             message,
//             imageUrl,
//             type: 'general'
//         });
//         await notification.save();


//         await notificationService.sendToAll(title, message, imageUrl);

//         res.status(200).json({ success: true, message: 'General notification sent successfully.' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Failed to send general notification', error: error.message });
//     }
// };


// exports.sendTopUsersNotification = async (req, res) => {
//     try {
//         const { title, message, imageUrl, limit = 10 } = req.body;


//         const topUsers = await User.find().sort({ points: -1 }).limit(limit);

//         if (topUsers.length === 0) {
//             return res.status(404).json({ success: false, message: 'No users found to notify.' });
//         }


//         const notificationPromises = topUsers.map(user => {
//             const notification = new Notification({
//                 title,
//                 message,
//                 imageUrl,
//                 type: 'top-users',
//                 recipient: user._id
//             });
//             return Promise.all([
//                 notification.save(),
//                 notificationService.send(user._id, title, message, imageUrl)
//             ]);
//         });

//         await Promise.all(notificationPromises);

//         res.status(200).json({ success: true, message: `Notification sent to top ${topUsers.length} users.` });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Failed to send notification to top users', error: error.message });
//     }
// };


// exports.sendSingleUserNotification = async (req, res) => {
//     try {
//         const { title, message, imageUrl, firebaseUid } = req.body;


//         const user = await User.findOne({ firebaseUid });

//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found.' });
//         }


//         const notification = new Notification({
//             title,
//             message,
//             imageUrl,
//             type: 'single-user',
//             recipient: user._id
//         });
//         await notification.save();


//         await notificationService.send(user._id, title, message, imageUrl);

//         res.status(200).json({ success: true, message: 'Notification sent to the user successfully.' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Failed to send notification to the user', error: error.message });
//     }
// };


// exports.sendGeneralNotificationWithImage = async (req, res) => {
//     try {
//         const { title, message } = req.body;
//         const imageUrl = req.file ? req.file.path : null; 

//         if (!title || !message) {
//             return res.status(400).json({ success: false, message: 'Title and message are required.' });
//         }


//         const notification = new Notification({
//             title,
//             message,
//             imageUrl,
//             type: 'general'
//         });
//         await notification.save();


//         await notificationService.sendToAll(title, message, imageUrl);

//         res.status(200).json({ 
//             success: true, 
//             message: 'General notification sent successfully.',
//             data: {
//                 title,
//                 message,
//                 imageUrl
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Failed to send general notification', error: error.message });
//     }
// }; 







const Notification = require("../models/notification.model")
const User = require("../models/user.model")

const notificationService = {
  send: async (userId, title, message, imageUrl) => {
    console.log(`Sending notification to user ${userId}: '${title}' - '${message}' - Image: ${imageUrl}`)
    return Promise.resolve()
  },

  sendToAll: async (title, message, imageUrl) => {
    console.log(`Sending general notification to all users: '${title}' - '${message}' - Image: ${imageUrl}`)
    return Promise.resolve()
  },
}

exports.sendGeneralNotification = async (req, res) => {
  try {
    const { title, message, imageUrl, priority = "old-user" } = req.body

    const notification = new Notification({
      title,
      message,
      imageUrl,
      type: "general",
      priority,
    })

    await notification.save()
    await notificationService.sendToAll(title, message, imageUrl)

    res.status(200).json({ success: true, message: "General notification sent successfully." })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send general notification", error: error.message })
  }
}

exports.sendTopUsersNotification = async (req, res) => {
  try {
    const { title, message, imageUrl, limit = 10, priority = "top-rated-user" } = req.body

    const topUsers = await User.find().sort({ points: -1 }).limit(limit)

    if (topUsers.length === 0) {
      return res.status(404).json({ success: false, message: "No users found to notify." })
    }

    const notificationPromises = topUsers.map((user) => {
      const notification = new Notification({
        title,
        message,
        imageUrl,
        type: "top-users",
        priority,
        recipient: user._id,
      })

      return Promise.all([notification.save(), notificationService.send(user._id, title, message, imageUrl)])
    })

    await Promise.all(notificationPromises)

    res.status(200).json({ success: true, message: `Notification sent to top ${topUsers.length} users.` })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send notification to top users", error: error.message })
  }
}

exports.sendSingleUserNotification = async (req, res) => {
  try {
    const { title, message, imageUrl, firebaseUid, priority = "old-user" } = req.body

    const user = await User.findOne({ firebaseUid })

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." })
    }

    const notification = new Notification({
      title,
      message,
      imageUrl,
      type: "single-user",
      priority,
      recipient: user._id,
    })

    await notification.save()
    await notificationService.send(user._id, title, message, imageUrl)

    res.status(200).json({ success: true, message: "Notification sent to the user successfully." })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send notification to the user", error: error.message })
  }
}

exports.sendGeneralNotificationWithImage = async (req, res) => {
  try {
    const { title, message, priority = "old-user" } = req.body
    const imageUrl = req.file ? req.file.path : null

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required." })
    }

    const notification = new Notification({
      title,
      message,
      imageUrl,
      type: "general",
      priority,
    })

    await notification.save()
    await notificationService.sendToAll(title, message, imageUrl)

    res.status(200).json({
      success: true,
      message: "General notification sent successfully.",
      data: {
        title,
        message,
        imageUrl,
        priority,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send general notification", error: error.message })
  }
}

// GET API to retrieve notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, priority } = req.query

    const filter = {}
    if (type) filter.type = type
    if (priority) filter.priority = priority

    const notifications = await Notification.find(filter)
      .populate("recipient", "name email firebaseUid")
      .populate("sentBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Notification.countDocuments(filter)

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
      error: error.message,
    })
  }
}

// GET API to retrieve single notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await Notification.findById(id)
      .populate("recipient", "name email firebaseUid")
      .populate("sentBy", "name email")

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      })
    }

    res.status(200).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification",
      error: error.message,
    })
  }
}
