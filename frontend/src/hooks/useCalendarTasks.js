import { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import api from '../utils/api';

export const useCalendarTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get('/calendar');
      
      // Transform task data into react-big-calendar format
      const transformedTasks = response.data.map(task => {
        const taskDate = moment(task.date).format('YYYY-MM-DD');
        const start = moment(`${taskDate} ${task.startTime}`, 'YYYY-MM-DD HH:mm').toDate();
        const end = moment(`${taskDate} ${task.endTime}`, 'YYYY-MM-DD HH:mm').toDate();
        
        return {
          ...task,
          id: task._id,
          title: task.title,
          start,
          end,
          priority: task.priority
        };
      });

      setTasks(transformedTasks);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching calendar tasks:', err);
      setError(err.message || 'Failed to fetch tasks');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial loading is already true.
    // State changes happen after the request resolves when showLoading is false.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks(false);
  }, [fetchTasks]);

  return { tasks, loading, error, refreshTasks: fetchTasks };
};
