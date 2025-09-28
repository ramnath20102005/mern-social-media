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
      <div className="group-invites-empty">
        <div className="empty-icon">
          <i className="fas fa-envelope"></i>
        </div>
        <h3>No Group Invites</h3>
        <p>You don't have any pending group invitations.</p>
      </div>
    );
  }

  return (
    <div className="group-invites-container">
      <div className="invites-header">
        <h2>Group Invitations</h2>
        <span className="invite-count">{groups.invites.length} pending</span>
      </div>

      <div className="invites-list">
        {groups.invites.map(invite => (
          <div key={invite._id} className="invite-card">
            <div className="invite-header">
              <div className="group-info">
                <Avatar src={invite.group.avatar} size="medium-avatar" />
                <div className="group-details">
                  <h4 className="group-name">{invite.group.name}</h4>
                  {invite.group.description && (
                    <p className="group-description">{invite.group.description}</p>
                  )}
                </div>
              </div>
              
              <div className="invite-meta">
                <div className="expiry-info">
                  <i className="fas fa-clock"></i>
                  <span>{formatTimeRemaining(invite.group.expiryDate)}</span>
                </div>
              </div>
            </div>

            <div className="invite-body">
              <div className="inviter-info">
                <Avatar src={invite.inviter.avatar} size="small-avatar" />
                <div className="inviter-details">
                  <span className="inviter-name">{invite.inviter.fullname}</span>
                  <span className="invite-message">
                    {invite.message || `invited you to join "${invite.group.name}"`}
                  </span>
                </div>
              </div>

              <div className="group-stats">
                <div className="stat-item">
                  <i className="fas fa-users"></i>
                  <span>{invite.group.creator.fullname} (Creator)</span>
                </div>
                <div className="stat-item">
                  <i className="fas fa-calendar"></i>
                  <span>Expires {formatTimeRemaining(invite.group.expiryDate)}</span>
                </div>
              </div>
            </div>

            <div className="invite-actions">
              <button 
                className="btn-decline"
                onClick={() => handleInviteResponse(invite._id, 'reject')}
              >
                <i className="fas fa-times"></i>
                Decline
              </button>
              
              <button 
                className="btn-accept"
                onClick={() => handleInviteResponse(invite._id, 'accept')}
              >
                <i className="fas fa-check"></i>
                Accept
              </button>
            </div>

            <div className="invite-timestamp">
              <span>Invited {new Date(invite.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupInvites;
