import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const TaskDetailModal = ({ isOpen, onClose, event, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  if (!isOpen || !event) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      await axios.delete(`/api/calendar/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onClose(true); // Signal refresh
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || "Failed to delete task. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all relative">
        <button 
          onClick={() => onClose(false)} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 pr-10 mb-6 border-b pb-4">{event.title}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-semibold text-gray-800">{event.subject || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(event.start))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start Time</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">End Time</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Hours</p>
              <p className="text-sm font-semibold text-gray-800">{event.estimatedHours}h</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(event.priority)} uppercase`}>
                {event.priority}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(event.status)} uppercase`}>
              {event.status}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 border-t pt-6">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 border border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onEdit}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors disabled:bg-red-300"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
