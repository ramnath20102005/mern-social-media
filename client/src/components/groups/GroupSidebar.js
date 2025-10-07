import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { imageUpload } from '../../utils/imageUpload';

const GroupSidebar = ({ group, onClose, showSettings = false }) => {
  const { auth } = useSelector(state => state);
  
  const [activeTab, setActiveTab] = useState(showSettings ? 'settings' : 'info');
  const [loading, setLoading] = useState(false);
  const isCreator = group?.creator === auth.user._id;
  const isAdmin = group?.members?.some(member => 
    member.user === auth.user._id && member.role === 'admin'
  );

  // Helper functions
  const getAvatarGradientClass = (groupName) => {
    const avatarGradients = [
      'gradient-blue-purple', 'gradient-green-blue', 'gradient-purple-pink',
      'gradient-orange-red', 'gradient-teal-cyan', 'gradient-indigo-purple'
    ];
    if (!groupName || typeof groupName !== 'string') {
      return avatarGradients[0];
    }
    const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarGradients[hash % avatarGradients.length];
  };

  const getGroupInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getTimeRemaining = () => {
    if (!group?.expiryDate) return 'No expiry';
    const now = new Date();
    const expiry = new Date(group.expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expiring soon';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const media = await imageUpload([file]);
      console.log('Avatar uploaded:', media[0].url);
      // TODO: Implement avatar upload dispatch
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

  return (
    <div className="group-sidebar-overlay" onClick={handleOverlayClick}>
      <div className="group-sidebar-container" onClick={(e) => e.stopPropagation()}>
        {/* Enhanced Header */}
        <div className="group-sidebar-header">
          <h2 className="group-sidebar-title">Group Info</h2>
          <button className="close-sidebar-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="group-tabs">
          <button 
            className={`group-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <div className="group-tab-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            Info
          </button>
          <button 
            className={`group-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <div className="group-tab-icon">
              <i className="fas fa-users"></i>
            </div>
            Members
          </button>
          <button 
            className={`group-tab ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <div className="group-tab-icon">
              <i className="fas fa-images"></i>
            </div>
            Media
          </button>
        </div>

        {/* Enhanced Tab Content */}
        {activeTab === 'info' && (
          <div className="group-info-content">
            {/* Enhanced Group Avatar Section */}
            <div className="group-avatar-section">
              <div className="group-avatar-container-large">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} className="group-avatar-large-sidebar" />
                ) : (
                  <div className={`group-avatar-generated-large ${getAvatarGradientClass(group.name)}`}>
                    <span className="avatar-initials-large">
                      {getGroupInitials(group.name)}
                    </span>
                  </div>
                )}
                {(isCreator || isAdmin) && (
                  <label className="avatar-upload-btn">
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-camera"></i>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
              
              <h3 className="group-name-display">{group.name}</h3>
              {group.description && (
                <p className="group-description-display">{group.description}</p>
              )}
            </div>

            {/* Enhanced Info Cards */}
            <div className="group-info-cards">
              <div className="group-info-card">
                <div className="group-info-card-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="group-info-card-value">{group.members?.length || 1}</div>
                <div className="group-info-card-label">Members</div>
              </div>
              
              <div className="group-info-card">
                <div className="group-info-card-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="group-info-card-value">{formatDate(group.createdAt)}</div>
                <div className="group-info-card-label">Created</div>
              </div>
              
              <div className="group-info-card">
                <div className="group-info-card-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="group-info-card-value">{getTimeRemaining()}</div>
                <div className="group-info-card-label">Expires</div>
              </div>
              
              <div className="group-info-card">
                <div className="group-info-card-icon">
                  <i className="fas fa-crown"></i>
                </div>
                <div className="group-info-card-value">{group.creator?.fullname || 'Unknown'}</div>
                <div className="group-info-card-label">Creator</div>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="members-list">
            {/* Show Creator First */}
            {group.creator && (
              <div className="member-item">
                <img 
                  src={group.creator.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face`} 
                  alt={group.creator.fullname || group.creator.username} 
                  className="member-avatar" 
                />
                <div className="member-info">
                  <div className="member-name">{group.creator.fullname || group.creator.username}</div>
                  <div className="member-role creator">
                    <i className="fas fa-crown"></i> CREATOR
                  </div>
                </div>
              </div>
            )}
            
            {/* Show Only Actual Group Members (excluding creator) */}
            {group.members && group.members.length > 0 ? (
              group.members
                .filter(member => {
                  // Get member ID properly
                  const memberId = typeof member === 'object' ? (member._id || member.user) : member;
                  const creatorId = typeof group.creator === 'object' ? group.creator._id : group.creator;
                  // Only show if not the creator
                  return memberId !== creatorId;
                })
                .map((member, index) => {
                  // Handle both user object and user ID cases
                  const memberData = typeof member === 'object' && member.user ? member.user : member;
                  const memberName = memberData?.fullname || memberData?.username || 'Unknown User';
                  const memberAvatar = memberData?.avatar;
                  
                  return (
                    <div key={member._id || member.user || index} className="member-item">
                      <img 
                        src={memberAvatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face`} 
                        alt={memberName} 
                        className="member-avatar" 
                      />
                      <div className="member-info">
                        <div className="member-name">{memberName}</div>
                        <div className="member-role member">
                          <i className="fas fa-user"></i> MEMBER
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="no-additional-members">
                <p>No other members in this group</p>
              </div>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="media-grid">
            {group.media && group.media.length > 0 ? (
              group.media.map((item, index) => (
                <div key={index} className="media-item">
                  {item.type?.startsWith('video') ? (
                    <video src={item.url} />
                  ) : (
                    <img src={item.url} alt="Group media" />
                  )}
                </div>
              ))
            ) : (
              <div className="no-media-state">
                <div className="no-media-icon">
                  <i className="fas fa-images"></i>
                </div>
                <p>No media shared yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSidebar;
