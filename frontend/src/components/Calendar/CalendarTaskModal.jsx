import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import moment from 'moment';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const CalendarTaskModal = ({ isOpen, onClose, selectedDate, task, onRefresh }) => {
  const [formData, setFormData] = useState({
    title: '',
    subjectModule: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    estimatedHours: 1,
    priority: 'Medium',
    status: 'Pending'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        subjectModule: task.subjectModule || '',
        date: moment(task.date).format('YYYY-MM-DD'),
        startTime: task.startTime || '09:00',
        endTime: task.endTime || '10:00',
        estimatedHours: task.estimatedHours || 1,
        priority: task.priority || 'Medium',
        status: task.status || 'Pending'
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        title: '',
        subjectModule: '',
        date: moment(selectedDate).format('YYYY-MM-DD'),
        status: 'Pending'
      }));
    }
  }, [task, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const start = moment(formData.startTime, 'HH:mm');
    const end = moment(formData.endTime, 'HH:mm');

    if (!end.isAfter(start)) {
      setError('End Time must be after Start Time');
      return;
    }

    try {
      setLoading(true);
      if (task) {
        await api.put(`/calendar/${task._id}`, formData);
      } else {
        await api.post('/calendar', formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/calendar/${task._id}`);
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 border border-red-100 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Mathematics Assignment"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectModule">Subject / Module</Label>
            <Input
              id="subjectModule"
              name="subjectModule"
              placeholder="e.g., CS101"
              value={formData.subjectModule}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                name="estimatedHours"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimatedHours}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            {task && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={18} className="mr-2" />
                {deleting ? '...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (task ? 'Saving...' : 'Adding...') : (task ? 'Save Changes' : 'Add Task')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarTaskModal;
