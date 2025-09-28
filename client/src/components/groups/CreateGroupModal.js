import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createGroup } from '../../redux/actions/groupAction';
import { getDataAPI } from '../../utils/fetchData';
import Avatar from '../Avatar';

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { auth, socket } = useSelector(state => state);
  const dispatch = useDispatch();

  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    members: [],
    expiryDuration: 24, // hours
    avatar: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Add Members, 3: Review

  // Search users for invitation using fuzzy backend search
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length > 2) {
        setSearchLoading(true);
        try {
          console.log('Searching for users:', searchQuery);
          const res = await getDataAPI(`search?username=${encodeURIComponent(searchQuery)}&type=users&limit=10`, auth.token);
          console.log('Search response:', res.data);
          
          const users = res.data.users?.filter(user => 
            user._id !== auth.user._id && 
            !selectedMembers.some(member => member._id === user._id)
          ) || [];
          
          console.log('Filtered users:', users);
          setSearchResults(users);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, auth.token, auth.user._id, selectedMembers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGroupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addMember = (user) => {
    setSelectedMembers(prev => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMember = (userId) => {
    setSelectedMembers(prev => prev.filter(member => member._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupData.name.trim()) {
      return;
    }

    setLoading(true);
    
    const memberIds = selectedMembers.map(member => member._id);
    
    const result = await dispatch(createGroup({
      groupData: {
        ...groupData,
        members: memberIds
      },
      auth,
      socket
    }));

    setLoading(false);

    if (result) {
      // Reset form
      setGroupData({
        name: '',
        description: '',
        members: [],
        expiryDuration: 24,
        avatar: ''
      });
      setSelectedMembers([]);
      setStep(1);
      onClose();
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-group-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <label>Basic Info</label>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <label>Add Members</label>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <label>Review</label>
          </div>
        </div>

        <div className="modal-content">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="step-content">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  name="name"
                  value={groupData.name}
                  onChange={handleInputChange}
                  placeholder="Enter group name"
                  maxLength="50"
                />
                <small>{groupData.name.length}/50</small>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={groupData.description}
                  onChange={handleInputChange}
                  placeholder="What's this group about?"
                  maxLength="200"
                  rows="3"
                />
                <small>{groupData.description.length}/200</small>
              </div>

              <div className="form-group">
                <label>Group Duration</label>
                <select
                  name="expiryDuration"
                  value={groupData.expiryDuration}
                  onChange={handleInputChange}
                >
                  <option value={1}>1 Hour</option>
                  <option value={6}>6 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={72}>3 Days</option>
                  <option value={168}>1 Week</option>
                  <option value={720}>1 Month</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Add Members */}
          {step === 2 && (
            <div className="step-content">
              <div className="member-search">
                <div className="search-input-container">
                  <i className={`fas ${searchLoading ? 'fa-spinner fa-spin' : 'fa-search'}`}></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users to invite... (type at least 3 characters)"
                  />
                </div>

                {/* Search Results */}
                {searchQuery.trim().length > 2 && (
                  <div className="search-results">
                    {searchLoading ? (
                      <div className="search-loading">
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span>Searching users...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <div key={user._id} className="search-result-item">
                          <Avatar src={user.avatar} size="small-avatar" />
                          <div className="user-info">
                            <span className="user-name">{user.fullname}</span>
                            <span className="user-username">@{user.username}</span>
                            {user.followers && (
                              <span className="user-followers">{user.followers.length} followers</span>
                            )}
                          </div>
                          <button 
                            className="add-member-btn"
                            onClick={() => addMember(user)}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="no-search-results">
                        <i className="fas fa-user-slash"></i>
                        <span>No users found for "{searchQuery}"</span>
                        <small>Try searching with different keywords</small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="selected-members">
                <h4>Selected Members ({selectedMembers.length})</h4>
                {selectedMembers.length === 0 ? (
                  <p className="no-members">No members selected yet</p>
                ) : (
                  <div className="members-list">
                    {selectedMembers.map(member => (
                      <div key={member._id} className="member-item">
                        <Avatar src={member.avatar} size="small-avatar" />
                        <span className="member-name">{member.fullname}</span>
                        <button 
                          className="remove-member-btn"
                          onClick={() => removeMember(member._id)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="step-content review-step">
              <div className="review-section">
                <div className="review-header">
                  <i className="fas fa-check-circle"></i>
                  <h4>Review Group Details</h4>
                  <p>Please review your group settings before creating</p>
                </div>
                
                <div className="review-details">
                  <div className="review-item">
                    <div className="review-label">
                      <i className="fas fa-users"></i>
                      <label>Group Name:</label>
                    </div>
                    <span className="review-value">{groupData.name}</span>
                  </div>

                  {groupData.description && (
                    <div className="review-item">
                      <div className="review-label">
                        <i className="fas fa-info-circle"></i>
                        <label>Description:</label>
                      </div>
                      <span className="review-value">{groupData.description}</span>
                    </div>
                  )}

                  <div className="review-item">
                    <div className="review-label">
                      <i className="fas fa-clock"></i>
                      <label>Duration:</label>
                    </div>
                    <span className="review-value">
                      {groupData.expiryDuration === 1 ? '1 Hour' :
                       groupData.expiryDuration === 6 ? '6 Hours' :
                       groupData.expiryDuration === 24 ? '24 Hours' :
                       groupData.expiryDuration === 72 ? '3 Days' :
                       groupData.expiryDuration === 168 ? '1 Week' :
                       groupData.expiryDuration === 720 ? '1 Month' : `${groupData.expiryDuration} Hours`}
                    </span>
                  </div>

                  <div className="review-item">
                    <div className="review-label">
                      <i className="fas fa-user-plus"></i>
                      <label>Members to Invite:</label>
                    </div>
                    <span className="review-value">
                      {selectedMembers.length === 0 ? 'No members selected' : `${selectedMembers.length} people`}
                    </span>
                  </div>

                  {selectedMembers.length > 0 && (
                    <div className="review-members-section">
                      <h5>Selected Members:</h5>
                      <div className="review-members-grid">
                        {selectedMembers.map(member => (
                          <div key={member._id} className="review-member-card">
                            <img 
                              src={member.avatar} 
                              alt={member.fullname}
                              className="review-member-avatar"
                            />
                            <div className="review-member-info">
                              <span className="member-name">{member.fullname}</span>
                              <span className="member-username">@{member.username}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={prevStep}>
              Previous
            </button>
          )}
          
          {step < 3 ? (
            <button 
              className="btn-primary" 
              onClick={nextStep}
              disabled={step === 1 && !groupData.name.trim()}
            >
              Next
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleCreateGroup}
              disabled={loading || !groupData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
