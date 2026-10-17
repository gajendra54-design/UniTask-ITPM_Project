import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { addDays, differenceInDays, isBefore, isAfter, startOfDay } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TaskBurndownChart({ tasks }) {
  const chartData = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    // Filter tasks with estimated hours
    const estimatedTasks = tasks.map(t => ({
      ...t,
      est: t.estimatedHours || 1,
      createdAt: new Date(t.createdAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
    }));

    if (estimatedTasks.length === 0) return null;

    // Find min and max dates
    let startDate = startOfDay(estimatedTasks[0].createdAt);
    let endDate = startOfDay(estimatedTasks[0].dueDate || new Date());

    estimatedTasks.forEach(t => {
      const c = startOfDay(t.createdAt);
      const d = t.dueDate ? startOfDay(t.dueDate) : c;
      if (isBefore(c, startDate)) startDate = c;
      if (isAfter(d, endDate)) endDate = d;
      // also consider completion dates
      if (t.completedAt) {
          const comp = startOfDay(t.completedAt);
          if (isAfter(comp, endDate)) endDate = comp;
      }
    });

    const totalDays = Math.max(1, differenceInDays(endDate, startDate));
    const labels = [];
    const idealData = [];
    const actualData = [];

    let totalEffort = estimatedTasks.reduce((sum, t) => sum + t.est, 0);
    const dailyBurnRate = totalEffort / totalDays;

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = addDays(startDate, i);
      labels.push(currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      
      // Ideal line
      idealData.push(Math.max(0, totalEffort - (i * dailyBurnRate)));

      // Actual line (only up to today)
      if (isBefore(currentDate, addDays(new Date(), 1))) {
        // Calculate remaining effort on this day
        let remaining = totalEffort;
        estimatedTasks.forEach(t => {
            // If task was completed on or before this day, subtract it
            if (t.status === 'Done' && t.completedAt && isBefore(startOfDay(t.completedAt), addDays(currentDate, 1))) {
                remaining -= t.est;
            }
        });
        actualData.push(remaining);
      } else {
        actualData.push(null);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Ideal Remaining (hrs)',
          data: idealData,
          borderColor: 'rgba(156, 163, 175, 1)',
          backgroundColor: 'rgba(156, 163, 175, 0.2)',
          borderDash: [5, 5],
          tension: 0,
          borderWidth: 2
        },
        {
          label: 'Actual Remaining (hrs)',
          data: actualData,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          tension: 0.1,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        }
      ]
    };

  }, [tasks]);

  if (!chartData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500 font-medium">No effort estimations found.</p>
        <p className="text-xs text-gray-400 mt-1">Add "Estimated Hours" to tasks to see the burn-down chart.</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Remaining Work (Hours)' }
      }
    }
  };

  return (
    <div className="w-full h-72 bg-white p-4 rounded-3xl border shadow-sm">
      <Line options={options} data={chartData} />
    </div>
  );
}
