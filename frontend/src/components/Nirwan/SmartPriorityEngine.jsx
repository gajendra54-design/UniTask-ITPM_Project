import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Zap, TrendingUp, RefreshCw } from 'lucide-react';

// Sample data
const sampleAssignments = [
  { id: 1, name: 'SE Project', code: 'IT3030', icon: '✓', color: '#4CAF50', status: 'active' },
  { id: 2, name: 'Web Dev', code: 'IT2020', icon: '🌐', color: '#66BB6A', status: 'active' },
  { id: 3, name: 'Database', code: 'IT2015', icon: '📊', color: '#81C784', status: 'active' },
  { id: 4, name: 'AI Project', code: 'IT3040', icon: '🤖', color: '#A5D6A7', status: 'active' },
];

const sampleTasks = [
  { id: 1, name: 'Requirement Analysis', status: 'Completed', progress: 100, risk: 'none', importance: 9, workload: 5 },
  { id: 2, name: 'Database Design', status: 'In Progress', progress: 60, risk: 'high', importance: 8, workload: 7 },
  { id: 3, name: 'Backend Development', status: 'Pending', progress: 0, risk: 'none', importance: 8, workload: 9 },
  { id: 4, name: 'Frontend Development', status: 'Pending', progress: 0, risk: 'none', importance: 7, workload: 8 },
  { id: 5, name: 'Testing & QA', status: 'Pending', progress: 0, risk: 'high', importance: 9, workload: 6 },
];

const samplePriorityData = {
  priorityScore: 89,
  deadlineUrgency: 85,
  importanceLevel: 75,
  workloadSize: 70,
  lastUpdated: '2 hours ago',
};

