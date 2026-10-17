// FILE: frontend/src/components/AITaskDistributor.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { 
  Sparkles, 
  Bot, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  RefreshCw,
  User,
  Layout,
  Briefcase,
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const AITaskDistributor = ({ groupId, onTaskCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stage, setStage] = useState('input'); // 'input' or 'results'
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Results State
  const [results, setResults] = useState(null);
  const [createdTasks, setCreatedTasks] = useState(new Set());
  const [creatingAll, setCreatingAll] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axiosInstance.get(`/groups/${groupId}`);
        const groupData = res.data.data;
        const member = groupData.members?.find(m => {
          const mId = (m.user?._id || m.user || '').toString();
          const uId = (user?._id || user?.id || '').toString();
          return mId === uId;
        });
        setIsAdmin(member?.role === 'admin' || groupData.createdBy === user?.id);
      } catch (err) {
        console.error("Admin check failed:", err);
      }
    };
    if (user && groupId) checkAdmin();
  }, [user, groupId]);

  

  

  

  const generateDistribution = async () => {
    if (!title || !description) {
      toast.error('Please fill in both the Title and Description');
      return;
    }
    if (description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    try {
      const res = await axiosInstance.post(`/groups/ai/distribute/${groupId}`, {
        assignmentTitle: title,
        assignmentDescription: description
      });
      if (res.data.success) {
        setResults(res.data.data);
        setStage('results');
        toast.success('Project breakdown generated!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate distribution');
    } finally {
      setLoading(false);
    }
  };

  const createIndividualTask = async (taskData, index) => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await axiosInstance.post(`/groups/${groupId}/tasks`, {
        title: taskData.taskTitle,
        assignedTo: taskData.userId,
        description: taskData.taskDescription,
        priority: 'Medium',
        status: 'To-Do',
        dueDate: nextWeek,
        subtasks: taskData.checklist?.map(item => ({ title: item, completed: false })) || []
      });
      setCreatedTasks(prev => new Set([...prev, index]));
      toast.success(`Task created for ${taskData.memberName}`);
      if (onTaskCreated) onTaskCreated();
      return true;
    } catch (err) {
      console.error('Task Creation Error:', err.response?.data || err.message);
      toast.error(`Failed to create task for ${taskData.memberName}`);
      return false;
    }
  };

  const createAllTasks = async () => {
    setCreatingAll(true);
    setProgress(0);
    const pending = results.assignments.filter((_, i) => !createdTasks.has(i));
    let successCount = 0;
    
    for (let i = 0; i < pending.length; i++) {
      const taskIndex = results.assignments.indexOf(pending[i]);
      const success = await createIndividualTask(pending[i], taskIndex);
      if (success) successCount++;
      setProgress(i + 1);
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setCreatingAll(false);
    if (successCount === pending.length) {
      toast.success('All tasks created successfully!');
    } else {
      toast.error(`Created ${successCount} of ${pending.length} tasks.`);
    }
    if (onTaskCreated) onTaskCreated();
  };

  if (!isAdmin && stage === 'input') {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Admin Only Feature</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Only group administrators can use the AI Task Distributor to assign work to members.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
      {stage === 'input' ? (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🎯 AI Task Distributor
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Describe your project and AI will assign subtasks to the best-suited members based on their past contributions.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Assignment / Project Title</Label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineering Group Project"
                className="rounded-xl border-gray-200 focus:ring-green-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-slate-700 font-bold">Describe assignment requirements</Label>
                <span className={`text-[10px] font-bold ${description.length < 20 ? 'text-red-400' : 'text-green-500'}`}>
                  {description.length} / 20 chars min
                </span>
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. This project requires implementing a full-stack e-commerce site with React... etc."
              />
            </div>

            <Button 
              onClick={generateDistribution}
              disabled={loading || title === '' || description.length < 20}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-2xl font-bold shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
              Generate Automated Project Breakdown
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 animate-in fade-in duration-300">
          <button 
            onClick={() => setStage('input')}
            className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Try Again / Change Inputs
          </button>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                <Bot size={24} />
              </div>
              <div>
                <p className="text-sm text-blue-900 leading-relaxed italic">{results.summary}</p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Member Profiles Used
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.memberProfiles.map((m, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-black">{m.score} pts</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.skills.map((skill, i) => (
                        <Badge key={i} className="text-[8px] px-1 bg-green-50 text-green-600 border-green-100 uppercase font-bold">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Layout size={16} /> Suggested Distribution
                </h4>
                <Button 
                  onClick={createAllTasks}
                  disabled={creatingAll || results.assignments.filter((_, i) => !createdTasks.has(i)).length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-8 px-4"
                >
                  {creatingAll ? `Creating ${progress}...` : 'Create All Tasks'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.assignments.map((a, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    {createdTasks.has(i) && (
                      <div className="absolute top-0 right-0 p-2 text-green-500 animate-in zoom-in">
                        <CheckCircle size={20} />
                      </div>
                    )}
                    <h5 className="font-bold text-slate-800 text-lg mb-4 flex items-start gap-2">
                      <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0">{i+1}</span>
                      {a.taskTitle}
                    </h5>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Assigned To</p>
                          <p className="text-sm font-bold text-slate-700">{a.memberName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 shrink-0">
                          <Plus size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Checklist Items</p>
                          <div className="space-y-1">
                            {a.checklist?.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => createIndividualTask(a, i)}
                      disabled={createdTasks.has(i) || creatingAll}
                      className={`w-full rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        createdTasks.has(i) 
                          ? "bg-green-100 text-green-600 border-green-200" 
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {createdTasks.has(i) ? <Check size={18} /> : <Plus size={18} />}
                      {createdTasks.has(i) ? 'Task Created' : 'Create This Task'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={generateDistribution}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
            >
              <RefreshCw size={18} /> Regenerate with same inputs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskDistributor;
