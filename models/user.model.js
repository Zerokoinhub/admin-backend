const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Add Firebase UID field - THIS IS CRITICAL
    uid: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined for email/password users
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        minlength: 6
        // Not required for Firebase users (they authenticate via Firebase)
    },
    photoURL: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user',
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
        type: Date,
        index: true
    },
    balance: {
        type: Number,
        default: 0
    },
    recentAmount: {
        type: Number,
        default: 0
    },
    calculatorUsage: {
        type: Number,
        default: 0
    },
    inviteCode: {
        type: String,
        default: ''
    },
    referredBy: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    walletStatus: {
        type: String,
        enum: ['Connected', 'Not Connected', 'Pending'],
        default: 'Not Connected'
    },
    walletAddresses: {
        metamask: { type: String, default: '' },
        trustWallet: { type: String, default: '' }
    },
    notificationSettings: {
        sessionUnlocked: { type: Boolean, default: true },
        pushEnabled: { type: Boolean, default: true }
    },
    fcmTokens: [{
        type: String
    }],
    sessions: [{
        sessionNumber: {
            type: Number,
            required: true
        },
        unlockedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        isLocked: {
            type: Boolean,
            default: true
        },
        isClaimed: {
            type: Boolean,
            default: false
        }
    }],
    screenshots: [{
        url: String,
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for common queries
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ balance: -1 }); // For leaderboard
userSchema.index({ uid: 1 }); // Index for Firebase user lookup

// Hash password before saving (only if password is provided)
userSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Only hash password if it exists and is modified
    if (this.password && this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate invite code
userSchema.methods.generateInviteCode = function() {
    const crypto = require('crypto');
    this.inviteCode = crypto.randomBytes(16).toString('hex');
    return this.inviteCode;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
