const express = require('express');
const router = express.Router();
const { connectDB } = require('../lib/db');

// POST /api/users/deduct-screenshot-coins
router.post('/deduct-screenshot-coins', async (req, res) => {
  try {
    const { email, amount, admin } = req.body;
    
    console.log("📤 Deduct request:", { email, amount, admin });
    
    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount required' });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentBalance = user.balance || 0;
    const newBalance = currentBalance - amount;
    
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Update balance directly
    await db.collection('users').updateOne(
      { email: email },
      { 
        $set: { 
          balance: newBalance,
          updatedAt: new Date()
        } 
      }
    );
    
    // Record transaction
    await db.collection('transfers').insertOne({
      email: email,
      userName: user.name,
      amount: -amount,
      adminName: admin || 'System',
      reason: 'Screenshot approval revoked',
      status: 'completed',
      createdAt: new Date()
    });

    console.log("✅ Deduct successful:", { email, newBalance });
    
    return res.status(200).json({ 
      success: true, 
      newBalance: newBalance,
      message: `${amount} coins deducted successfully`
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
