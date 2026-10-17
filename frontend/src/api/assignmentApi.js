import axios from "axios";

const API_URL = "/api/assignments";

// Helper to get auth header
const getAuthHeader = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
};

const assignmentApi = {
  // Get all assignments for current user
  getAssignments: async () => {
    const response = await axios.get(API_URL, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get single assignment
  getAssignmentById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default assignmentApi;
