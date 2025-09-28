import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Info from '../../components/profile/Info';
import Posts from '../../components/profile/Posts';
import { useSelector, useDispatch } from "react-redux";
import LoadIcon  from "../../images/loading.gif";
import { getProfileUsers } from "../../redux/actions/profileAction";
import Saved from '../../components/profile/Saved';

const Profile = () => {
  const { profile, auth } = useSelector(state => state);
  const dispatch = useDispatch();

  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if(profile.ids.every(item => item !== id )){
      dispatch(getProfileUsers({ id, auth }));
    }
  }, [id, auth, dispatch, profile.ids]);

  return (
    <div className="instagram-profile-container">
      {/* Profile Header */}
      <div className="instagram-profile-header">
        <Info auth={auth} profile={profile} dispatch={dispatch} id={id} />
      </div>

      {/* Profile Navigation Tabs */}
      <div className="instagram-profile-tabs">
        <div className="profile-tabs-container">
          <button
            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <i className="fas fa-th"></i>
            <span>POSTS</span>
          </button>
          
          <button
            className={`profile-tab ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => setActiveTab('reels')}
          >
            <i className="fas fa-play-circle"></i>
            <span>REELS</span>
          </button>
          
          <button
            className={`profile-tab ${activeTab === 'tagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('tagged')}
          >
            <i className="fas fa-user-tag"></i>
            <span>TAGGED</span>
          </button>
          
          {auth.user._id === id && (
            <button
              className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <i className="fas fa-bookmark"></i>
              <span>SAVED</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="instagram-profile-content">
        {profile.loading ? (
          <div className="instagram-profile-loading">
            <div className="loading-container-modern">
              <div className="instagram-loading-spinner">
                <div className="spinner-gradient"></div>
              </div>
              <h3>Loading Profile</h3>
              <p>Fetching amazing content...</p>
            </div>
          </div>
        ) : (
          <div className="instagram-profile-grid">
            {activeTab === 'posts' && (
              <Posts auth={auth} profile={profile} dispatch={dispatch} id={id} />
            )}
            {activeTab === 'reels' && (
              <div className="coming-soon-section">
                <div className="coming-soon-content">
                  <i className="fas fa-play-circle"></i>
                  <h3>Reels Coming Soon</h3>
                  <p>This feature is under development</p>
                </div>
              </div>
            )}
            {activeTab === 'tagged' && (
              <div className="coming-soon-section">
                <div className="coming-soon-content">
                  <i className="fas fa-user-tag"></i>
                  <h3>Tagged Posts</h3>
                  <p>No tagged posts yet</p>
                </div>
              </div>
            )}
            {activeTab === 'saved' && (
              <Saved auth={auth} dispatch={dispatch} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
