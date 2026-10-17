import React from 'react';
import { Lightbulb, AlertCircle, Info, CheckCircle } from 'lucide-react';

const AISuggestions = ({ suggestions = [] }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
      case 'Medium':
        return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
      case 'Low':
        return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'Medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'Low':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">AI-Powered Suggestions</h3>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">{getPriorityIcon(suggestion.priority)}</div>
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-gray-800">{suggestion.title}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        suggestion.priority === 'High'
                          ? 'bg-red-200 text-red-800'
                          : suggestion.priority === 'Medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{suggestion.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 font-semibold">
            Great job! No improvement suggestions at this time.
          </p>
          <p className="text-sm text-green-700 mt-1">Keep up your excellent work!</p>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
