# Contrimeter - Team Productivity Tracker

## Project Overview
A real-time team productivity application built with React, TypeScript, and Firebase. Teams can create tasks, track time, and monitor contributions in real-time.

## Core Features
- **Team Management**: Create/join teams with unique codes, manage members
- **Task Management**: Create, assign, and track task completion
- **Timer System**: Individual task timers with simultaneous tracking
- **Real-time Contributions**: Live dashboard showing tasks completed and time spent
- **Session History**: Persistent timer history (latest 20 sessions per team)
- **Authentication**: Firebase Auth with email/password and social login

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase (Firestore, Auth)
- **State Management**: React hooks, real-time subscriptions
- **Routing**: React Router DOM

## Architecture

### Firebase Collections
```
users/
├── {userId}/
    ├── name: string
    ├── email: string
    ├── role: string
    ├── teams: string[]
    └── createdAt: timestamp

teams/
├── {teamCode}/
    ├── name: string
    ├── code: string (unique)
    ├── leader: string (userId)
    ├── members: string[] (userIds)
    └── createdAt: timestamp

tasks/
├── {taskId}/
    ├── teamId: string
    ├── name: string
    ├── assignee: string (userId)
    ├── status: "pending" | "done"
    ├── timeSpent: number (minutes)
    ├── isActive: boolean (timer running)
    ├── manuallyMarkedAtRisk: boolean
    ├── lastActivity: timestamp
    └── createdAt: timestamp

contributions/
├── {contributionId}/
    ├── teamId: string
    ├── userId: string
    ├── tasksCompleted: number
    ├── totalTimeSpent: number (minutes)
    ├── lastActive: timestamp
    └── createdAt: timestamp

sessions/
├── {sessionId}/
    ├── teamId: string
    ├── userId: string
    ├── taskName: string
    ├── duration: number (minutes)
    └── createdAt: timestamp
```

### Key Components
- **AuthPage**: Login/signup with Firebase Auth
- **ProfileSetup**: New user onboarding (name/role collection)
- **Dashboard**: Team overview, create/join teams
- **TeamWorkspace**: Main workspace with tasks, timer, contributions
- **TaskSection**: Task CRUD, filtering, assignment
- **TimerSection**: Individual task timers, session management
- **ContributionSection**: Real-time team member contributions

### Real-time Hooks
- **useAuth**: Authentication state management
- **useUserTeams**: Real-time user's teams subscription
- **useTeamTasks**: Real-time team tasks subscription
- **useTeamMemberProfiles**: Fetch team member profiles
- **useTeamContributions**: Real-time contributions subscription

### Services
- **auth.ts**: Firebase authentication functions
- **users.ts**: User profile management
- **teams.ts**: Team CRUD operations
- **tasks.ts**: Task management
- **contributions.ts**: Contribution tracking (increment/decrement)
- **sessions.ts**: Timer session persistence

## Key Business Logic

### Timer System
- Only task assignees can start timers for their tasks
- Multiple timers can run simultaneously for different tasks
- Timer automatically stops when task is marked complete
- Time is saved to both task.timeSpent and session history

### Contribution Tracking
- Bidirectional: increment on task completion, decrement on unmarking
- Real-time updates using Firestore onSnapshot
- Tracks both tasks completed and total time spent
- Updates user's lastActive timestamp

### Task Assignment
- Tasks can only be assigned to team members
- Timer restrictions prevent unauthorized usage
- Status changes update contributions automatically

### Security Rules
```javascript
// Firestore rules allow authenticated read/write access
match /databases/{database}/documents {
  match /{document=**} {
    allow read, write: if request.auth != null;
  }
}
```

## Development Setup
```bash
npm install
npm run dev
```

### Firebase Configuration
- Project uses Firebase SDK v9+ modular approach
- Firestore indexes required for complex queries (teamId + createdAt)
- Deploy rules: `firebase deploy --only firestore:rules`
- Deploy indexes: `firebase deploy --only firestore:indexes`

## Critical Implementation Details

### Real-time Updates
- Use `onSnapshot` for live data, not polling
- Contributions update instantly when tasks are completed
- All team data syncs in real-time across users

### Timer Stopping Logic
- When task status changes, `isActive` flag is set to `false`
- TimerSection monitors `selectedTask.isActive` to stop timers
- No complex callback chains - simple flag-based approach

### Performance Optimizations
- Real-time subscriptions with automatic cleanup
- Skeleton loading states during data fetch
- Firestore composite indexes for efficient queries
- Session history limited to 20 entries per team

### Error Handling
- Graceful fallbacks for offline Firestore
- User-friendly error messages for auth failures
- Console logging for debugging Firestore operations

## Known Issues & Solutions
- **CSS Import Order**: @import must come before @tailwind directives
- **Firestore Offline**: Show UI even when Firestore is offline
- **Timer Sync**: Use isActive flag instead of complex callbacks
- **Real-time Lag**: Use onSnapshot instead of polling for instant updates

## Future Enhancements
- Team chat functionality
- Advanced task filtering and sorting
- Detailed analytics and reporting
- Mobile responsive improvements
- Notification system for task assignments
