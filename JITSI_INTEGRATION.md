# Jitsi Meet Integration

## Firestore Schema

```javascript
// Collection: calls/{teamId}
{
  "roomId": "team-123-1641234567890",
  "active": true,
  "createdBy": "user-uid-123",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

## Implementation Files

1. **useJitsiCall.ts** - React hook for Jitsi Meet integration
2. **CallPanel.tsx** - UI component for call interface
3. **index.html** - Includes Jitsi External API script

## Features

✅ Start/Join calls with team-specific room IDs
✅ Auto-join with Firebase user display name
✅ Mute/unmute audio and video controls
✅ Call status tracking (idle/connecting/connected/ended)
✅ Firestore integration for room coordination
✅ Full-screen call interface
✅ Clean leave call functionality

## Usage

```typescript
const { status, startCall, joinCall, leaveCall, toggleAudio, toggleVideo } = 
  useJitsiCall(teamId, userId, displayName);

// Start a new call
startCall(`team-${teamId}-${Date.now()}`);

// Join existing call
joinCall(`team-${teamId}`);

// Leave call
leaveCall();
```

## Production Ready

- No WebRTC complexity
- No TURN/STUN configuration needed
- Uses Jitsi's reliable infrastructure
- Simple Firestore coordination
- Works on all networks including college WiFi