const SmartPriorityEngine = ({
  assignments = sampleAssignments,
  selectedProjectId = 1,
  onSwitchProject = () => {},
  onRecalculate = () => {},
}) => {
  const [selectedProject, setSelectedProject] = useState(selectedProjectId);
  const [notification, setNotification] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [tasks] = useState(sampleTasks);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle project switch
  const handleSwitchProject = (projectId) => {
    setSelectedProject(projectId);
    onSwitchProject(projectId);
  };

  // Handle recalculate
  const handleRecalculate = () => {
    setIsRecalculating(true);
    setNotification({
      type: 'success',
      message: 'Priority recalculated successfully!',
    });
    onRecalculate();
    setTimeout(() => setIsRecalculating(false), 1500);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#E8F5E9', text: '#2E7D32', icon: '#4CAF50' };
      case 'In Progress':
        return { bg: '#FFF3E0', text: '#E65100', icon: '#FF9800' };
      case 'At Risk':
        return { bg: '#FFEBEE', text: '#B71C1C', icon: '#F44336' };
      default:
        return { bg: '#F3E5F5', text: '#6A1B9A', icon: '#9C27B0' };
    }
  };

  const selectedAssignment = assignments.find(a => a.id === selectedProject);
  const urgentTasks = tasks.filter(t => t.risk === 'high' || t.status === 'At Risk');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Sora:wght@400;500;600&display=swap');

        * {
          font-family: 'Sora', sans-serif;
        }

        .heading {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .pulse-animation {
          animation: pulse-smooth 3s ease-in-out infinite;
        }

        .pulse-fast {
          animation: pulse-smooth 2s ease-in-out infinite;
        }

        @keyframes pulse-smooth {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        .progress-fill {
          animation: fillProgress 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes fillProgress {
          from {
            width: 0%;
          }
          to {
            width: var(--progress-value);
          }
        }

        .slide-down {
          animation: slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .card-hover {
          transition: all 0.3s ease;
        }

        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(76, 175, 80, 0.12);
        }

        .conic-gauge {
          background: conic-gradient(
            from 0deg,
            #4CAF50 0deg,
            #8BC34A 120deg,
            #FFC107 240deg,
            #FF9800 300deg,
            #F44336 360deg
          );
          border-radius: 50%;
        }

        .task-item {
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }

        .task-item:hover {
          background-color: rgba(76, 175, 80, 0.05);
          border-left-color: #4CAF50;
        }

        .badge {
          animation: none;
        }

        .badge.pulse {
          animation: pulse-smooth 2s ease-in-out infinite;
        }
      `}</style>

      {/* Notification Banner */}
      {notification && (
        <div className={`slide-down fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-lg text-white z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Urgent Tasks Banner */}
      {urgentTasks.length > 0 && (
        <div className="slide-down mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-red-800 font-semibold">Urgent Tasks</h3>
              <p className="text-red-700 text-sm">You have {urgentTasks.length} task(s) at risk. Review deadlines immediately.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
            {/* Assignments Section */}
            <h2 className="heading text-lg text-gray-800 mb-4">Your Assignments</h2>
            <div className="space-y-2 mb-6">
              {assignments.map(assignment => (
                <button
                  key={assignment.id}
                  onClick={() => handleSwitchProject(assignment.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                    selectedProject === assignment.id
                      ? 'bg-green-100 border-l-4 border-green-500 text-green-900'
                      : 'bg-gray-50 border-l-4 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{assignment.icon}</span>
                    <div className="text-sm">
                      <div className="font-semibold">{assignment.name}</div>
                      <div className="text-xs opacity-75">{assignment.code}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Recalculate Button */}
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 text-white ${
                isRecalculating
                  ? 'bg-green-400 opacity-75'
                  : 'bg-green-500 hover:bg-green-600 active:scale-95'
              }`}
            >
              <RefreshCw size={18} className={isRecalculating ? 'animate-spin' : ''} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate Priority'}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
          {/* Task Breakdown Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
            <div className="mb-6">
              <h2 className="heading text-2xl text-gray-800">
                {selectedAssignment?.name} - Intelligent Priority Breakdown
              </h2>
              <p className="text-gray-500 text-sm mt-1">Last updated {samplePriorityData.lastUpdated}</p>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {tasks.map((task, index) => {
                const statusColor = getStatusColor(task.status);
                const riskHighlight = task.risk === 'high';

                return (
                  <div
                    key={task.id}
                    className="task-item bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-600 bg-green-100 w-8 h-8 rounded flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-800">{task.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {riskHighlight && task.status !== 'Completed' && (
                          <span className="badge pulse px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                            🔴 Due Soon
                          </span>
                        )}
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                      <div
                        className="progress-fill bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full"
                        style={{
                          '--progress-value': `${task.progress}%`,
                          width: `${task.progress}%`,
                        }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-600 mt-1">{task.progress}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT CARD - Priority Score */}
            <div className="card-hover bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
              <h3 className="heading text-lg text-gray-800 mb-6">Priority Score Visualization</h3>

              {/* Circular Gauge */}
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48">
                  <div className="conic-gauge absolute inset-0" />
                  <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                    <div className="pulse-animation">
                      <span className="heading text-5xl text-green-600">{samplePriorityData.priorityScore}</span>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold mt-2">Logically Ranked</span>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-5">
                {[
                  { label: 'Deadline Urgency', value: samplePriorityData.deadlineUrgency, gradient: 'from-yellow-400 to-orange-500' },
                  { label: 'Importance Level', value: samplePriorityData.importanceLevel, gradient: 'from-blue-400 to-blue-600' },
                  { label: 'Workload Size', value: samplePriorityData.workloadSize, gradient: 'from-purple-400 to-purple-600' },
                ].map((metric, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">{metric.label}</span>
                      <span className="text-sm font-bold text-gray-800">{metric.value}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                      <div
                        className={`progress-fill bg-gradient-to-r ${metric.gradient} h-full rounded-full`}
                        style={{
                          '--progress-value': `${metric.value}%`,
                          width: `${metric.value}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT CARD - Legend & Insights */}
            <div className="card-hover bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
              <h3 className="heading text-lg text-gray-800 mb-6">Priority Legend & AI Insights</h3>

              {/* Color Legend */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 text-sm mb-3">Priority Levels</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-600">High Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">Medium Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Low Priority</span>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-900 text-sm mb-2">💡 AI Insights</h4>
                <p className="text-sm text-green-800">
                  Focus on high-impact tasks first. Database Design requires immediate attention due to complexity and deadline urgency.
                </p>
              </div>

              {/* Impact Factors */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 text-sm mb-3">Impact Factors</h4>
                <div className="space-y-2">
                  {[
                    'Deadline Urgency',
                    'Importance Level',
                    'Workload Size',
                    'Current Progress',
                  ].map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPriorityEngine;
