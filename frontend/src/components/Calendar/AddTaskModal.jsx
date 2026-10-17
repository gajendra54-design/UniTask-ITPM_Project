import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../../context/AuthContext';

const AddTaskModal = ({ isOpen, onClose, selectedDate, editEvent, events = [] }) => {
  const initialFormState = {
    title: '',
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    estimatedHours: '',
    priority: '',
    status: '',
    repeat: 'None',
    occurrences: 1
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const { token } = useAuth();

  // Reset/populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        setFormData({
          title: editEvent.title || '',
          subject: editEvent.subject || '',
          date: moment(editEvent.start).format('YYYY-MM-DD'),
          startTime: moment(editEvent.start).format('HH:mm'),
          endTime: moment(editEvent.end).format('HH:mm'),
          estimatedHours: editEvent.estimatedHours || '',
          priority: editEvent.priority || '',
          status: editEvent.status || '',
          repeat: 'None',
          occurrences: 1
        });
      } else {
        let initialDate = '';
        if (selectedDate) {
          const isPast = moment(selectedDate).isBefore(moment(), 'day');
          if (!isPast) {
            initialDate = moment(selectedDate).format('YYYY-MM-DD');
          }
        }
        setFormData({ 
          ...initialFormState, 
          date: initialDate 
        });
      }
      setErrors({});
      setApiError(null);
      setApiSuccess(null);
    }
  }, [isOpen, editEvent, selectedDate]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (apiError) setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required (minimum 3 characters)";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title is required (minimum 3 characters)";
    } else if (!/[a-zA-Z]/.test(formData.title.trim())) {
      newErrors.title = "Title must contain at least one letter";
    } else if (/(.)\1{2,}/.test(formData.title.trim())) {
      newErrors.title = "Title contains too many repeating characters";
    }

    // Subject validation
    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = "Date cannot be in the past";
    } else {
      const selectedDate = new Date(formData.date);
      
      let isDateChanged = true;
      if (editEvent) {
        const originalDate = moment(editEvent.start).format('YYYY-MM-DD');
        isDateChanged = formData.date !== originalDate;
      }

      if (selectedDate < today && (!editEvent || isDateChanged)) {
        newErrors.date = "Date cannot be in the past";
      } else {
        // Max 3 tasks and 8 hours per day validation
        const tasksOnDate = events.filter(e => {
          if (editEvent && e.id === editEvent.id) return false;
          return moment(e.start).format('YYYY-MM-DD') === formData.date;
        });
        
        const totalExistingHours = tasksOnDate.reduce((sum, e) => sum + (e.estimatedHours || 0), 0);
        const newTaskHours = parseFloat(formData.estimatedHours) || 0;

        if (tasksOnDate.length >= 3) {
          newErrors.date = "You cannot add more than 3 assignments to one day";
        } else if (totalExistingHours + newTaskHours > 8) {
          newErrors.date = `This task will exceed the 8h daily limit (Current: ${totalExistingHours}h). Total would be ${totalExistingHours + newTaskHours}h.`;
        }
      }
    }

    // Start Time validation
    if (!formData.startTime) {
      newErrors.startTime = "Start Time is required";
    }

    // End Time validation
    if (!formData.endTime) {
      newErrors.endTime = "End Time must be after Start Time";
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      newErrors.endTime = "End Time must be after Start Time";
    }

    // Estimated Hours validation
    if (!formData.estimatedHours) {
      newErrors.estimatedHours = "Estimated Hours must be between 0.5 and 8";
    } else {
      const hours = parseFloat(formData.estimatedHours);
      if (hours < 0.5 || hours > 8) {
        newErrors.estimatedHours = "Estimated Hours must be between 0.5 and 8";
      }
    }

    // Priority validation
    if (!formData.priority) {
      newErrors.priority = "Please select a priority level";
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = "Please select a status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAIEstimate = async () => {
    if (!formData.title.trim()) {
      setErrors({ ...errors, title: "Title is required for AI estimation" });
      return;
    }

    setIsAiEstimating(true);
    setApiError(null);

    try {
      // Simulate Backend AI call
      // In a real app, this would be: await axios.post('/api/calendar/ai-estimate', { title: formData.title, description: formData.description })
      await new Promise(resolve => setTimeout(resolve, 1200)); // AI magic takes time...

      const title = formData.title.toLowerCase();
      let hours = 2.0; // Baseline

      if (title.includes('exam') || title.includes('final')) hours = 4.0;
      else if (title.includes('assignment') || title.includes('project')) hours = 3.0;
      else if (title.includes('quiz') || title.includes('test')) hours = 1.0;
      else if (title.includes('review') || title.includes('reading')) hours = 1.5;
      else if (title.includes('math') || title.includes('algorithm')) hours += 1.0;

      // Add bit of randomness for "AI" feel
      const noise = (Math.random() * 0.5 - 0.25);
      const finalHours = Math.min(Math.max((hours + noise), 0.5), 8).toFixed(1);

      setFormData(prev => ({ ...prev, estimatedHours: finalHours }));
      setApiSuccess(`AI estimated ${finalHours} hours for this task.`);
      setTimeout(() => setApiSuccess(null), 3000);
    } catch  {
      setApiError("AI Estimation failed. Please set manually.");
    } finally {
      setIsAiEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        ...formData,
        subjectModule: formData.subject, // Map subject to subjectModule for backend
        date: new Date(formData.date).toISOString()
      };

      if (editEvent) {
        await axios.put(`/api/calendar/${editEvent.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApiSuccess("Task updated successfully");
      } else {
        await axios.post('/api/calendar', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApiSuccess("Task added successfully");
      }
      
      setFormData(initialFormState); // Clear form state

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose(true); // Signal refresh
      }, 1500);

    } catch (err) {
      console.error('Error saving task:', err);
      setApiError(err.response?.data?.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoData = () => {
    setFormData({
      title: 'Database Assignment Study Session',
      subject: 'Database Management Systems',
      date: '2026-03-25',
      startTime: '09:00',
      endTime: '11:00',
      estimatedHours: '2',
      priority: 'High',
      status: 'Pending'
    });
    setErrors({});
    setApiError(null);
  };

  const getInputClasses = (fieldName) => {
    const baseClasses = "mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 p-2 border transition-colors";
    const errorClasses = errors[fieldName] 
      ? "border-red-500 focus:border-red-500 ring-1 ring-red-500" 
      : "border-gray-300 focus:border-blue-500";
    return `${baseClasses} ${errorClasses}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{editEvent ? "Edit Task" : "Add New Task"}</h2>
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {apiSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200 flex items-center transition-all">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {apiSuccess}
          </div>
        )}

        {apiError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {apiError}
          </div>
        )}

        <div className="mb-6">
          <button 
            type="button"
            onClick={handleFillDemoData}
            className="w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Fill Demo Data</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={getInputClasses('title')} 
              placeholder="Enter task title" 
            />
            {errors.title && <p className="mt-1 text-xs text-red-600 font-medium">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subject / Module</label>
            <select 
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className={getInputClasses('subject')}
            >
              <option value="">Select a Subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physics">Physics</option>
              <option value="Database Management Systems">Database Management Systems</option>
              <option value="Other">Other</option>
            </select>
            {errors.subject && <p className="mt-1 text-xs text-red-600 font-medium">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={getInputClasses('date')} 
              />
              {errors.date && <p className="mt-1 text-xs text-red-600 font-medium">{errors.date}</p>}
            </div>
            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                <span>Est. Hours</span>
                <button 
                  type="button" 
                  onClick={handleAIEstimate}
                  disabled={isAiEstimating}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 normal-case text-[10px] transition-all active:scale-90"
                  title="Auto-estimate with AI"
                >
                  {isAiEstimating ? (
                    <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {isAiEstimating ? "Thinking..." : "AI Auto-Estimate"}
                </button>
              </label>
              <input 
                type="number" 
                name="estimatedHours"
                step="0.5"
                value={formData.estimatedHours}
                onChange={handleInputChange}
                className={getInputClasses('estimatedHours')} 
                placeholder="2" 
              />
              {errors.estimatedHours && <p className="mt-1 text-xs text-red-600 font-medium">{errors.estimatedHours}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start Time</label>
              <input 
                type="time" 
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={getInputClasses('startTime')} 
              />
              {errors.startTime && <p className="mt-1 text-xs text-red-600 font-medium">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">End Time</label>
              <input 
                type="time" 
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={getInputClasses('endTime')} 
              />
              {errors.endTime && <p className="mt-1 text-xs text-red-600 font-medium">{errors.endTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
              <select 
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={getInputClasses('priority')}
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              {errors.priority && <p className="mt-1 text-xs text-red-600 font-medium">{errors.priority}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={getInputClasses('status')}
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              {errors.status && <p className="mt-1 text-xs text-red-600 font-medium">{errors.status}</p>}
            </div>
          </div>

          {!editEvent && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Repeat</label>
                <select 
                  name="repeat"
                  value={formData.repeat}
                  onChange={handleInputChange}
                  className={getInputClasses('repeat')}
                >
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              {formData.repeat !== 'None' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Occurrences</label>
                  <input 
                    type="number" 
                    name="occurrences"
                    min="1"
                    max="10"
                    value={formData.occurrences}
                    onChange={handleInputChange}
                    className={getInputClasses('occurrences')} 
                    placeholder="1" 
                  />
                  {errors.occurrences && <p className="mt-1 text-xs text-red-600 font-medium">{errors.occurrences}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editEvent ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
