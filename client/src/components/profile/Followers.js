import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "../Avatar";
import FollowBtn from "../FollowBtn";
import "../../styles/followers-following-modal.css";

const Followers = ({ users, setShowFollowers }) => {
  const { auth } = useSelector((state) => state);

  const handleClose = () => {
    setShowFollowers(false);
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
              <i className="fas fa-users modal-icon"></i>
              Followers
            </h2>
            <span className="modal-count">{users.length} {users.length === 1 ? 'follower' : 'followers'}</span>
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
                <i className="fas fa-user-friends"></i>
              </div>
              <h3 className="empty-title">No followers yet</h3>
              <p className="empty-subtitle">When people follow this account, they'll appear here.</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user._id} className="modern-user-item">
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={handleClose}
                    className="d-flex align-items-center"
                    style={{ flex: 1, textDecoration: "none", color: "inherit" }}
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="user-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div className="user-info">
                      <h4 className="user-name">{user.fullname || user.username}</h4>
                      <p className="user-username">@{user.username}</p>
                    </div>
                  </Link>
                  {auth.user._id !== user._id && (
                    <div className="follow-btn-container">
                      <FollowBtn user={user} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Followers;
