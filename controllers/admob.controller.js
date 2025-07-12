const axios = require('axios');

const {
  AD_CLIENT_ID,
  AD_CLIENT_SECRET,
  AD_REFRESH_TOKEN,
  AD_PUBLISHER_ID
} = process.env;

exports.getAdmobReport = async (req, res) => {
  try {
    // 🔁 Step 1: Get new access_token using refresh_token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        client_id: AD_CLIENT_ID,
        client_secret: AD_CLIENT_SECRET,
        refresh_token: AD_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const access_token = tokenRes.data.access_token;

    // 📊 Step 2: Request AdMob report
    const reportRes = await axios.post(
      `https://admob.googleapis.com/v1/accounts/${AD_PUBLISHER_ID}/reports:generate`,
      {
        reportSpec: {
          dateRange: {
            startDate: { year: 2025, month: 7, day: 10 },
            endDate: { year: 2025, month: 7, day: 10 }
          },
          metrics: ['ESTIMATED_EARNINGS', 'CLICKS', 'IMPRESSIONS'],
          dimensions: ['DATE']
        }
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reportData = reportRes.data;

    res.status(200).json({
      success: true,
      message: 'AdMob report fetched successfully',
      data: reportData
    });
  } catch (error) {
    console.error('AdMob API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AdMob report',
      error: error.response?.data || error.message
    });
  }
};
