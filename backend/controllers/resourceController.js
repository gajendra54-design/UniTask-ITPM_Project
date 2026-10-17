import Resource from '../models/Resource.js';
import Group from '../models/Group.js';
import Contribution from '../models/Contribution.js';
import { supabase } from '../config/supabase.js';


// @desc    Upload a file or add a link
// @route   POST /api/resources/upload
// @access  Private
export const uploadResource = async (req, res) => {
  try {
    const { type, title, id, groupId, description, tags, url } = req.body;
    
    // Support both 'id' and 'groupId' field names in the request body
    const finalGroupId = id || groupId || req.params.id;
    
    if (!finalGroupId) {
        return res.status(400).json({ success: false, message: 'Group ID is required' });
    }

    const group = await Group.findById(finalGroupId);
    if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const currentUserId = req.user._id.toString();
    const isMember = group.members.some(m => (m.user?._id || m.user || '').toString() === currentUserId);
    if (!isMember) {
        return res.status(403).json({ success: false, message: 'Only group members can add resources' });
    }

    let resourceUrl = url;
    let resourceData = {
      group: group._id,
      title,
      type,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description,
      uploadedBy: req.user._id
    };

    if (type === 'file') {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const path = `unitask/${Date.now()}_${req.file.originalname}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(path, req.file.buffer, { contentType: req.file.mimetype });

        if (uploadError) {
          return res.status(500).json({ success: false, message: 'File upload failed: ' + uploadError.message });
        }

        const { data: publicUrlData } = supabase.storage
          .from('resources')
          .getPublicUrl(path);

        resourceData = {
          ...resourceData,
          url: publicUrlData.publicUrl,
          fileUrl: publicUrlData.publicUrl,
          publicId: path,
          fileType: req.file.mimetype,
          originalName: req.file.originalname,
          fileSize: req.file.size
        };
        
        const resource = await Resource.create(resourceData);
        
        // Update contribution points
        const points = 5;
        await Contribution.findOneAndUpdate(
            { group: group._id, user: req.user._id },
            { 
                $inc: { score: points },
                $push: { activities: { action: `Uploaded file: ${title}`, points, createdAt: new Date() }}
            },
            { upsert: true, returnDocument: 'after' }
        );

        return res.status(201).json({ success: true, data: resource });
    }

    // Link type
    const resource = await Resource.create({
      ...resourceData,
      url: resourceUrl,
      fileUrl: resourceUrl, // For links, just use the same URL
      publicId: 'link'
    });

    // Update contribution points
    const points = 3;
    await Contribution.findOneAndUpdate(
        { group: group._id, user: req.user._id },
        { 
            $inc: { score: points },
            $push: { activities: { action: `Added link: ${title}`, points, createdAt: new Date() }}
        }
    );

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get resources for a group
// @route   GET /api/groups/:id/resources
// @access  Private
export const getResources = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { group: req.params.id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments(query)
    ]);

    res.status(200).json({ success: true, data: resources, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a resource
// @route   DELETE /api/groups/:id/resources/:resourceId
// @access  Private
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const group = await Group.findById(resource.group);
    
    // Check if user is uploader or admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    const isUploader = resource.uploadedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isUploader) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
    }

    // Call delete from Supabase before deleting record
    if (resource.type === 'file' && resource.publicId && resource.publicId !== 'link') {
      await supabase.storage.from('resources').remove([resource.publicId]);
    }

    await Resource.findByIdAndDelete(req.params.resourceId);

    res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get resource download URL
// @route   GET /api/resources/:id/download
// @access  Private
export const getDownloadUrl = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (resource.type !== 'file') {
      return res.status(400).json({ success: false, message: 'Resource is not a file' });
    }

    res.status(200).json({
      success: true,
      downloadUrl: resource.fileUrl,
      fileName: resource.originalName
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

