import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getDataAPI, postDataAPI } from '../../utils/fetchData';
import { createGroup } from '../../redux/actions/groupAction';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import Avatar from '../Avatar';

const QuickGroupCreate = ({ isOpen, onClose, onGroupCreated }) => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();
  
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Members & Timeline
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    timeline: 24, // hours
    members: []
  });
  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  // Timeline options
  const timelineOptions = [
    { value: 1, label: '1 Hour', desc: 'Quick chat' },
    { value: 6, label: '6 Hours', desc: 'Half day' },
    { value: 12, label: '12 Hours', desc: 'Half day' },
    { value: 24, label: '1 Day', desc: 'Most popular' },
    { value: 72, label: '3 Days', desc: 'Weekend chat' },
    { value: 168, label: '1 Week', desc: 'Project work' },
    { value: 720, label: '1 Month', desc: 'Long term' }
  ];

  // Load followers when component opens
  useEffect(() => {
    if (isOpen && step === 2) {
      loadFollowers();
    }
  }, [isOpen, step]);

  const loadFollowers = async () => {
    try {
      setLoadingFollowers(true);
      const res = await getDataAPI(`user/${auth.user._id}`, auth.token);
      const userFollowers = res.data.user.followers || [];
      
      // Get detailed follower info
      const followerDetails = await Promise.all(
        userFollowers.slice(0, 50).map(async (followerId) => {
          try {
            const followerRes = await getDataAPI(`user/${followerId}`, auth.token);
            return followerRes.data.user;
          } catch (err) {
            return null;
          }
        })
      );
      
      setFollowers(followerDetails.filter(f => f !== null));
    } catch (err) {
      console.error('Error loading followers:', err);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGroupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleMemberSelection = (user) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m._id === user._id);
      if (isSelected) {
        return prev.filter(m => m._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!groupData.name.trim()) {
        dispatch({
          type: GLOBALTYPES.ALERT,
          payload: { error: 'Group name is required' }
        });
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      
      const groupPayload = {
        name: groupData.name.trim(),
        description: groupData.description.trim(),
        expiryDuration: groupData.timeline,
        members: selectedMembers.map(m => m._id)
      };

      const res = await postDataAPI('groups/create', groupPayload, auth.token);
      
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { success: 'Group created successfully!' }
      });

      // Call parent callback with the new group
      if (onGroupCreated) {
        onGroupCreated(res.data.group);
      }

      // Reset form and close
      setGroupData({ name: '', description: '', timeline: 24, members: [] });
      setSelectedMembers([]);
      setStep(1);
      onClose();

    } catch (err) {
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: err.response?.data?.msg || 'Failed to create group' }
      });
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quick-group-create-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {step === 1 ? 'Create Group' : 'Add Members & Timeline'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div className="group-basic-info">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  name="name"
                  value={groupData.name}
                  onChange={handleInputChange}
                  placeholder="Enter group name..."
                  maxLength={50}
                  className="form-input"
                />
                <small>{groupData.name.length}/50</small>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={groupData.description}
                  onChange={handleInputChange}
                  placeholder="What's this group about?"
                  maxLength={200}
                  className="form-textarea"
                  rows={3}
                />
                <small>{groupData.description.length}/200</small>
              </div>

              <div className="step-actions">
                <button 
                  className="btn-secondary"
                  onClick={handleCreate}
                  disabled={creating || !groupData.name.trim()}
                >
                  {creating ? (
                    <>
                      <div className="btn-spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Quick Create
                    </>
                  )}
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleNext}
                  disabled={!groupData.name.trim()}
                >
                  <span>Next: Add Members</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="group-members-timeline">
              {/* Timeline Selection */}
              <div className="form-group">
                <label>
                  <i className="fas fa-clock"></i>
                  Group Timeline
                </label>
                <div className="timeline-options">
                  {timelineOptions.map(option => (
                    <div 
                      key={option.value}
                      className={`timeline-option ${groupData.timeline === option.value ? 'selected' : ''}`}
                      onClick={() => setGroupData(prev => ({ ...prev, timeline: option.value }))}
                    >
                      <div className="timeline-label">{option.label}</div>
                      <div className="timeline-desc">{option.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Selection */}
              <div className="form-group">
                <label>
                  <i className="fas fa-users"></i>
                  Add Members ({selectedMembers.length} selected)
                </label>
                
                {loadingFollowers ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading followers...</span>
                  </div>
                ) : followers.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-user-friends"></i>
                    <p>No followers to add</p>
                    <small>Follow people to add them to groups</small>
                  </div>
                ) : (
                  <div className="members-list">
                    {followers.map(follower => (
                      <div 
                        key={follower._id} 
                        className={`member-option ${selectedMembers.some(m => m._id === follower._id) ? 'selected' : ''}`}
                        onClick={() => toggleMemberSelection(follower)}
                      >
                        <Avatar src={follower.avatar} size="medium-avatar" />
                        <div className="member-info">
                          <span className="member-name">{follower.fullname}</span>
                          <span className="member-username">@{follower.username}</span>
                        </div>
                        <div className="member-checkbox">
                          {selectedMembers.some(m => m._id === follower._id) && (
                            <i className="fas fa-check"></i>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="step-actions">
                <button 
                  className="btn-secondary"
                  onClick={handleBack}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <div className="btn-spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickGroupCreate;
