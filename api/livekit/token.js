const { AccessToken } = require('livekit-server-sdk');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomName, participantName, userId, teamId } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '2h',
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      token: jwt,
      serverUrl,
    });
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};
