import React from 'react';
import { BookOpen, Zap, Code, MessageSquare, Clock } from 'lucide-react';

const SkillsImprovement = ({ skills }) => {
  const skillsList = [
    { key: 'timeManagement', label: 'Time Management', icon: Clock },
    { key: 'researchSkills', label: 'Research Skills', icon: BookOpen },
    { key: 'technicalSkills', label: 'Technical Skills', icon: Code },
    { key: 'communicationSkills', label: 'Communication Skills', icon: MessageSquare },
  ];

  const getSkillColor = (level) => {
    switch (level) {
      case 'Advanced':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'Beginner':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (level) => {
    switch (level) {
      case 'Advanced':
        return 'bg-green-500';
      case 'Intermediate':
        return 'bg-blue-500';
      case 'Beginner':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Skills Development</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skillsList.map((skill) => {
          const skillData = skills[skill.key] || { level: 'Beginner', score: 0 };
          const Icon = skill.icon;

          return (
            <div
              key={skill.key}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-800">{skill.label}</h4>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getSkillColor(skillData.level)}`}>
                  {skillData.level}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-gray-800">{skillData.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(
                      skillData.level
                    )}`}
                    style={{ width: `${skillData.score}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                {skillData.level === 'Advanced'
                  ? '⭐ Excellent proficiency!'
                  : skillData.level === 'Intermediate'
                  ? '📈 Good progress, keep improving!'
                  : '🌱 Focus on building this skill!'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillsImprovement;
