import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "../Avatar";
import FollowBtn from "../FollowBtn";

const Following = ({ users, setShowFollowing }) => {
  const { auth } = useSelector((state) => state);

  const handleClose = () => {
    setShowFollowing(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modern-modal-overlay" onClick={handleBackdropClick}>
      <div className="modern-modal-container">
        {/* Header */}
        <div className="modern-modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">
              <i className="fas fa-user-plus modal-icon"></i>
              Following
            </h2>
            <span className="modal-count">{users.length} {users.length === 1 ? 'person' : 'people'}</span>
          </div>
          <button className="modern-close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="modern-modal-content">
          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <h3 className="empty-title">Not following anyone yet</h3>
              <p className="empty-subtitle">When you follow people, they'll appear here.</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user._id} className="modern-user-item">
                  <Link 
                    to={`/profile/${user._id}`} 
                    className="user-link"
                    onClick={handleClose}
                  >
                    <div className="user-avatar-container">
                      <Avatar src={user.avatar} size="medium-avatar" />
                      <div className="user-status-indicator online"></div>
                    </div>
                    <div className="user-info">
                      <h4 className="user-fullname">{user.fullname}</h4>
                      <p className="user-username">@{user.username}</p>
                      <div className="user-stats">
                        <span className="stat-item">
                          <i className="fas fa-users"></i>
                          {user.followers?.length || 0} followers
                        </span>
                        <span className="stat-divider">•</span>
                        <span className="stat-item">
                          {user.following?.length || 0} following
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="user-actions">
                    {auth.user._id !== user._id && (
                      <div className="follow-btn-container">
                        <FollowBtn user={user} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Following;
