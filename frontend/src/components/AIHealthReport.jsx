// FILE: frontend/src/components/AIHealthReport.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { 
  Sparkles, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckSquare,
  Activity,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';

const AIHealthReport = ({ groupId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const messages = [
    "Analyzing task completion rates...",
    "Checking contribution balance...",
    "Identifying overdue risks...",
    "Generating recommendations..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      let i = 0;
      setLoadingMessage(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/groups/ai/health/${groupId}`);
      if (res.data.success) {
        setData(res.data.data);
        toast.success('AI Health Report generated!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (rate) => {
    if (rate > 60) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const parseReport = (text) => {
    if (!text) return null;
    const sections = text.split(/\d\.\s+/);
    return {
      status: sections[1]?.trim() || "",
      warnings: sections[2]?.trim() || "",
      strengths: sections[3]?.trim() || "",
      recommendations: sections[4]?.trim() || ""
    };
  };

  const report = data ? parseReport(data.report) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            🏥 AI Group Health Report
          </h3>
          <p className="text-sm text-slate-500">AI-powered analysis of your group's progress and collaboration</p>
        </div>
        <Button 
          onClick={generateReport} 
          disabled={loading}
          className="bg-[rgb(85,74,228)] hover:bg-[rgb(75,64,218)] text-white rounded-xl px-6 py-2 transition-all flex items-center gap-2"
        >
          {loading ? <Activity size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {data ? 'Regenerate Report' : 'Generate Report'}
        </Button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-green-100 border-t-green-600 animate-spin"></div>
              <Bot className="absolute inset-0 m-auto text-green-600" size={32} />
            </div>
            <p className="text-lg font-medium text-slate-700 animate-pulse">{loadingMessage}</p>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* STATS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <CheckSquare size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-900">{data.stats.totalTasks}</p>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Tasks</p>
              </div>

              <div className={`border p-4 rounded-2xl ${getCompletionColor(data.stats.completionRate)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-white/40 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{data.stats.completionRate}%</p>
                <p className="text-xs font-medium uppercase tracking-wider">Completion Rate</p>
              </div>

              <div className={`p-4 rounded-2xl border ${data.stats.overdueCount > 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-white/40 rounded-lg">
                    <Clock size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{data.stats.overdueCount}</p>
                <p className="text-xs font-medium uppercase tracking-wider">Overdue Tasks</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-indigo-600">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Users size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-indigo-900">{data.stats.activeMembers} / {data.stats.totalMembers}</p>
                <p className="text-xs font-medium uppercase tracking-wider">Active Members</p>
              </div>
            </div>

            {/* AI REPORT COMPONENT */}
            {report && (
              <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
                <div className="bg-green-50/50 p-4 border-b border-green-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700">
                    <Bot size={20} />
                    <span className="font-bold">AI Analysis Summary</span>
                  </div>
                  <div className="flex gap-2">
                    {data.report.includes("ON TRACK") && <Badge className="bg-green-100 text-green-700 border-green-200 uppercase font-black px-3 py-1">On Track</Badge>}
                    {data.report.includes("AT RISK") && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 uppercase font-black px-3 py-1">At Risk</Badge>}
                    {data.report.includes("CRITICAL") && <Badge className="bg-red-100 text-red-700 border-red-200 uppercase font-black px-3 py-1">Critical</Badge>}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* OVERALL STATUS BANNER */}
                  <div className={`p-4 rounded-xl border ${
                    data.report.includes("ON TRACK") ? "bg-green-50 border-green-200 text-green-800" :
                    data.report.includes("AT RISK") ? "bg-yellow-50 border-yellow-300 text-yellow-800" :
                    "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    <p className="font-bold text-sm uppercase tracking-wider mb-1">1. Overall Status</p>
                    <p className="text-sm">{report.status}</p>
                  </div>

                  {/* SECTIONS */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-red-400 pl-4 py-1">
                      <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} /> 2. Key Warnings
                      </h4>
                      <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {report.warnings || "No major issues detected."}
                      </div>
                    </div>

                    <div className="border-l-4 border-green-400 pl-4 py-1">
                      <h4 className="text-xs font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <TrendingUp size={14} /> 3. Strengths
                      </h4>
                      <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {report.strengths || "Data shows consistent contribution patterns."}
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50/30 rounded-r-xl">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Sparkles size={14} /> 4. Recommendations
                    </h4>
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                      {report.recommendations}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MEMBER TABLE */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowMembers(!showMembers)}
                className="w-full p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <span className="font-bold text-slate-700 flex items-center gap-2">
                  <Users size={18} /> Member Contribution Breakdown
                </span>
                {showMembers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {showMembers && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-100 bg-white">
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Activities</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {data.stats.memberScores.sort((a, b) => b.score - a.score).map((m, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-800">{m.name}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{m.score}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm text-slate-600">{m.activityCount}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {m.score > 0 ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border-red-200">No Contribution</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <Bot size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium text-center max-w-xs">
              No report generated yet. Click the button above to analyze group progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHealthReport;
