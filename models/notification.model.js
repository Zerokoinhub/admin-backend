const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: null
    },
    type: {
        type: String,
        enum: ['general', 'top-users', 'single-user'],
        required: true
    },
    recipient: { // For single-user notifications
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 