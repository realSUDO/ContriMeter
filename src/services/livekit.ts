import { AccessToken } from 'livekit-server-sdk';
import { db } from '@/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

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
  
  static async markUserInCall(teamId: string, userId: string, userName: string): Promise<void> {
    const callRef = doc(db, 'teams', teamId, 'activeCall', userId);
    await setDoc(callRef, {
      userId,
      userName,
      joinedAt: new Date(),
    });
  }
  
  static async removeUserFromCall(teamId: string, userId: string): Promise<void> {
    const callRef = doc(db, 'teams', teamId, 'activeCall', userId);
    await deleteDoc(callRef);
  }
  
  static subscribeToActiveCall(teamId: string, callback: (count: number) => void): () => void {
    const callCollection = collection(db, 'teams', teamId, 'activeCall');
    return onSnapshot(callCollection, (snapshot) => {
      callback(snapshot.size);
    });
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
