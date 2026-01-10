import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'ended';

interface JitsiCallState {
  status: CallStatus;
  roomId: string | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
}

export const useJitsiCall = (teamId: string, userId: string | null, displayName: string) => {
  const [state, setState] = useState<JitsiCallState>({
    status: 'idle',
    roomId: null,
    isAudioMuted: false,
    isVideoMuted: false
  });

  const apiRef = useRef<any>(null);

  // Initialize Jitsi once when user is available
  useEffect(() => {
    if (!apiRef.current && userId && state.roomId) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: state.roomId,
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#jitsi-container'),
        userInfo: { displayName },
        configOverwrite: {
          enableLobby: false,
          prejoinPageEnabled: false
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false
        }
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListener('videoConferenceJoined', () => {
        setState(prev => ({ ...prev, status: 'connected' }));
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        setState(prev => ({ ...prev, status: 'ended' }));
      });

      apiRef.current.addEventListener('audioMuteStatusChanged', (event: any) => {
        setState(prev => ({ ...prev, isAudioMuted: event.muted }));
      });

      apiRef.current.addEventListener('videoMuteStatusChanged', (event: any) => {
        setState(prev => ({ ...prev, isVideoMuted: event.muted }));
      });
    }
  }, [userId, state.roomId, displayName]);

  // Update display name when it changes
  useEffect(() => {
    if (apiRef.current && displayName) {
      apiRef.current.executeCommand('displayName', displayName);
    }
  }, [displayName]);

  const startCall = useCallback(async (roomId: string) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, status: 'connecting', roomId }));

      await setDoc(doc(db, 'calls', teamId), {
        roomId,
        active: true,
        createdBy: userId,
        createdAt: new Date()
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setState(prev => ({ ...prev, status: 'ended' }));
    }
  }, [teamId, userId]);

  const joinCall = useCallback(async (roomId: string) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, status: 'connecting', roomId }));

      const callDoc = await getDoc(doc(db, 'calls', teamId));
      if (!callDoc.exists() || !callDoc.data().active) {
        throw new Error('No active call found');
      }

    } catch (error) {
      console.error('Error joining call:', error);
      setState(prev => ({ ...prev, status: 'ended' }));
    }
  }, [teamId, userId]);

  const leaveCall = useCallback(async () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }

    try {
      if (userId) {
        await updateDoc(doc(db, 'calls', teamId), { active: false });
      }
    } catch (error) {
      console.error('Error updating call status:', error);
    }

    setState({
      status: 'idle',
      roomId: null,
      isAudioMuted: false,
      isVideoMuted: false
    });
  }, [teamId, userId]);

  const toggleAudio = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
    }
  }, []);

  return {
    ...state,
    startCall,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo
  };
};
