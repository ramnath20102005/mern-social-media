import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getDataAPI } from '../../utils/fetchData';

const LeftSidebar = () => {
  const { auth, homePosts } = useSelector(state => state);
  const { pathname } = useLocation();
  const mounted = useRef(true);
  const [userStats, setUserStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });

  const navigationItems = [
    { label: 'Home', icon: 'fas fa-home', path: '/', color: '#3b82f6' },
    { label: 'Profile', icon: 'fas fa-user', path: `/profile/${auth.user?._id}`, color: '#8b5cf6' },
    { label: 'Messages', icon: 'fas fa-envelope', path: '/message', color: '#10b981' },
    { label: 'Explore', icon: 'fas fa-compass', path: '/discover', color: '#f59e0b' },
    { label: 'Bookmarks', icon: 'fas fa-bookmark', path: '/saved', color: '#ef4444' },
    { label: 'Settings', icon: 'fas fa-cog', path: '/settings', color: '#6b7280' },
  ];

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (auth.user && auth.token) {
        try {
          // Get user profile data
          const res = await getDataAPI(`user/${auth.user._id}`, auth.token);
          if (res.data.user && mounted.current) {
            setUserStats({
              posts: res.data.user.postCount || res.data.user.posts?.length || 0,
              followers: res.data.user.followers?.length || 0,
              following: res.data.user.following?.length || 0
            });
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
          // Fallback to auth user data
          if (mounted.current) {
            setUserStats({
              posts: homePosts.posts?.filter(post => post.user._id === auth.user._id).length || 0,
              followers: auth.user.followers?.length || 0,
              following: auth.user.following?.length || 0
            });
          }
        }
      }
    };

    fetchUserStats();
    
    // Cleanup function
    return () => {
      mounted.current = false;
    };
  }, [auth.user, auth.token, homePosts.posts]);

  // Update stats when auth user changes (after follow/unfollow)
  useEffect(() => {
    if (auth.user) {
      setUserStats(prevStats => ({
        ...prevStats,
        followers: auth.user.followers?.length || 0,
        following: auth.user.following?.length || 0
      }));
    }
  }, [auth.user]);

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
              <span className="stat-number">{formatNumber(userStats.posts)}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{formatNumber(userStats.followers)}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{formatNumber(userStats.following)}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title">Your Activity</h3>
          <button className="section-action">
            <i className="fas fa-chart-bar"></i>
          </button>
        </div>
        <div className="activity-summary">
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-heart" style={{ color: '#e91e63' }}></i>
            </div>
            <div className="activity-info">
              <span className="activity-label">Likes received</span>
              <span className="activity-count">This week</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-comment" style={{ color: '#2196f3' }}></i>
            </div>
            <div className="activity-info">
              <span className="activity-label">Comments</span>
              <span className="activity-count">This week</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-share" style={{ color: '#4caf50' }}></i>
            </div>
            <div className="activity-info">
              <span className="activity-label">Shares</span>
              <span className="activity-count">This week</span>
            </div>
          </div>
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
