import React from 'react';
import './CircularProgress.css';

const CircularProgress = ({ percentage, title, subtitle }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return '#10b981'; // green
    if (percentage >= 60) return '#3b82f6'; // blue
    if (percentage >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="circular-progress-container">
      <div className="circular-progress-wrapper">
        <svg width="200" height="200" className="circular-progress-svg">
          <circle
            cx="100"
            cy="100"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-circle"
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
              transform: 'rotate(-90deg)',
              transformOrigin: '100px 100px',
            }}
          />
        </svg>
        <div className="circular-progress-text">
          <span className="progress-percentage">{percentage}%</span>
          <span className="progress-label">Complete</span>
        </div>
      </div>
      {title && <h3 className="progress-title">{title}</h3>}
      {subtitle && <p className="progress-subtitle">{subtitle}</p>}
    </div>
  );
};

export default CircularProgress;
