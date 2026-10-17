import { useState, useRef } from 'react';
import {
  X, Trash2, Paperclip, MessageSquare, CheckSquare, Clock,
  Repeat, Link as LinkIcon, Send, Download
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

export default function TaskDetailsModal({ task, groupId, allTasks, onClose, onUpdate, onDownload, getFileIcon }) {
  const [activeTab, setActiveTab] = useState('details');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours || 0);
  const [recurrence, setRecurrence] = useState(task.recurrence || 'none');
  const [dependsOn, setDependsOn] = useState(task.dependsOn?.map(d => d._id || d) || []);
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');

  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState('');

  const [attachments, setAttachments] = useState(task.attachments || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

   // For context, normally passed down from GroupDetail
  

  const handleSaveDetails = async () => {
    try {
      await axiosInstance.put(`/groups/${groupId}/tasks/${task._id}`, {
        title,
        description,
        subtasks,
        estimatedHours,
        recurrence,
        dependsOn
      });
      toast.success('Task details updated');
      onUpdate();
    } catch  {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Delete this task forever?')) return;
    try {
      await axiosInstance.delete(`/groups/${groupId}/tasks/${task._id}`);
      toast.success('Task deleted');
      onClose();
      onUpdate();
    } catch  {
      toast.error('Failed to delete task');
    }
  };

  const toggleSubtask = (index) => {
    const newSt = [...subtasks];
    newSt[index].completed = !newSt[index].completed;
    setSubtasks(newSt);
  };
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      // Basic mention extraction: look for @username matching group members is complex
      // For now, no explicit user linking on frontend unless selected from dropdown.
      const res = await axiosInstance.post(`/groups/${groupId}/tasks/${task._id}/comments`, {
        content: newComment,
        mentions: [] // Future: parse @mentions
      });
      setComments(res.data.data.comments);
      setNewComment('');
      onUpdate();
    } catch  {
      toast.error('Failed to post comment');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/tasks/${task._id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachments(res.data.data.attachments);
      toast.success('Attachment uploaded');
      onUpdate();
    } catch  {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex gap-2 items-center mb-2">
              <Badge variant="outline" className={
                task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-200' :
                  task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                    'bg-green-50 text-green-600 border-green-200'
              }>{task.priority}</Badge>
              <Badge className={
                task.status === 'Done' ? 'bg-green-100 text-green-700' :
                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
              }>{task.status}</Badge>
            </div>
            <Input
              className="text-2xl font-black text-gray-900 border-none px-0 h-auto focus-visible:ring-0 placeholder:text-gray-300"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task Title..."
            />
            <textarea
              className="text-sm text-gray-500 mt-1 border-none px-0 w-full resize-none focus-visible:ring-0 min-h-[40px] placeholder:text-gray-300"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Task Description..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDeleteTask} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="Delete Task"><Trash2 size={20} /></button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b px-6 gap-6 text-sm font-bold text-gray-500">
          <button onClick={() => setActiveTab('details')} className={`py-4 border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-gray-900'}`}><CheckSquare size={16} className="inline mr-2" />Details</button>
          <button onClick={() => setActiveTab('comments')} className={`py-4 border-b-2 transition-colors ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-gray-900'}`}><MessageSquare size={16} className="inline mr-2" />Comments ({comments.length})</button>
          <button onClick={() => setActiveTab('attachments')} className={`py-4 border-b-2 transition-colors ${activeTab === 'attachments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-gray-900'}`}><Paperclip size={16} className="inline mr-2" />Attachments ({attachments.length})</button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">

          {activeTab === 'details' && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {/* Subtasks */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2"><CheckSquare size={16} className="text-indigo-600" /> Subtasks (Micro-checklist)</h4>
                  <div className="space-y-2">
                    {subtasks.map((st, i) => (
                      <div key={i} className="flex gap-3 items-center bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200 hover:border-indigo-200 transition-colors">
                        <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(i)} className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                        <span className={`text-sm flex-1 ${st.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{st.title}</span>
                        <button onClick={() => { const n = [...subtasks]; n.splice(i, 1); setSubtasks(n) }} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Add subtask..." className="h-9 text-sm" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                      <Button size="sm" onClick={addSubtask} variant="secondary">Add</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><LinkIcon size={12} /> Dependencies</label>
                  <select multiple className="w-full border rounded-xl p-2 text-sm bg-gray-50 h-24 outline-none focus:ring-2 focus:ring-indigo-500" value={dependsOn} onChange={e => setDependsOn(Array.from(e.target.selectedOptions, option => option.value))}>
                    {allTasks.filter(t => t._id !== task._id).map(t => (
                      <option key={t._id} value={t._id}>{t.title} ({t.status})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple. Blocked until Done.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={12} /> Effort (Hours)</label>
                  <Input type="number" min="0" step="0.5" className="h-9" value={estimatedHours} onChange={e => setEstimatedHours(Number(e.target.value))} />
                  <p className="text-[10px] text-gray-400 mt-1">Used for Burn-down charting.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Repeat size={12} /> Recurrence</label>
                  <select className="w-full border rounded-xl p-2.5 text-sm bg-gray-50 outline-none h-10" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveDetails}>Save Updates</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {comments.length === 0 ? <p className="text-center text-gray-400 italic mt-10">No comments yet. @Mention team members!</p> :
                  comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shrink-0 text-xs">
                        {c.author?.name?.charAt(0) || '?'}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border">
                        <p className="text-xs font-bold text-gray-900 mb-1">{c.author?.name} <span className="text-gray-400 font-normal ml-2">{formatDistanceToNow(new Date(c.createdAt))} ago</span></p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div className="flex gap-2 items-end border-t pt-4">
                <textarea className="flex-1 border rounded-xl p-3 resize-none h-14 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ask a question or @mention someone..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                <Button className="h-14 w-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-shrink-0" onClick={postComment}><Send size={18} /></Button>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-gray-50 p-4 border border-dashed border-gray-300 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-700">Attach Study Materials</p>
                  <p className="text-xs text-gray-500">PDFs, Docs, Images</p>
                </div>
                <input type="file" ref={fileRef} className="hidden" onChange={handleFileUpload} />
                <Button onClick={() => fileRef.current?.click()} variant="outline" className="bg-white" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Browse Files'}
                </Button>
              </div>

              <div className="grid gap-3">
                {attachments.length === 0 && <p className="text-center text-gray-400 italic mt-8">No attachments found.</p>}
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                        {getFileIcon ? getFileIcon(att.name) : <Paperclip size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-700 truncate">{att.name}</p>
                        <p className="text-[10px] text-gray-400">Uploaded {formatDistanceToNow(new Date(att.createdAt))} ago</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDownload ? onDownload(att.url, att.name) : window.open(`http://localhost:5000/${att.url}`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Download Attachment"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
