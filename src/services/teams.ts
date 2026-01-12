import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";

export interface Team {
  id: string;
  name: string;
  code: string;
  leader: string;
  members: string[];
  createdAt: any;
}

export const createTeam = async (teamName: string, leaderUid: string, teamCode: string): Promise<void> => {
  console.log("createTeam called with:", { teamName, leaderUid, teamCode });
  
  try {
    const teamRef = doc(db, "teams", teamCode);
    console.log("Team ref created:", teamRef.path);
    
    const teamData = {
      name: teamName,
      code: teamCode,
      leader: leaderUid,
      members: [leaderUid, "common"],
      createdAt: serverTimestamp()
    };
    console.log("Team data:", teamData);
    
    await setDoc(teamRef, teamData);
    console.log("Team document created successfully");
  } catch (error) {
    console.error("Error in createTeam:", error);
    throw error;
  }
};

export const joinTeam = async (teamCode: string, userUid: string): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }

  await updateDoc(teamRef, {
    members: arrayUnion(userUid)
  });
};

export const getUserTeams = async (userUid: string): Promise<Team[]> => {
  const teamsRef = collection(db, "teams");
  const q = query(teamsRef, where("members", "array-contains", userUid));
  const snap = await getDocs(q);
  
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  } as Team));
};

export const getTeamByCode = async (teamCode: string): Promise<Team | null> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    return null;
  }

  return {
    id: teamSnap.id,
    ...teamSnap.data()
  } as Team;
};

export const updateTeam = async (teamCode: string, updates: Partial<Team>): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  await updateDoc(teamRef, updates);
};

export const deleteTeam = async (teamCode: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Get team data to find all members
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    const members = teamData.members || [];
    
    // Remove team from all users' joinedTeams
    members.forEach((memberId: string) => {
      if (memberId !== "common") {
        const userRef = doc(db, "users", memberId);
        batch.update(userRef, {
          joinedTeams: arrayRemove(teamCode)
        });
      }
    });
  }
  
  // Delete team document
  batch.delete(teamRef);
  
  // Delete all contributions for this team
  const contributionsRef = collection(db, "contributions");
  const contributionsQuery = query(contributionsRef, where("teamId", "==", teamCode));
  const contributionsSnap = await getDocs(contributionsQuery);
  contributionsSnap.docs.forEach(doc => batch.delete(doc.ref));
  
  // Delete all tasks for this team
  const tasksRef = collection(db, "tasks");
  const tasksQuery = query(tasksRef, where("teamId", "==", teamCode));
  const tasksSnap = await getDocs(tasksQuery);
  tasksSnap.docs.forEach(doc => batch.delete(doc.ref));
  
  // Delete all messages for this team
  const messagesRef = collection(db, "messages");
  const messagesQuery = query(messagesRef, where("teamId", "==", teamCode));
  const messagesSnap = await getDocs(messagesQuery);
  messagesSnap.docs.forEach(doc => batch.delete(doc.ref));
  
  // Delete all sessions for this team
  const sessionsRef = collection(db, "sessions");
  const sessionsQuery = query(sessionsRef, where("teamId", "==", teamCode));
  const sessionsSnap = await getDocs(sessionsQuery);
  sessionsSnap.docs.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
};

export const leaveTeam = async (teamCode: string, userUid: string): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }

  const teamData = teamSnap.data();
  const updatedMembers = teamData.members.filter((id: string) => id !== userUid);
  
  // Update team members and user's joinedTeams
  const batch = writeBatch(db);
  
  batch.update(teamRef, {
    members: updatedMembers
  });
  
  const userRef = doc(db, "users", userUid);
  batch.update(userRef, {
    joinedTeams: arrayRemove(teamCode)
  });
  
  await batch.commit();
};

export const removeUserFromTeam = async (teamCode: string, userUid: string): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }

  const teamData = teamSnap.data();
  const updatedMembers = teamData.members.filter((id: string) => id !== userUid);
  
  // Update team members and user's joinedTeams
  const batch = writeBatch(db);
  
  batch.update(teamRef, {
    members: updatedMembers
  });
  
  // Check if user document exists before updating
  const userRef = doc(db, "users", userUid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    batch.update(userRef, {
      joinedTeams: arrayRemove(teamCode)
    });
  } else {
    console.warn(`User document ${userUid} does not exist, cannot remove team from joinedTeams`);
  }
  
  await batch.commit();
};
