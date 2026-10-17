import { useEffect, useState } from "react";
import api from "../../../utils/api";

/**
 * usePriorityTasks Hook
 * Fetches and manages priority-sorted tasks
 */
export const usePriorityTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPriorityData();
  }, []);

  const fetchPriorityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const authData = localStorage.getItem("auth");
      if (!authData) {
        throw new Error("Not authenticated. Please log in.");
      }

      const response = await api.get("/priority/sorted");
      setTasks(response.data.assignments || []);
      setSummary(response.data.summary || {});

      try {
        const workloadResponse = await api.get("/priority/workload-analysis");
        setWorkload(workloadResponse.data.workload || []);
      } catch (workloadErr) {
        console.warn("Could not fetch workload:", workloadErr.message);
      }
    } catch (err) {
      console.error("Error fetching priority data:", err);
      setError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks,
    workload,
    summary,
    loading,
    error,
    refetch: fetchPriorityData,
  };
};
