/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {AccessToken} = require("livekit-server-sdk");

setGlobalOptions({maxInstances: 10});

exports.generateLiveKitToken = onCall(async (request) => {
  const {teamId, userId, userName} = request.data;

  if (!teamId || !userId || !userName) {
    throw new Error("Missing required parameters");
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured");
  }

  const roomName = `team-${teamId}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    token: await token.toJwt(),
    serverUrl: process.env.LIVEKIT_URL ||
      "wss://contrimeter-zrqb8qkn.livekit.cloud",
  };
});
