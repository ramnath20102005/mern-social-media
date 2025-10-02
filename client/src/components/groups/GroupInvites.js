import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getPendingInvites, respondToInvite } from '../../redux/actions/groupAction';
import Avatar from '../Avatar';

const GroupInvites = () => {
  const { auth, groups, socket } = useSelector(state => state);
  const dispatch = useDispatch();

  useEffect(() => {
    if (auth.token) {
      dispatch(getPendingInvites(auth));
    }
  }, [auth.token, dispatch]);

  const handleInviteResponse = async (inviteId, response) => {
    await dispatch(respondToInvite({ inviteId, response, auth, socket }));
  };

  const formatTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  if (!groups.invites || groups.invites.length === 0) {
    return (
      <div className="modern-empty-state">
        <div className="empty-illustration">
          <div className="empty-icon-wrapper">
            <i className="fas fa-envelope-open"></i>
          </div>
          <div className="empty-sparkles">
            <span className="sparkle sparkle-1">✨</span>
            <span className="sparkle sparkle-2">✨</span>
            <span className="sparkle sparkle-3">✨</span>
          </div>
        </div>
        <h3>No Invitations Yet</h3>
        <p>When friends invite you to groups, they'll appear here</p>
      </div>
    );
  }

  return (
    <div className="modern-invites-container">
      <div className="modern-invites-header">
        <div className="header-content">
          <h2>Group Invitations</h2>
          <div className="invite-badge">
            <span>{groups.invites.length}</span>
          </div>
        </div>
      </div>

      <div className="modern-invites-list">
        {groups.invites.map(invite => (
          <div key={invite._id} className="modern-invite-card">
            <div className="invite-card-header">
              <div className="group-avatar-wrapper">
                {invite.group.avatar ? (
                  <img src={invite.group.avatar} alt={invite.group.name} className="group-avatar" />
                ) : (
                  <div className="group-avatar-placeholder">
                    {invite.group.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="online-indicator"></div>
              </div>
              
              <div className="group-info-modern">
                <h4 className="group-name-modern">{invite.group.name}</h4>
                <div className="group-meta-row">
                  <span className="member-count">
                    <i className="fas fa-users"></i>
                    {invite.group.memberCount || 1} members
                  </span>
                  <span className="expiry-badge">
                    <i className="fas fa-clock"></i>
                    {formatTimeRemaining(invite.group.expiryDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="invite-content">
              <div className="inviter-section">
                <div className="inviter-avatar-wrapper">
                  {invite.inviter.avatar ? (
                    <img src={invite.inviter.avatar} alt={invite.inviter.fullname} className="inviter-avatar" />
                  ) : (
                    <div className="inviter-avatar-placeholder">
                      {invite.inviter.fullname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="invite-text">
                  <span className="inviter-name">{invite.inviter.fullname}</span>
                  <span className="invite-message">invited you to join this group</span>
                </div>
              </div>

              {invite.group.description && (
                <div className="group-description-modern">
                  <p>"{invite.group.description}"</p>
                </div>
              )}
            </div>

            <div className="modern-invite-actions">
              <button 
                className="modern-btn-decline"
                onClick={() => handleInviteResponse(invite._id, 'reject')}
              >
                <i className="fas fa-times"></i>
                <span>Decline</span>
              </button>
              
              <button 
                className="modern-btn-accept"
                onClick={() => handleInviteResponse(invite._id, 'accept')}
              >
                <i className="fas fa-check"></i>
                <span>Accept</span>
              </button>
            </div>

            <div className="invite-footer">
              <span className="invite-time">
                {new Date(invite.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupInvites;
