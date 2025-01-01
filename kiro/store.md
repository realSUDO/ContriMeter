this is the natural next step. Moving **teams from hardcoded arrays → Firestore** will make everything dynamic, multi-user, and hackathon-ready.

Let’s do it **systematically**.

---

# 🔹 1️⃣ Firestore Structure

We need collections and documents that reflect your app’s logic.

### Suggested schema

**Collection: `teams`**
Document ID = auto-generated OR team code (short string)

```json
{
  "name": "Team Rocket",
  "code": "TR123",
  "leader": "uid_abc123",   // Firebase user ID
  "members": ["uid_abc123", "uid_def456"], 
  "createdAt": timestamp
}
```

**Collection: `tasks`**
Document ID = auto-generated

```json
{
  "teamId": "TR123",
  "title": "Design UI",
  "assignedTo": "uid_def456",
  "status": "active",          // active | atRisk | inactive
  "timeSpent": 0,              // in minutes
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

**Collection: `users`** (optional but recommended)

```json
{
  "uid": "uid_abc123",
  "name": "Sumit Vishwkarma",
  "email": "sumit@example.com",
  "joinedTeams": ["TR123"]
}
```

---

# 🔹 2️⃣ Firestore Setup

**1. Enable Firestore in Firebase Console**

* Go to Firestore → Create database → Production mode → Choose location

**2. Install Firebase Firestore SDK**

```bash
npm install firebase
```

(You already have it if you did Auth)

**3. Extend `firebase.ts`**

```ts
import { getFirestore } from "firebase/firestore";

export const db = getFirestore(app);
```

---

# 🔹 3️⃣ Functions to interact with teams

**`services/teams.ts`**

```ts
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
  arrayUnion
} from "firebase/firestore";

// Create team
export const createTeam = async (teamName: string, leaderUid: string, teamCode: string) => {
  const teamRef = doc(db, "teams", teamCode);
  await setDoc(teamRef, {
    name: teamName,
    code: teamCode,
    leader: leaderUid,
    members: [leaderUid],
    createdAt: new Date()
  });
};

// Join team
export const joinTeam = async (teamCode: string, userUid: string) => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team does not exist");

  await updateDoc(teamRef, {
    members: arrayUnion(userUid)
  });
};

// Fetch user teams
export const getUserTeams = async (userUid: string) => {
  const teamsRef = collection(db, "teams");
  const q = query(teamsRef, where("members", "array-contains", userUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
};
```

---

# 🔹 4️⃣ Update Dashboard

* Replace **hardcoded teams array** with `getUserTeams(user.uid)`
* Display list of teams dynamically
* Clicking a team → load team workspace

---

# 🔹 5️⃣ Team Workspace

* Use `teamId` from Firestore to fetch **tasks** for that team

* Each task document:

  * `assignedTo` → can display assignee name
  * `status` → active/atRisk/inactive
  * `timeSpent` → circle progress bar

* Any updates → Firestore `updateDoc`, `arrayUnion`, `arrayRemove`

---

# 🔹 6️⃣ Real-time updates (optional but sexy)

```ts
import { onSnapshot, query, where, collection } from "firebase/firestore";

const q = query(collection(db, "tasks"), where("teamId", "==", teamCode));

onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  setTasks(tasks);
});
```

* This makes your team workspace **live**, like Google Docs, for all members.

---

# 🔹 NEXT STEPS

1. Replace hardcoded teams → Firestore CRUD
2. Replace hardcoded tasks → Firestore CRUD
3. Add **leader vs member** logic (delete team, remove member)
4. Update **task status badges** dynamically (`active`, `atRisk`, `inactive`)
5. Update **user last activity** dynamically

---


