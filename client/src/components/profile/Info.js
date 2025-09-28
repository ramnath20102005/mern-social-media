import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../Avatar';
import EditProfile from './EditProfile';
import FollowBtn from '../FollowBtn';
import Following from './Following';
import Followers from './Followers';
import ChangePassword from './ChangePassword';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';

const Info = ({id, auth, profile, dispatch}) => {
    const [userData, setUserData] = useState([]);
    const [onEdit, setOnEdit] = useState(false);
    const [changePassword, setChangePassword] = useState(false);

    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

    useEffect(() => {
      if (id === auth.user._id) {
          setUserData([auth.user]);
      }else{
        const newData = profile.users.filter(user => user._id === id);
        setUserData(newData);
      }
    }, [id, auth, dispatch, profile.users]);

    useEffect(() => {
      if (showFollowers || showFollowing || onEdit) {
        dispatch({ type: GLOBALTYPES.MODAL, payload: true });
      } else {
        dispatch({ type: GLOBALTYPES.MODAL, payload: false });
      }
    }, [showFollowers, showFollowing, onEdit, dispatch]);

    return (
      <div className="modern-profile-info">
        {userData.map((user) => (
          <div key={user._id} className="profile-info-container">
            {/* Profile Cover Background */}
            <div className="profile-cover-bg"></div>
            
            {/* Main Profile Content */}
            <div className="profile-main-content">
              {/* Avatar Section */}
              <div className="modern-avatar-section">
                <div className="avatar-container-modern">
                  <div className="avatar-ring-gradient">
                    <Avatar src={user.avatar} size="profile-avatar" />
                  </div>
                  <div className="avatar-status-dot"></div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="profile-details-section">
                {/* Header Row */}
                <div className="profile-header-modern">
                  <div className="profile-name-section">
                    <h1 className="modern-username">{user.username}</h1>
                    <h2 className="modern-fullname">{user.fullname}</h2>
                  </div>
                  
                  <div className="profile-actions-modern">
                    {user._id === auth.user._id ? (
                      <div className="owner-actions">
                        <button
                          className="modern-btn edit-profile-btn"
                          onClick={() => setOnEdit(true)}
                        >
                          <i className="fas fa-edit"></i>
                          <span>Edit Profile</span>
                        </button>
                        <button
                          className="modern-btn settings-btn"
                          onClick={() => setChangePassword(true)}
                        >
                          <i className="fas fa-cog"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="visitor-actions">
                        <FollowBtn user={user} />
                        <Link to={`/message/${user._id}`} className="modern-btn message-btn">
                          <i className="fas fa-paper-plane"></i>
                          <span>Message</span>
                        </Link>
                        <button className="modern-btn more-btn">
                          <i className="fas fa-ellipsis-h"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Section */}
                <div className="modern-stats-section">
                  <div className="stats-container">
                    <div className="stat-card">
                      <div className="stat-number">{user.posts?.length || 0}</div>
                      <div className="stat-label">Posts</div>
                    </div>
                    <div 
                      className="stat-card clickable" 
                      onClick={() => setShowFollowers(true)}
                    >
                      <div className="stat-number">{user.followers.length}</div>
                      <div className="stat-label">Followers</div>
                    </div>
                    <div 
                      className="stat-card clickable" 
                      onClick={() => setShowFollowing(true)}
                    >
                      <div className="stat-number">{user.following.length}</div>
                      <div className="stat-label">Following</div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="modern-bio-section">
                  {user.story && (
                    <div className="bio-text">
                      <p>{user.story}</p>
                    </div>
                  )}
                  
                  <div className="profile-details-grid">
                    {user.website && (
                      <div className="detail-item">
                        <i className="fas fa-link"></i>
                        <a 
                          href={user.website} 
                          target="_blank" 
                          rel="noreferrer"
                          className="detail-link"
                        >
                          {user.website}
                        </a>
                      </div>
                    )}
                    {user.address && (
                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{user.address}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="detail-item">
                        <i className="fas fa-envelope"></i>
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.mobile && (
                      <div className="detail-item">
                        <i className="fas fa-phone"></i>
                        <span>{user.mobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modals */}
            {onEdit && <EditProfile setOnEdit={setOnEdit} />}
            {changePassword && <ChangePassword setChangePassword={setChangePassword} />}

            {showFollowers && (
              <Followers
                users={user.followers}
                setShowFollowers={setShowFollowers}
              />
            )}
            {showFollowing && (
              <Following
                users={user.following}
                setShowFollowing={setShowFollowing}
              />
            )}
          </div>
        ))}
      </div>
    );
}

export default Info
