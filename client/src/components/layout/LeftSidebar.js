import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Avatar from '../Avatar';

const LeftSidebar = () => {
  const { auth } = useSelector(state => state);
  const { pathname } = useLocation();

  const navigationItems = [
    { label: 'Home', icon: 'fas fa-home', path: '/', color: '#3b82f6' },
    { label: 'Profile', icon: 'fas fa-user', path: `/profile/${auth.user?._id}`, color: '#8b5cf6' },
    { label: 'Messages', icon: 'fas fa-envelope', path: '/message', color: '#10b981' },
    { label: 'Explore', icon: 'fas fa-compass', path: '/discover', color: '#f59e0b' },
    { label: 'Bookmarks', icon: 'fas fa-bookmark', path: '/saved', color: '#ef4444' },
    { label: 'Settings', icon: 'fas fa-cog', path: '/settings', color: '#6b7280' },
  ];

  const trendingTopics = [
    { tag: '#ReactJS', posts: '12.5K posts' },
    { tag: '#WebDevelopment', posts: '8.2K posts' },
    { tag: '#JavaScript', posts: '15.7K posts' },
    { tag: '#TechNews', posts: '6.1K posts' },
    { tag: '#Programming', posts: '9.8K posts' },
  ];

  const recentlyVisited = [
    { name: 'John Doe', username: 'johndoe', avatar: '/api/placeholder/32/32' },
    { name: 'Jane Smith', username: 'janesmith', avatar: '/api/placeholder/32/32' },
    { name: 'Mike Johnson', username: 'mikej', avatar: '/api/placeholder/32/32' },
  ];

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="left-sidebar">
      {/* Navigation Menu */}
      <div className="sidebar-card">
        <div className="nav-menu">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <div className="nav-menu-icon" style={{ color: item.color }}>
                <i className={item.icon}></i>
              </div>
              <span className="nav-menu-text">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Stats */}
        <div className="user-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">127</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1.2K</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">892</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title">Trending</h3>
          <button className="section-action">
            <i className="fas fa-fire"></i>
          </button>
        </div>
        <div className="trending-list">
          {trendingTopics.map((topic, index) => (
            <div key={index} className="trending-item">
              <div className="trending-content">
                <span className="trending-tag">{topic.tag}</span>
                <span className="trending-count">{topic.posts}</span>
              </div>
              <div className="trending-chart">
                <i className="fas fa-chart-line"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Visited */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title">Recent</h3>
          <button className="section-action">
            <i className="fas fa-history"></i>
          </button>
        </div>
        <div className="recent-list">
          {recentlyVisited.map((user, index) => (
            <Link key={index} to={`/profile/${user.username}`} className="recent-item">
              <Avatar src={user.avatar} size="small-avatar" />
              <div className="recent-info">
                <span className="recent-name">{user.name}</span>
                <span className="recent-username">@{user.username}</span>
              </div>
              <div className="recent-status">
                <div className="status-dot online"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="sidebar-card">
        <div className="quick-actions">
          <button className="quick-action-btn primary">
            <i className="fas fa-plus"></i>
            <span>New Post</span>
          </button>
          <button className="quick-action-btn secondary">
            <i className="fas fa-users"></i>
            <span>Find Friends</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
