import React from 'react';
import { Award, Zap, TrendingUp } from 'lucide-react';

const ConsistencyCard = ({ level, score }) => {
  const getConsistencyColor = () => {
    switch (level) {
      case 'High':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'Medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'Low':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getIconColor = () => {
    switch (level) {
      case 'High':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeColor = () => {
    switch (level) {
      case 'High':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getConsistencyColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Award className={`w-8 h-8 ${getIconColor()}`} />
          <h3 className="text-lg font-semibold">Consistency Level</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor()}`}>
          {level}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-75">Consistency Score</span>
            <span className="text-2xl font-bold">{score}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 opacity-30">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                level === 'High'
                  ? 'bg-green-600'
                  : level === 'Medium'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>

        <p className="text-sm opacity-75 mt-4">
          {level === 'High'
            ? '🎉 Excellent! You maintain a very consistent work schedule.'
            : level === 'Medium'
            ? '⚡ Good effort! Try to maintain consistency throughout the week.'
            : '⚠️ Build a more consistent routine to improve your performance.'}
        </p>
      </div>
    </div>
  );
};

export default ConsistencyCard;
