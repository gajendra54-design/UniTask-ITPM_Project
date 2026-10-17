import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react';

// Sample data
const sampleProgressData = {
  overallProgress: 65,
  onTimeCompletion: 'On Schedule',
  consistencyScore: 'Low',
  behaviorInsights: [
    { pattern: 'Often starts tasks close to the deadline', severity: 'green' },
    { pattern: 'Procrastinates frequently', severity: 'orange' },
    { pattern: 'Inconsistent work patterns', severity: 'orange' },
  ],
  skillSuggestions: [
    { title: 'Improve Time Management', icon: 'clock', desc: 'Improve your scheduling' },
    { title: 'Develop Research Skills', icon: 'search', desc: 'Enhance your research techniques' },
    { title: 'Strengthen Technical Skills', icon: 'code', desc: 'Boost your coding abilities' },
  ],
};

const ProgressTracking = ({ data = sampleProgressData }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Animate progress on load
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 10;
      if (current >= data.overallProgress) {
        setAnimatedProgress(data.overallProgress);
        clearInterval(interval);
      } else {
        setAnimatedProgress(current);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [data.overallProgress]);

  const isOnTime = data.onTimeCompletion === 'On Schedule';
  const isConsistencyHigh = data.consistencyScore === 'High';

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'green':
        return { bg: '#E8F5E9', text: '#2E7D32', icon: '#4CAF50' };
      case 'orange':
        return { bg: '#FFF3E0', text: '#E65100', icon: '#FF9800' };
      case 'red':
        return { bg: '#FFEBEE', text: '#B71C1C', icon: '#F44336' };
      default:
        return { bg: '#F3E5F5', text: '#6A1B9A', icon: '#9C27B0' };
    }
  };

  

  const IconComponent = ({ name, size = 24 }) => {
    switch (name) {
      case 'clock':
        return <Clock size={size} />;
      case 'search':
        return <TrendingUp size={size} />;
      case 'code':
        return <Award size={size} />;
      default:
        return <Award size={size} />;
    }
  };

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

        .circular-progress {
          animation: drawCircle 1s ease-in-out forwards;
        }

        @keyframes drawCircle {
          from {
            stroke-dashoffset: 282.6;
          }
          to {
            stroke-dashoffset: var(--stroke-offset);
          }
        }

        .card-hover {
          transition: all 0.3s ease;
        }

        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(76, 175, 80, 0.12);
        }

        .metric-card {
          animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }

        .metric-card:nth-child(1) { animation-delay: 0.1s; }
        .metric-card:nth-child(2) { animation-delay: 0.2s; }
        .metric-card:nth-child(3) { animation-delay: 0.3s; }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .insight-card {
          animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }

        .insight-card:nth-child(1) { animation-delay: 0.4s; }
        .insight-card:nth-child(2) { animation-delay: 0.5s; }
        .insight-card:nth-child(3) { animation-delay: 0.6s; }

        .skill-card {
          animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }

        .skill-card:nth-child(1) { animation-delay: 0.7s; }
        .skill-card:nth-child(2) { animation-delay: 0.8s; }
        .skill-card:nth-child(3) { animation-delay: 0.9s; }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="heading text-3xl text-gray-800">Progress Tracking & Skills Analysis</h1>
        <p className="text-gray-600 mt-2">Track your progress and get insights into your academic performance</p>
      </div>

      {/* TOP SECTION - Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall Progress Card */}
        <div className="metric-card card-hover bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
          <div className="text-center">
            <h3 className="heading text-lg text-gray-800 mb-4">Overall Progress</h3>

            {/* Circular Progress */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="8"
                  strokeDasharray={`${282.6 * (animatedProgress / 100)} 282.6`}
                  strokeLinecap="round"
                  className="circular-progress transition-all duration-1000"
                  style={{
                    '--stroke-offset': `${282.6 * (1 - animatedProgress / 100)}`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="heading text-3xl text-green-600">{Math.round(animatedProgress)}%</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm">Tasks completed this week</p>
          </div>
        </div>

        {/* On-Time Completion Card */}
        <div className="metric-card card-hover bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
          <div className="text-center">
            <h3 className="heading text-lg text-gray-800 mb-4">On-Time Completion</h3>

            <div className="flex justify-center mb-4">
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                isOnTime ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Clock
                  size={48}
                  className={isOnTime ? 'text-green-600' : 'text-red-600'}
                />
              </div>
            </div>

            <div className={`heading text-lg ${isOnTime ? 'text-green-600' : 'text-red-600'}`}>
              {data.onTimeCompletion}
            </div>
            <p className="text-gray-600 text-sm mt-2">Task deadlines being met</p>
          </div>
        </div>

        {/* Consistency Score Card */}
        <div className="metric-card card-hover bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}>
          <div className="text-center">
            <h3 className="heading text-lg text-gray-800 mb-4">Consistency Score</h3>

            <div className="flex justify-center mb-4">
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                isConsistencyHigh ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <TrendingUp
                  size={48}
                  className={isConsistencyHigh ? 'text-green-600' : 'text-orange-600'}
                />
              </div>
            </div>

            <div className={`heading text-lg ${isConsistencyHigh ? 'text-green-600' : 'text-orange-600'}`}>
              {data.consistencyScore}
            </div>
            <p className="text-gray-600 text-sm mt-2">Work pattern consistency</p>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION - Behavior Insights */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="heading text-2xl text-gray-800">Behavior Insights</h2>
          <p className="text-gray-600 text-sm mt-1">Patterns detected in your work habits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.behaviorInsights.map((insight, idx) => {
            const colors = getSeverityColor(insight.severity);
            return (
              <div
                key={idx}
                className="insight-card card-hover rounded-2xl p-6 shadow-lg"
                style={{
                  backgroundColor: colors.bg,
                  boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg flex-shrink-0 mt-1"
                    style={{
                      backgroundColor: `${colors.icon}20`,
                    }}
                  >
                    {insight.severity === 'green' && (
                      <CheckCircle size={20} color={colors.icon} />
                    )}
                    {insight.severity === 'orange' && (
                      <AlertCircle size={20} color={colors.icon} />
                    )}
                    {insight.severity === 'red' && (
                      <AlertCircle size={20} color={colors.icon} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: colors.text }}
                    >
                      {insight.pattern}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION - Skill Improvement Suggestions */}
      <div>
        <div className="mb-6">
          <h2 className="heading text-2xl text-gray-800">Skill Improvement Suggestions</h2>
          <p className="text-gray-600 text-sm mt-1">Recommended areas to enhance your academic performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.skillSuggestions.map((skill, idx) => (
            <div
              key={idx}
              className="skill-card card-hover bg-white rounded-2xl p-6 shadow-lg text-center"
              style={{ boxShadow: '0 10px 40px rgba(76, 175, 80, 0.08)' }}
            >
              {/* Icon Background */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-green-100 mb-4">
                <IconComponent name={skill.icon} size={32} />
              </div>

              {/* Title */}
              <h3 className="heading text-lg text-gray-800 mb-2 lg:h-14 flex items-center justify-center">
                {skill.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{skill.desc}</p>

              {/* Action Button */}
              <button className="w-full py-2 px-4 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-all duration-300 active:scale-95">
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="heading text-2xl text-green-600">23</div>
          <p className="text-gray-600 text-xs mt-1">Tasks Completed</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="heading text-2xl text-orange-600">5</div>
          <p className="text-gray-600 text-xs mt-1">In Progress</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="heading text-2xl text-green-600">92%</div>
          <p className="text-gray-600 text-xs mt-1">Submission Rate</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-md">
          <div className="heading text-2xl text-green-600">8.5</div>
          <p className="text-gray-600 text-xs mt-1">Avg. Grade</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking;
