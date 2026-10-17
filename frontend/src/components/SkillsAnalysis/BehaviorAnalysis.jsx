import React from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

const BehaviorAnalysis = ({ procrastination, avgDaysLate, onTimeCompletion, lateSubmissions }) => {
  const getProcrastinationColor = () => {
    switch (procrastination) {
      case 'High':
        return 'bg-red-50 border-red-200';
      case 'Medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getProcrastinationIcon = () => {
    switch (procrastination) {
      case 'High':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'Medium':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'Low':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-6 rounded-lg border-2 ${getProcrastinationColor()}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{getProcrastinationIcon()}</div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold mb-2">Procrastination Behavior</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Procrastination Level</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    procrastination === 'High'
                      ? 'bg-red-200 text-red-800'
                      : procrastination === 'Medium'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-green-200 text-green-800'
                  }`}
                >
                  {procrastination}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Average Days Late</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{avgDaysLate}</span>
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mt-3">
                {procrastination === 'High'
                  ? '⚠️ You frequently delay tasks. Try breaking work into smaller subtasks and setting daily goals.'
                  : procrastination === 'Medium'
                  ? '📌 You have occasional delays. Implement a planning system to reduce procrastination.'
                  : '✅ Excellent! You submit most tasks on time. Keep this momentum!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">On-Time</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-700">{onTimeCompletion.count}</div>
            <div className="text-sm text-green-600">{onTimeCompletion.percentage}% submission</div>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-semibold text-gray-700">Late</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-700">{lateSubmissions.count}</div>
            <div className="text-sm text-red-600">{lateSubmissions.percentage}% submission</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorAnalysis;
