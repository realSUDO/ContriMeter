import { AccessToken } from 'livekit-server-sdk';

export class LiveKitService {
  static async getToken(
    teamId: string,
    userId: string,
    userName: string
  ): Promise<string> {
    const roomName = `team-${teamId}`;
    const apiKey = import.meta.env.VITE_LIVEKIT_API_KEY;
    const apiSecret = import.meta.env.VITE_LIVEKIT_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }
    
    try {
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
      
      return await token.toJwt();
    } catch (error) {
      console.error('Failed to generate LiveKit token:', error);
      throw error;
    }
  }
  
  static getRoomName(teamId: string): string {
    return `team-${teamId}`;
  }
  
  static getServerUrl(): string {
    const url = import.meta.env.VITE_LIVEKIT_URL;
    if (!url) {
      throw new Error('LiveKit URL not configured');
    }
    return url;
  }
}
