import Contribution from '../models/Contribution.js';
import Group from '../models/Group.js';

// @desc    Get all contribution scores for a group (Leaderboard)
// @route   GET /api/groups/:id/contributions
// @access  Private
export const getGroupContributions = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).select('_id').lean();
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const contributions = await Contribution.find({ group: group._id })
      .populate('user', 'name email')
      .sort({ score: -1 })
      .lean();

    res.status(200).json({ success: true, data: contributions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get combined activity log for a group
// @route   GET /api/groups/:id/activity
// @access  Private
export const getGroupActivity = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).select('_id').lean();
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const contributions = await Contribution.find({ group: group._id })
      .populate('user', 'name')
      .select('user activities')
      .lean();

    const allActivities = [];
    for (const contribution of contributions) {
      for (const activity of contribution.activities) {
        allActivities.push({
          userName: contribution.user?.name || 'Unknown User',
          action: activity.action,
          points: activity.points,
          createdAt: activity.createdAt
        });
      }
    }

    allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentActivity = allActivities.slice(0, 20);

    res.status(200).json({ success: true, data: recentActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
