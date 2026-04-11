// admin-backend/routes/sync-settings.js
router.post('/sync-settings', async (req, res) => {
  try {
    const { rewards } = req.body;
    
    // Forward to app backend
    const response = await fetch(`${APP_BACKEND_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.headers.authorization}`
      },
      body: JSON.stringify({ rewards })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
