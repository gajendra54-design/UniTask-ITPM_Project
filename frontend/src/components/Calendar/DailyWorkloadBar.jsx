import React from 'react';

const DailyWorkloadBar = ({ totalHours = 0 }) => {
  const maxHours = 8;
  const percentage = Math.min((totalHours / maxHours) * 100, 100);

  const getBarColor = () => {
    if (totalHours < 4) return 'bg-green-500';
    if (totalHours < 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full mt-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-gray-600">{totalHours}h / {maxHours}h</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default DailyWorkloadBar;
