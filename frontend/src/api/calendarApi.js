import axios from "axios";

const API_URL = "/api/calendar";

// Helper to get auth header
const getAuthHeader = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
};

const calendarApi = {
  // Get all tasks
  getTasks: async () => {
    const response = await axios.get(API_URL, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await axios.post(API_URL, taskData, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Update a task
  updateTask: async (id, taskData) => {
    const response = await axios.put(`${API_URL}/${id}`, taskData, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Delete a task
  deleteTask: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Seed demo data
  seedDemoData: async () => {
    const response = await axios.post(`${API_URL}/seed`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default calendarApi;
