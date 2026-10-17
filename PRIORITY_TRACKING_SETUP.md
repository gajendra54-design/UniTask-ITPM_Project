# Priority Tracking Page - Frontend Implementation Guide

## Overview
The Priority Tracking page has been enhanced with comprehensive task management features including task breakdown, progress tracking, risk indicators, and detailed task views.

## Components Created

### 1. **RiskIndicator Component**
**File**: `src/components/PriorityTracking/RiskIndicator.jsx`

Shows the risk status of a task based on deadline proximity and completion status.

**States**:
- ✅ **Completed** - Task is done (green)
- ⏰ **On Track** - Task is progressing normally (blue)
- ⚠️ **At Risk** - Task is due within 7 days with critical priority (orange)
- 🔴 **Due Soon** - Task is due within 2 days (red)
- ❌ **Overdue** - Task deadline has passed (red with animation)

**Usage**:
```jsx
<RiskIndicator 
  daysRemaining={task.daysRemaining} 
  isCompleted={task.status === "Completed"}
  priorityBand={task.priorityBand}
/>
```

---

### 2. **ProgressTracker Component**
**File**: `src/components/PriorityTracking/ProgressTracker.jsx`

Displays progress of subtasks with completion percentage and status breakdown.

**Features**:
- Progress bar showing % completion
- Status summary (Completed, In Progress, Pending)
- Hour tracking (completed vs total)
- Subtask list with visual indicators
- Difficulty levels (Low, Medium, High)

**Usage**:
```jsx
<ProgressTracker 
  subtasks={task.subtasks} 
  totalEstimatedHours={task.totalEstimatedHours}
/>
```

---

### 3. **TaskBreakdownModal Component**
**File**: `src/components/PriorityTracking/TaskBreakdownModal.jsx`

Modal for breaking down big tasks into manageable subtasks.

**Features**:
- Add/remove subtasks dynamically
- Set estimated hours per subtask
- Set difficulty level (Low/Medium/High)
- Add descriptions for each subtask
- Automatic total hours calculation
- Save breakdown to database

**Workflow**:
1. User clicks "Breakdown" button on a task
2. Modal opens showing task details
3. User creates subtasks with descriptions and estimates
4. Total hours are calculated and displayed
5. User saves - breakdown is stored in database

**Usage**:
```jsx
<TaskBreakdownModal
  task={selectedTask}
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
/>
```

---

### 4. **TaskDetailsModal Component**
**File**: `src/components/PriorityTracking/TaskDetailsModal.jsx`

Comprehensive view of a task with all subtasks and progress tracking.

**Features**:
- Task overview cards (deadline, hours, priority score, status)
- Task description
- Progress bar showing completion %
- Expandable subtask list
- Toggle subtask completion status
- Risk indicator
- Difficulty and time estimates per subtask

**Usage**:
```jsx
<TaskDetailsModal
  task={selectedTask}
  isOpen={isOpen}
  onClose={handleClose}
  onUpdate={handleUpdate}
/>
```

---

## Updated PriorityTracking Page

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIORITY TRACKING PAGE                       │
├─────────────────────────────────────────────────┬───────────────┤
│                                                 │               │
│  LEFT SIDE (2/3 width)                         │ RIGHT SIDE    │
│  ├─ Title + Filter Dropdown                    │ (1/3 width)   │
│  ├─ Workload Warning (if any)                 │               │
│  ├─ Task List (Expandable Cards)              │ Stats Panel   │
│  │  ├─ Score Badge (colored)                  │ ├─ Avg Score  │
│  │  ├─ Task Title + Course                    │ └─ Task Count │
│  │  ├─ Due Date + Days Remaining              │               │
│  │  ├─ Est. Hours                             │ 7-Day         │
│  │  ├─ Priority Badge                         │ Workload Bar  │
│  │  ├─ Risk Status                            │ Chart         │
│  │  └─ Action Buttons                         │               │
│  │     ├─ "Breakdown" button                  │               │
│  │     └─ "Details" button                    │               │
│  └─ Bottom row shows all details when clicked │               │
│                                                 │               │
└─────────────────────────────────────────────────┴───────────────┘
```

### Enhanced Task Card Display

Each task card now shows:

1. **Top Section**:
   - Priority Score (colored badge: Red/Orange/Yellow/Green)
   - Task Title + Course
   - Due Date with days remaining
   - Estimated hours
   - Priority Band label

2. **Bottom Section** (expandable):
   - Risk Status indicator
   - "Breakdown" button - Break task into subtasks
   - "Details" button - View full task details

### Color Coding

- **Critical**: Red (Score ≥ 85)
- **High**: Orange (Score ≥ 65)
- **Medium**: Yellow (Score ≥ 45)
- **Low**: Green (Score < 45)

---

## Key Features & User Flows

### 1. View Task Priority List
- Tasks are automatically sorted by priority score
- Filter by priority band (All, Critical, High, Medium, Low)
- Visual indicators show completion and risk status

### 2. Break Down a Task
```
User clicks "Breakdown" button
  ↓
