import Subtask from "../models/Subtask.js";

// PATCH /api/subtasks/:id
export const updateSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title, subDescription, estimatedHours } = req.body;

    const subtask = await Subtask.findById(id);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    // Update only the fields that were provided in the request body
    if (completed !== undefined) subtask.completed = completed;
    if (title !== undefined) subtask.title = title;
    if (subDescription !== undefined) subtask.subDescription = subDescription;
    if (estimatedHours !== undefined) subtask.estimatedHours = estimatedHours;

    await subtask.save();

    res.json(subtask);
  } catch (error) {
    console.error("Update subtask error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
