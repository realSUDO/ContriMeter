import { db } from "../firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: Date;
}

export const sendMessage = async (
  teamId: string,
  userId: string,
  userName: string,
  message: string,
  fileUrl?: string,
  fileName?: string,
  fileSize?: number
): Promise<void> => {
  const messagesRef = collection(db, "messages");
  
  const messageData: any = {
    teamId,
    userId,
    userName,
    message,
    createdAt: serverTimestamp()
  };

  // Only add file fields if they exist
  if (fileUrl) messageData.fileUrl = fileUrl;
  if (fileName) messageData.fileName = fileName;
  if (fileSize) messageData.fileSize = fileSize;

  await addDoc(messagesRef, messageData);
};

export const subscribeToTeamMessages = (
  teamId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("teamId", "==", teamId)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as ChatMessage));
    
    // Sort messages by createdAt on client side temporarily
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    callback(messages);
  });
};
