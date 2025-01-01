import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy 
} from 'firebase/firestore';

interface UseWebRTCProps {
  teamId: string;
  userId: string;
  userName: string;
}

export const useWebRTC = ({ teamId, userId, userName }: UseWebRTCProps) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const unsubscribeCallRef = useRef<(() => void) | null>(null);
  const unsubscribeCandidatesRef = useRef<(() => void) | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'openai',
        credential: 'openai'
      }
    ]
  };

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    console.log("remoteDescription?", !!pc.remoteDescription);

    if (!pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleRemoteCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.connectionState === "closed") return;

    if (!pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("ICE add failed:", e);
    }
  };

  const initializePeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(servers);
    
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && peerConnection.connectionState !== 'closed') {
        try {
          await addDoc(collection(db, `calls/${teamId}/candidates`), {
            senderId: userId,
            candidate: event.candidate.toJSON(),
            createdAt: new Date()
          });
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    peerConnection.ontrack = (event) => {
      if (peerConnection.connectionState !== 'closed' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
      setCallStatus('Connected');
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState !== 'closed') {
        setCallStatus(peerConnection.connectionState);
      }
    };

    return peerConnection;
  }, [teamId, userId]);

  const getUserMedia = async (videoEnabled = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const startCall = async (withVideo = true) => {
    try {
      setCallStatus('Starting call...');
      setIsInCall(true);
      setIsVideoEnabled(withVideo);

      // FIX 2: Wipe old signaling before starting new call
      const callDoc = doc(db, "calls", teamId);
      
      // Kill old session
      await deleteDoc(callDoc).catch(() => {});
      
      // Clear old candidates
      const oldCandidates = collection(db, `calls/${teamId}/candidates`);
      const snap = await getDocs(oldCandidates);
      snap.forEach(d => deleteDoc(d.ref));

      // Create new RTCPeerConnection
      const stream = await getUserMedia(withVideo);
      const peerConnection = initializePeerConnection();
      peerConnectionRef.current = peerConnection;

      // Add tracks
      stream.getTracks().forEach(track => {
        if (peerConnection.connectionState !== 'closed') {
          peerConnection.addTrack(track, stream);
        }
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      
      // FIX 4: Guard against closed peer
      if (!peerConnection || peerConnection.connectionState === "closed") return;
      await peerConnection.setLocalDescription(offer);

      // Save offer to Firestore
      await setDoc(callDoc, {
        offer: offer,
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date(),
        active: true,
        participants: [userId],
        hasVideo: withVideo
      });

      setCallStatus('Waiting for others to join...');
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('Failed to start call');
      setIsInCall(false);
    }
  };

  const joinCall = async (withVideo = true) => {
    try {
      setCallStatus('Joining call...');
      setIsInCall(true);
      setIsVideoEnabled(withVideo);

      // 1. Create new RTCPeerConnection
      const stream = await getUserMedia(withVideo);
      const peerConnection = initializePeerConnection();
      peerConnectionRef.current = peerConnection;

      // 2. Attach tracks
      stream.getTracks().forEach(track => {
        if (peerConnection.connectionState !== 'closed') {
          peerConnection.addTrack(track, stream);
        }
      });

      // 3. Subscribe to Firestore for offer/answer (ICE listener moved inside)
      const callDoc = doc(db, 'calls', teamId);
      const unsubscribeCall = onSnapshot(callDoc, async (snapshot) => {
        try {
          const data = snapshot.data();
          const pc = peerConnectionRef.current;
          
          if (!pc || pc.connectionState === 'closed') return;
          
          if (data?.offer && !pc.currentRemoteDescription) {
            // FIX 4: Guard against closed peer
            if (!pc || pc.connectionState === "closed") return;
            await pc.setRemoteDescription(data.offer);
            
            // FIX 1: Process pending ICE candidates after setting remote description
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
            
            if (pc.connectionState === 'closed') return;
            
            const answer = await pc.createAnswer();
            
            // FIX 4: Guard before setLocalDescription
            if (!pc || pc.connectionState === "closed") return;
            await pc.setLocalDescription(answer);
            
            if (pc.connectionState !== 'closed') {
              await updateDoc(callDoc, {
                answer: answer,
                participants: [...(data.participants || []), userId]
              }).catch(console.error);
            }

            // FIX 3: Move ICE listener AFTER offer/answer setup
            const candidatesRef = collection(db, `calls/${teamId}/candidates`);
            const candidatesQuery = query(candidatesRef, orderBy("createdAt"));

            unsubscribeCandidatesRef.current = onSnapshot(candidatesQuery, snap => {
              snap.docChanges().forEach(change => {
                if (change.type !== "added") return;

                const data = change.doc.data();
                if (data.senderId === userId) return;

                handleRemoteCandidate(data.candidate);
              });
            });
          }
          
          if (data?.answer && !pc.currentRemoteDescription && pc.connectionState !== 'closed') {
            // FIX 4: Guard before setRemoteDescription
            if (!pc || pc.connectionState === "closed") return;
            await pc.setRemoteDescription(data.answer);
            
            // FIX 1: Process pending ICE candidates after setting remote description
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
          }
        } catch (error) {
          console.error('Error in call onSnapshot:', error);
        }
      });
      unsubscribeCallRef.current = unsubscribeCall;

    } catch (error) {
      console.error('Error joining call:', error);
      setCallStatus('Failed to join call');
      setIsInCall(false);
    }
  };

  const leaveCall = async () => {
    // RULE 3: Kill listeners before closing peer
    if (unsubscribeCandidatesRef.current) {
      unsubscribeCandidatesRef.current();
      unsubscribeCandidatesRef.current = null;
    }
    
    if (unsubscribeCallRef.current) {
      unsubscribeCallRef.current();
      unsubscribeCallRef.current = null;
    }

    // Clear pending candidates
    pendingCandidatesRef.current = [];

    // Stop all senders and tracks
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach(sender => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset state immediately
    setIsInCall(false);
    setIsConnected(false);
    setCallStatus('');

    // Update Firestore (non-blocking)
    try {
      const callDoc = doc(db, 'calls', teamId);
      updateDoc(callDoc, { active: false }).catch(console.error);
    } catch (error) {
      console.error('Error updating Firestore on leave:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up everything on unmount
      if (unsubscribeCandidatesRef.current) {
        unsubscribeCandidatesRef.current();
        unsubscribeCandidatesRef.current = null;
      }
      
      if (unsubscribeCallRef.current) {
        unsubscribeCallRef.current();
        unsubscribeCallRef.current = null;
      }

      // Clear pending candidates
      pendingCandidatesRef.current = [];
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.getSenders().forEach(sender => {
          if (sender.track) sender.track.stop();
        });
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  return {
    isInCall,
    isConnected,
    isMuted,
    isVideoEnabled,
    callStatus,
    participants,
    localVideoRef,
    remoteVideoRef,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo
  };
};