TaskBreakdownModal opens
  ↓
User adds subtasks with:
  - Title
  - Description
  - Estimated hours
  - Difficulty level
  ↓
User saves breakdown
  ↓
Breakdown is stored in database
  ↓
Subtasks are linked to parent task
```

### 3. Track Progress
```
User clicks "Details" button
  ↓
TaskDetailsModal opens showing:
  - All subtasks
  - Progress bar
  - Completion percentage
  - Individual subtask status
  ↓
User can:
  - Check off completed subtasks
  - See breakdown of hours
  - View difficulty levels
```

### 4. Risk Management
- Tasks due within 2 days show "Due Soon" status
- Tasks past deadline show "Overdue" status
- Tasks with critical priority within 7 days show "At Risk"
- Daily workload analysis shows overloaded days

---

## Backend Integration

### API Endpoints Used

1. **GET `/priority/sorted`**
   - Fetches all user assignments sorted by priority
   - Returns: Array of tasks with priority scores

2. **GET `/priority/workload-analysis`**
   - Analyzes workload by day
   - Returns: Daily breakdown of hours and critical tasks

3. **GET `/priority/:id`**
   - Fetches full task details with subtasks
   - Returns: Assignment and linked subtasks

4. **POST `/priority/save`**
   - Saves new assignment with breakdown
   - Payload: Task data + subtasks array

5. **PATCH `/subtask/:id`** (to be implemented)
   - Updates subtask status (Completed/In Progress/Pending)

---

## Data Structure

### Task Object
```javascript
{
  _id: String,
  title: String,
  course: String,
  deadline: Date,
  totalEstimatedHours: Number,
  realisticDays: Number,
  aiDescription: String,
  status: String,
  priorityScore: Number,        // 0-100
  priorityBand: String,         // Critical, High, Medium, Low
  urgencyScore: Number,         // 0-100
  importanceScore: Number,      // 0-100
  workloadScore: Number,        // 0-100
  daysRemaining: Number
}
```

### Subtask Object
```javascript
{
  _id: String,
  assignmentId: String,
  title: String,
  subDescription: String,
  estimatedHours: Number,
  difficultyLevel: String,      // Low, Medium, High
  completed: Boolean,
  status: String                 // Completed, In Progress, Pending
}
```

---

## Next Steps / Future Enhancements

1. **Subtask Status Updates**
   - Backend endpoint to update individual subtask status
   - Real-time progress tracking

2. **Notification System**
   - Email reminders for tasks due soon
   - Dashboard alerts for at-risk tasks
   - Browser notifications

3. **Analytics Dashboard**
   - Charts showing priority distribution
   - Productivity metrics
   - Time estimation vs actual time spent

4. **Task Recommendation Engine**
   - AI-based suggestions for breaking down tasks
   - Optimal scheduling recommendations

5. **Collaboration Features**
   - Assign subtasks to team members
   - Progress sharing
   - Comments and notes

---

## How to Use

### For Users:

1. **View your tasks** - Go to Priority Tracking page
2. **Understand urgency** - Check priority scores and risk indicators
3. **Break down complex tasks** - Click "Breakdown" to create subtasks
4. **Track progress** - Click "Details" to see subtask completion
5. **Manage workload** - Check 7-day workload chart to avoid overload

### For Developers:

1. **Import components**:
```jsx
import {
  RiskIndicator,
  ProgressTracker,
  TaskBreakdownModal,
  TaskDetailsModal
} from "../components/PriorityTracking";
```

2. **Use in your page**:
```jsx
const [task, setTask] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

<TaskBreakdownModal
  task={task}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSave={() => {
    setIsModalOpen(false);
    // Refresh data
  }}
/>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tasks not showing | Check API authentication, verify token in localStorage |
| Modal not opening | Ensure task object is properly passed |
| Progress not updating | Check if subtasks endpoint is configured |
| Styling issues | Verify Tailwind CSS is properly configured |

---

## File Structure
```
frontend/src/
├── components/
│   └── PriorityTracking/
│       ├── RiskIndicator.jsx
│       ├── ProgressTracker.jsx
│       ├── TaskBreakdownModal.jsx
│       ├── TaskDetailsModal.jsx
│       └── index.js
└── pages/
    └── PriorityTracking.jsx
```
