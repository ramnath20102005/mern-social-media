const Groups = require('../models/groupModel');

// Check if user is group admin or creator
exports.isGroupAdmin = async (req, res, next) => {
  try {
    const group = await Groups.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isCreator = group.creator.toString() === req.user._id.toString();
    const isAdmin = group.isAdmin(req.user._id);
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ msg: 'Admin access required' });
    }

    req.group = group;
    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Check if user is group creator
exports.isGroupCreator = async (req, res, next) => {
  try {
    const group = await Groups.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isCreator = group.creator.toString() === req.user._id.toString();
    
    if (!isCreator) {
      return res.status(403).json({ msg: 'Creator access required' });
    }

    req.group = group;
    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Check if user is group member
exports.isGroupMember = async (req, res, next) => {
  try {
    const group = await Groups.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.isMember(req.user._id);
    const isCreator = group.creator.toString() === req.user._id.toString();
    
    if (!isMember && !isCreator) {
      return res.status(403).json({ msg: 'Group membership required' });
    }

    req.group = group;
    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
