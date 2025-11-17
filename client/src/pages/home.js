import React, { useState } from "react";
import { useTranslation } from 'react-i18next';

import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import Posts from "../components/home/Posts";
import Status from "../components/home/Status";
import StoryBar from "../components/story/StoryBar";
import LeftSidebar from "../components/layout/LeftSidebar";
import RightSidebar from "../components/layout/RightSidebar";
import { GLOBALTYPES } from "../redux/actions/globalTypes";

import LoadIcon from "../images/loading.gif";

const Home = () => {
  const { homePosts, auth } = useSelector((state) => state);
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const [showStatus, setShowStatus] = useState(true);

  const handleCloseStatus = () => {
    setShowStatus(false);
  };

  const handleFabClick = () => {
    dispatch({ type: GLOBALTYPES.STATUS, payload: true });
  };

  const mobileNavItems = [
    { label: t('nav.home'), icon: 'fas fa-home', path: '/' },
    { label: t('nav.explore'), icon: 'fas fa-compass', path: '/discover' },
    { label: t('nav.messages'), icon: 'fas fa-envelope', path: '/message' },
    { label: t('nav.profile'), icon: 'fas fa-user', path: `/profile/${auth.user?._id}` },
  ];

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <>
      <div className="main-layout">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Center Feed */}
        <div className="center-feed">
          {/* Stories Section */}
          <div className="feed-card">
            <div className="stories-section">
              <div className="stories-header">
                <h3 className="stories-title" style={{ color: 'var(--text-primary)' }}>{t('home.storiesTitle')}</h3>
                <button
                  className="stories-add-btn"
                  onClick={() => dispatch({ type: GLOBALTYPES.STORY, payload: true })}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <StoryBar />
            </div>
          </div>

          {/* Post Creation Section */}
          {showStatus && (
            <div className="feed-card">
              <div className="post-composer">
                <Status onClose={handleCloseStatus} />
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {homePosts.loading ? (
            <div className="feed-card">
              <div className="loading-container">
                <div className="loading-spinner">
                  <img src={LoadIcon} alt="loading" className="loading-icon" />
                  <p className="loading-text" style={{ color: 'var(--text-secondary)' }}>{t('home.loadingText')}</p>
                </div>
              </div>
            </div>
          ) : homePosts.result === 0 ? (
            <div className="feed-card">
              <div className="empty-feed">
                <div className="empty-icon">🚀</div>
                <h3 className="empty-title" style={{ color: 'var(--text-primary)' }}>{t('home.emptyTitle')}</h3>
                <p className="empty-subtitle" style={{ color: 'var(--text-tertiary)' }}>{t('home.emptySubtitle')}</p>
              </div>
            </div>
          ) : (
            <Posts />
          )}
        </div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <div className="mobile-nav-items">
          {mobileNavItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <i className={`mobile-nav-icon ${item.icon}`}></i>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fab-container">
        <button className="fab-button" onClick={handleFabClick} title={t('home.createPost')}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </>
  );
};

export default Home;