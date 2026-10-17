import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardOverview from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import Calendar from "./pages/Calendar";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import JoinGroup from "./pages/JoinGroup";
import Profile from "./pages/Profile";
import PriorityDashboard from "./pages/SmartPriority";
import Analytics from "./pages/Analytics";

import Assignments from "./pages/assignments/Assignments";
import AssignmentDetails from "./pages/assignments/AssignmentDetails";
import EditAssignment from "./pages/assignments/EditAssignment";

import StudyMaterialsList from "./pages/StudyMaterials/StudyMaterialsList";
import FlashcardView from "./pages/StudyMaterials/FlashcardView";
import SharedFlashcardView from "./pages/StudyMaterials/SharedFlashcardView";

function App() {
  const { user, loading } = useAuth();

  if (loading) return null; // or spinner

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/signup"
          element={!user ? <Register /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/reset-password/:token"
          element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />}
        />

        {/* Protected */}
        <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/assignments/:id" element={<AssignmentDetails />} />
          <Route path="/assignments/edit/:id" element={<EditAssignment />} />

          <Route path="/calendar" element={<Calendar />} />
          <Route path="/smart-priority" element={<PriorityDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/study-materials" element={<StudyMaterialsList />} />
          <Route path="/study-materials/:id" element={<FlashcardView />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Guest Join Flow */}
        <Route path="/join/:code" element={<JoinGroup />} />

        {/* Public Shared Flashcards (QR Code) */}
        <Route path="/shared/flashcards/:id" element={<SharedFlashcardView />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
