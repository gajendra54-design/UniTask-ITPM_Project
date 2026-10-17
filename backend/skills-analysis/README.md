# Skills Analysis Dashboard

A comprehensive skills analysis and performance tracking dashboard for students that provides detailed insights into their academic performance, behavior patterns, and skill development.

## Features

### 1. **Overall Progress Tracking**
- Circular progress indicator showing completion percentage
- Real-time calculation based on completed tasks
- Visual representation of task completion rate

### 2. **Consistency Analysis**
- Consistency level classification (Low, Medium, High)
- Consistency score calculation based on weekly patterns
- Standard deviation analysis for consistent performance tracking

### 3. **On-Time Completion Status**
- Track on-time vs late submissions
- Percentage breakdown of submission patterns
- Historical tracking of submission behavior

### 4. **Procrastination Behavior Analysis**
- Procrastination level classification (Low, Medium, High)
- Average days late calculation
- Behavioral insights and recommendations

### 5. **Skills Improvement Tracking**
- Time Management
- Research Skills
- Technical Skills
- Communication Skills

Each skill has:
- Proficiency level (Beginner, Intermediate, Advanced)
- Progress score (0-100%)
- Visual progress indicators

### 6. **AI-Based Suggestions**
The system generates intelligent suggestions based on:
- Procrastination behavior
- Consistency patterns
- On-time completion rates
- Skill deficiencies

Suggestions are prioritized as:
- **High**: Critical areas needing immediate attention
- **Medium**: Areas for improvement
- **Low**: Areas performing well, with encouragement

### 7. **Visual Analytics**
- **Line Chart**: Shows progress trends over weeks/months
- **Radar Chart**: Displays skills overview in polar coordinates
- **Progress Indicators**: Visual skill level representations

## Backend API Endpoints

All endpoints require authentication via Bearer token in Authorization header.

### Base URL
```
http://localhost:5000/api/skills-analysis
```

### Endpoints

1. **GET /analysis**
   - Returns complete skills analysis for the user
   - Includes all metrics and historical data

2. **GET /dashboard**
   - Returns formatted dashboard data
   - Optimized for frontend display

3. **GET /suggestions**
   - Returns AI-generated suggestions
   - Can be paginated or filtered

4. **GET /progress-chart**
   - Query params: `period` (weekly or monthly)
   - Returns data formatted for chart.js Line chart

5. **GET /skills-breakdown**
   - Returns skills data formatted for Radar chart

## Frontend Components

### CircularProgress
- Displays overall progress as a circular progress bar
- Color-coded based on performance level
- Props: `percentage`, `title`, `subtitle`

### ConsistencyCard
- Shows consistency level and score
- Color-coded badges (High/Medium/Low)
- Provides feedback and encouragement

### BehaviorAnalysis
- Displays procrastination behavior
- Shows on-time vs late submission statistics
- Includes average days late metric

### SkillsImprovement
- Grid display of all skills
- Shows proficiency level and progress
- Individual progress bars for each skill

### AISuggestions
- Displays AI-generated improvement suggestions
- Priority-based color coding
- Actionable recommendations

### ProgressChart
- Line chart showing task completion trends
- Week-by-week or month-by-month view
- Multiple datasets (tasks completed, on-time, late)

### SkillsRadarChart
- Radar/polar chart showing skills overview
- Visual comparison of all 4 skills
- Interactive tooltip with percentages

## Data Models

### SkillsAnalysis Schema
```javascript
{
  userId: ObjectId,
  overallProgress: Number (0-100),
  tasksCompleted: Number,
  totalTasks: Number,
  onTimeCompletion: {
    count: Number,
    percentage: Number
  },
  lateSubmissions: {
    count: Number,
    percentage: Number
  },
  consistencyLevel: String (Low|Medium|High),
  consistencyScore: Number (0-100),
  procrastinationBehavior: String (High|Medium|Low),
  avgDaysLate: Number,
  skillsImprovement: {
    timeManagement: { level, score },
    researchSkills: { level, score },
    technicalSkills: { level, score },
    communicationSkills: { level, score }
  },
  aiSuggestions: Array,
  weeklyProgressData: Array,
  monthlyProgressData: Array
}
```

## How It Works

1. **Data Collection**
   - System analyzes all assignments for the user
   - Calculates completion dates vs due dates
   - Tracks submission patterns

2. **Analysis Algorithms**
   - **Consistency**: Uses statistical variance of weekly completion rates
   - **Procrastination**: Percentage-based with threshold levels
   - **Skills**: Derived from task patterns and behavior

3. **AI Suggestions**
   - Rule-based logic based on analyzed metrics
   - Prioritization based on impact and urgency
   - Personalized recommendations

4. **Real-time Updates**
   - Data is regenerated on each dashboard request
   - Reflects latest assignment data
   - No client-side caching of stale data

## Usage

### Access the Dashboard
Navigate to `/skills-analysis` in the application after logging in.

### View Detailed Metrics
- Overall progress overview
- Consistency analysis
- Behavior breakdown
- Skills development
- AI suggestions
- Trend charts

### Monitor Progress
- Weekly/Monthly trend analysis
- Skill improvement tracking
- Behavioral pattern recognition
- Goal-based recommendations

## Installation

1. **Backend Setup**
   - Model is auto-imported from `models/SkillsAnalysisModel.js`
   - Routes are mounted on `/api/skills-analysis`
   - Controllers handle all business logic

2. **Frontend Setup**
   - Install Chart.js and react-chartjs-2: `npm install chart.js react-chartjs-2`
   - Components are available in `components/SkillsAnalysis/`
   - Dashboard page at `pages/SkillsAnalysisDashboard.jsx`

3. **Integration**
   - Route is added to DashboardLayout navigation
   - Authentication middleware protects all endpoints
   - Real-time data fetching via service layer

## Future Enhancements

- [ ] Peer comparison analytics
- [ ] Personalized study recommendations
- [ ] Goal setting and tracking
- [ ] Predictive analytics for future performance
- [ ] Export reports as PDF
- [ ] Email notifications for skill milestones
- [ ] Integration with learning management systems
- [ ] Machine learning-based predictions

## Dependencies

- **Backend**
  - Express.js
  - Mongoose
  - dotenv

- **Frontend**
  - React
  - Chart.js
  - react-chartjs-2
  - Lucide React (icons)
  - Tailwind CSS
  - Axios

## Notes

- All times are in the timezone specified by the server
- Consistency calculation requires at least 2 weeks of data for accuracy
- Procrastination analysis is more reliable with more historical data
- AI suggestions are updated on each dashboard load
- Empty data is gracefully handled with sample messaging
