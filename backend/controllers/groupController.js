import Group from '../models/Group.js';
import User from '../models/User.js';
import Contribution from '../models/Contribution.js';
import GroupTask from '../models/GroupTask.js';
import Resource from '../models/Resource.js';
import Notification from '../models/Notification.js';

// @desc    Create a new study group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    try {
      await Contribution.create({
        group: group._id,
        user: req.user._id,
        score: 0,
        activities: []
      });
    } catch (contributionError) {
      await Group.findByIdAndDelete(group._id).catch(() => {});
      throw new Error('Failed to initialize group contribution tracking: ' + contributionError.message);
    }

    const populatedGroup = await Group.findById(group._id).populate('members.user', 'name email');
    res.status(201).json({ success: true, data: populatedGroup });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {}).join(', ');
      return res.status(400).json({
        success: false,
        message: `A group with this ${field} already exists. Please try again.`
      });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create group' });
  }
};

// @desc    Get all groups for the logged-in user
// @route   GET /api/groups
// @access  Private
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this group' });
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite a member by email
// @route   POST /api/groups/:id/invite
// @access  Private
export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Find user by email
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already a member
    const alreadyMember = group.members.some(m => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    // Add member
    group.members.push({ user: userToInvite._id, role: 'member' });
    await group.save();

    // Create contribution record for the new member
    await Contribution.create({
      group: group._id,
      user: userToInvite._id,
      score: 0,
      activities: []
    });

    const updatedGroup = await Group.findById(req.params.id).populate('members.user', 'name email');
    res.status(200).json({ success: true, data: updatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a member (Admin only)
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
export const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if current user is admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members' });
    }

    // Cannot remove admin
    if (req.params.userId === group.createdBy.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the group creator/admin' });
    }

    // Remove member
    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.save();

    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave group
// @route   DELETE /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Admin cannot leave
    if (group.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot leave the group. Delete the group instead.' });
    }

    // Remove self
    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();

    res.status(200).json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete group (Admin only)
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can delete the group' });
    }

    // Run all deletes in parallel for speed
    await Promise.all([
      GroupTask.deleteMany({ group: group._id }),
      Resource.deleteMany({ group: group._id }),
      Contribution.deleteMany({ group: group._id }),
      Notification.deleteMany({ groupId: group._id }),
      Group.findByIdAndDelete(req.params.id)
    ]);

    res.status(200).json({ success: true, message: 'Group and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users by name or email for inviting to group
// @route   GET /api/groups/search-users?q=searchTerm
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: regex },
        { email: regex }
      ]
    }).select('name email').limit(10);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a new invite code for a group (Admin only)
// @route   POST /api/groups/:id/invite-code
// @access  Private
export const generateInviteCode = async (req, res) => {
  try {
    const { expiresIn, limit } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if current user is admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can generate invite codes' });
    }

    // Generate random 6-character code (alphanumeric uppercase)
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Set expiration
    let expires = null;
    if (expiresIn === '1h') {
        expires = new Date(Date.now() + 60 * 60 * 1000);
    } else if (expiresIn === '1d') {
        expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (expiresIn === '7d') {
        expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (expiresIn === 'never') {
        expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
    } else {
        expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    group.inviteCode = code;
    group.inviteCodeExpires = expires;
    group.inviteCodeLimit = limit || null;
    group.inviteCodeUsedCount = 0;
    await group.save();

    res.status(200).json({ 
        success: true, 
        inviteCode: code, 
        inviteCodeExpires: expires,
        inviteCodeLimit: group.inviteCodeLimit,
        inviteCodeUsedCount: group.inviteCodeUsedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Revoke/Deactivate an invite code
// @route   DELETE /api/groups/:id/invite-code
// @access  Private
export const revokeInviteCode = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if current user is admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can revoke invite codes' });
    }

    group.inviteCode = undefined;
    group.inviteCodeExpires = undefined;
    group.inviteCodeLimit = null;
    group.inviteCodeUsedCount = 0;
    await group.save();

    res.status(200).json({ success: true, message: 'Invite code revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join a group using an invite code
// @route   POST /api/groups/join-by-code
// @access  Private
export const joinGroupByCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    // Find group by code (case insensitive) and check if code has not expired
    const group = await Group.findOne({ 
        inviteCode: code.toUpperCase(),
        inviteCodeExpires: { $gt: new Date() }
    });

    if (!group) {
        return res.status(404).json({ success: false, message: 'Invalid or expired invite code' });
    }

    // Check usage limit
    if (group.inviteCodeLimit !== null && group.inviteCodeUsedCount >= group.inviteCodeLimit) {
        return res.status(400).json({ success: false, message: 'Invite code usage limit reached' });
    }

    // Check if user is already a member
    const alreadyMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this group' });
    }

    // Add member
    group.members.push({ user: req.user._id, role: 'member' });
    group.inviteCodeUsedCount += 1;
    await group.save();

    // Create contribution record for the new member
    await Contribution.create({
      group: group._id,
      user: req.user._id,
      score: 0,
      activities: []
    });

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    if (error.code === 11000) { // Catch duplicate key error if contribution already exists
        return res.status(200).json({ success: true, data: await Group.findOne({ inviteCode: code.toUpperCase() }) });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

