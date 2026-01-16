import { db } from '@/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

export class LiveKitService {
  static async getToken(
    teamId: string,
    userId: string,
    userName: string
  ): Promise<string> {
    try {
      const apiUrl = import.meta.env.VITE_VERCEL_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: `team-${teamId}`,
          participantName: userName,
          userId,
          teamId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
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
