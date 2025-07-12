const express = require("express");
const router = express.Router();
const axios = require("axios");
const admobController = require("../controllers/admob.controller");
    const qs = require("querystring");

// Step 1: OAuth Redirect URI route — GET /api/admob/oauth/callback
router.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("❌ No code received from Google.");
  }

  try {
    // Exchange code for tokens (you can also move this logic to a controller if needed)

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: process.env.AD_CLIENT_ID,
        client_secret: process.env.AD_CLIENT_SECRET,
        redirect_uri: process.env.AD_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // ✅ For testing: just return them in browser (don't do this in production)
    return res.status(200).send(`
      <h2>✅ Token Received!</h2>
      <p><strong>Access Token:</strong> ${access_token}</p>
      <p><strong>Refresh Token:</strong> ${refresh_token}</p>
      <p><strong>Expires In:</strong> ${expires_in} seconds</p>
      <p>Copy your refresh token and save it in your .env file as <code>AD_REFRESH_TOKEN=...</code></p>
    `);
  } catch (err) {
    console.error(
      "❌ Token exchange failed:",
      err.response?.data || err.message
    );
    return res.status(500).send("❌ Failed to exchange code for tokens.");
  }
});

// Step 2: Fetch AdMob Report — GET /api/admob/report
router.get("/report", admobController.getAdmobReport);

module.exports = router;
