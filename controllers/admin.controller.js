const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs"); // required if password hashing is used

const generateToken = (adminId) => {
    return jwt.sign({ id: adminId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '24h'
    });
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = generateToken(admin._id);
        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                token,
                admin: {
                    id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error in admin login', error: error.message });
    }
};

exports.adminRegister = async (req, res) => {
  try {
    console.log("Incoming admin registration payload:", req.body);

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      console.log("❌ Missing fields");
      return res.status(400).json({
        success: false,
        message: 'All fields (username, email, password, role) are required.',
      });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      console.log("❌ Admin already exists:", existingAdmin.email);
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email or username',
      });
    }

    const admin = new Admin({ username, email, password, role });
    await admin.save();
    console.log("✅ Admin saved successfully:", admin.email);

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error("🔥 Admin registration error:", error);
    res.status(500).json({
      success: false,
      message: 'Error in admin registration',
      error: error.message,
    });
  }
};


// Get all admins
exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.json({ success: true, admins });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching admins', error: error.message });
    }
};

// Edit admin
exports.editAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // ✅ Update fields if provided
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;

    // ✅ Only assign password (hashing will be handled by pre-save hook)
    if (password?.trim()) {
      admin.password = password.trim();
    }

    // ✅ Save admin and trigger pre-save hook for hashing
    await admin.save();

    // ✅ Return admin object without password
    const { password: _, ...adminData } = admin.toObject();
    res.json({ success: true, admin: adminData });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error editing admin", error: error.message });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        res.json({ success: true, message: 'Admin deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting admin', error: error.message });
    }
}; 