import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getDataAPI } from '../../utils/fetchData';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import { useTranslation } from 'react-i18next';

const LeftSidebar = () => {
  const { t } = useTranslation();
  const { auth, homePosts, theme } = useSelector(state => state);

  // Theme colors for light/dark mode
  const themeColors = {
    light: {
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      bgPrimary: '#ffffff',
      bgSecondary: '#f8fafc',
      bgTertiary: '#f1f5f9',
      border: '#e2e8f0',
    },
    dark: {
      textPrimary: '#f8fafc',
      textSecondary: '#e2e8f0',
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      border: '#334155',
    }
  };

  const currentTheme = themeColors[theme] || themeColors.light;
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const mounted = useRef(true);
  const [userStats, setUserStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const [activityStats, setActivityStats] = useState({
    likesReceived: 0,
    commentsReceived: 0,
    sharesReceived: 0,
    profileViews: 0
  });

  const navigationItems = [
    {
      key: 'home',
      label: t('menu.home'),
      icon: 'fas fa-home',
      path: '/',
      color: {
        light: '#3b82f6', // blue-500
        dark: '#60a5fa'   // blue-400
      }
    },
    {
      key: 'profile',
      label: t('menu.profile'),
      icon: 'fas fa-user',
      path: `/profile/${auth.user?._id}`,
      color: {
        light: '#8b5cf6', // purple-500
        dark: '#a78bfa'   // purple-400
      }
    },
    {
      key: 'messages',
      label: t('menu.messages'),
      icon: 'fas fa-envelope',
      path: '/message',
      color: {
        light: '#10b981', // emerald-500
        dark: '#34d399'   // emerald-400
      }
    },
    {
      key: 'explore',
      label: t('menu.explore'),
      icon: 'fas fa-compass',
      path: '/discover',
      color: {
        light: '#f59e0b', // amber-500
        dark: '#fbbf24'   // amber-400
      }
    },
    {
      key: 'settings',
      label: t('menu.settings'),
      icon: 'fas fa-cog',
      path: '/settings',
      color: {
        light: '#6b7280', // gray-500
        dark: '#9ca3af'   // gray-400
      }
    }
  ];

  // Fetch user stats and activity data
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

    const fetchActivityStats = async () => {
      if (auth.user && auth.token) {
        try {
          // Calculate activity stats from user's posts
          const userPosts = homePosts.posts?.filter(post => post.user._id === auth.user._id) || [];

          const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
          const totalComments = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
          const totalShares = userPosts.reduce((sum, post) => sum + (post.shares?.length || 0), 0);

          // Simulate profile views (could be fetched from backend)
          const profileViews = Math.floor(totalLikes * 2.5 + totalComments * 3 + auth.user.followers?.length * 10);

          if (mounted.current) {
            setActivityStats({
              likesReceived: totalLikes,
              commentsReceived: totalComments,
              sharesReceived: totalShares,
              profileViews: profileViews
            });
          }
        } catch (error) {
          console.error('Error calculating activity stats:', error);
        }
      }
    };

    fetchUserStats();
    fetchActivityStats();

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

  const handleCreatePost = () => {
    dispatch({ type: GLOBALTYPES.STATUS, payload: true });
  };

  const handleCreateStory = () => {
    dispatch({ type: GLOBALTYPES.STORY, payload: true });
  };

  const handleFindFriends = () => {
    // Navigate to discover page
    window.location.href = '/discover';
  };

  return (
    <div className="left-sidebar" style={{
      '--text-primary': currentTheme.textPrimary,
      '--text-secondary': currentTheme.textSecondary,
      '--bg-primary': currentTheme.bgPrimary,
      '--bg-secondary': currentTheme.bgSecondary,
      '--bg-tertiary': currentTheme.bgTertiary,
      '--border': currentTheme.border,
      color: currentTheme.textPrimary,
      backgroundColor: currentTheme.bgSecondary,
      borderRight: `1px solid ${currentTheme.border}`
    }}>
      {/* Navigation Menu */}
      <div className="sidebar-card">
        <div className="nav-menu">
          {navigationItems.map((item) => {
            const active = isActive(item.path) || (item.path !== '/' && pathname.startsWith(item.path));
            const itemColor = item.color[theme] || item.color.light;

            return (
              <Link
                key={item.key}
                to={item.path}
                className={`nav-menu-item ${active ? 'active' : ''}`}
                style={{
                  '--item-color': active ? '#ffffff' : itemColor,
                  '--item-bg': active ? itemColor : 'transparent',
                  '--item-hover-bg': active ? `${itemColor}dd` : currentTheme.bgTertiary,
                  color: active ? '#ffffff' : itemColor,
                  backgroundColor: active ? itemColor : 'transparent',
                }}
              >
                <div className="nav-menu-icon">
                  <i className={item.icon} style={{ color: active ? '#ffffff' : itemColor }}></i>
                </div>
                <span className="nav-menu-text">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Stats */}
        <div className="user-stats" style={{
          borderTop: `1px solid ${currentTheme.border}`,
          padding: '16px 0',
          marginTop: '16px'
        }}>
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '0 16px'
          }}>
            <div className="stat-item" style={{
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: currentTheme.bgPrimary,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div className="stat-number" style={{
                display: 'block',
                fontWeight: '700',
                fontSize: '1.1rem',
                color: currentTheme.textPrimary,
                marginBottom: '4px'
              }}>{formatNumber(userStats.posts)}</div>
              <div className="stat-label" style={{
                fontSize: '0.8rem',
                color: currentTheme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Posts</div>
            </div>
            <div className="stat-item" style={{
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: currentTheme.bgPrimary,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div className="stat-number" style={{
                display: 'block',
                fontWeight: '700',
                fontSize: '1.1rem',
                color: currentTheme.textPrimary,
                marginBottom: '4px'
              }}>{formatNumber(userStats.followers)}</div>
              <div className="stat-label" style={{
                fontSize: '0.8rem',
                color: currentTheme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Followers</div>
            </div>
            <div className="stat-item" style={{
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: currentTheme.bgPrimary,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div className="stat-number" style={{
                display: 'block',
                fontWeight: '700',
                fontSize: '1.1rem',
                color: currentTheme.textPrimary,
                marginBottom: '4px'
              }}>{formatNumber(userStats.following)}</div>
              <div className="stat-label" style={{
                fontSize: '0.8rem',
                color: currentTheme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="sidebar-card activity-card" style={{
        backgroundColor: currentTheme.bgPrimary,
        borderRadius: '12px',
        padding: '16px',
        margin: '16px 0',
        border: `1px solid ${currentTheme.border}`
      }}>
        <div className="section-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 className="section-title" style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: '600',
            color: currentTheme.textPrimary
          }}>{t('sidebar.yourActivity')}</h3>
          <button
            className="section-action"
            onClick={() => window.location.href = '/activity'}
            style={{
              background: 'none',
              border: 'none',
              color: currentTheme.textSecondary,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.bgTertiary;
              e.currentTarget.style.color = currentTheme.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = currentTheme.textSecondary;
            }}
          >
            <i className="fas fa-chart-line"></i>
          </button>
        </div>
        <div className="activity-summary" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div className="activity-item" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: currentTheme.bgSecondary,
            border: `1px solid ${currentTheme.border}`,
            transition: 'all 0.2s ease'
          }}>
            <div className="activity-icon likes-icon" style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgef(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              color: '#ef4444',
              fontSize: '16px'
            }}>
              <i className="fas fa-heart"></i>
            </div>
            <div className="activity-info" style={{
              flex: 1
            }}>
              <div className="activity-label" style={{
                fontSize: '0.8rem',
                color: currentTheme.textSecondary,
                marginBottom: '2px'
              }}>{t('sidebar.likesReceived')}</div>
              <div className="activity-count" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: currentTheme.textPrimary
              }}>{formatNumber(activityStats.likesReceived || 0)}</div>
            </div>
            {activityStats.likesChange && (
              <div className={`activity-trend ${activityStats.likesChange >= 0 ? 'positive' : 'negative'}`} style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: activityStats.likesChange >= 0 ? '#10b981' : '#ef4444'
              }}>
                <i className={`fas fa-arrow-${activityStats.likesChange >= 0 ? 'up' : 'down'}`} style={{
                  marginRight: '4px'
                }}></i>
                <span>{Math.abs(activityStats.likesChange)}%</span>
              </div>
            )}
          </div>
          <div className="activity-item" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: currentTheme.bgSecondary,
            border: `1px solid ${currentTheme.border}`,
            transition: 'all 0.2s ease'
          }}>
            <div className="activity-icon comments-icon" style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              color: '#10b981',
              fontSize: '16px'
            }}>
              <i className="fas fa-comment"></i>
            </div>
            <div className="activity-info" style={{
              flex: 1
            }}>
              <div className="activity-label" style={{
                fontSize: '0.8rem',
                color: currentTheme.textSecondary,
                marginBottom: '2px'
              }}>{t('sidebar.comments')}</div>
              <div className="activity-count" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: currentTheme.textPrimary
              }}>{formatNumber(activityStats.commentsReceived || 0)}</div>
            </div>
            {activityStats.commentsChange && (
              <div className={`activity-trend ${activityStats.commentsChange >= 0 ? 'positive' : 'negative'}`} style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: activityStats.commentsChange >= 0 ? '#10b981' : '#ef4444'
              }}>
                <i className={`fas fa-arrow-${activityStats.commentsChange >= 0 ? 'up' : 'down'}`} style={{
                  marginRight: '4px'
                }}></i>
                <span>{Math.abs(activityStats.commentsChange)}%</span>
              </div>
            )}
          </div>
          <div className="activity-item" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: currentTheme.bgSecondary,
            border: `1px solid ${currentTheme.border}`,
            transition: 'all 0.2s ease'
          }}>
            <div className="activity-icon views-icon" style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              color: '#6366f1',
              fontSize: '16px'
            }}>
              <i className="fas fa-eye"></i>
            </div>
            <div className="activity-info" style={{
              flex: 1
            }}>
              <div className="activity-label" style={{
                fontSize: '0.8rem',
                color: currentTheme.textSecondary,
                marginBottom: '2px'
              }}>{t('sidebar.profileViews')}</div>
              <div className="activity-count" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: currentTheme.textPrimary
              }}>{formatNumber(activityStats.profileViews || 0)}</div>
            </div>
            {activityStats.viewsChange && (
              <div className={`activity-trend ${activityStats.viewsChange >= 0 ? 'positive' : 'negative'}`} style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: activityStats.viewsChange >= 0 ? '#10b981' : '#ef4444'
              }}>
                <i className={`fas fa-arrow-${activityStats.viewsChange >= 0 ? 'up' : 'down'}`} style={{
                  marginRight: '4px'
                }}></i>
                <span>{Math.abs(activityStats.viewsChange)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="sidebar-card" style={{
        backgroundColor: currentTheme.bgPrimary,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${currentTheme.border}`
      }}>
        <div className="quick-actions" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '8px'
        }}>
          <button
            className="quick-action-btn primary"
            onClick={handleCreatePost}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            <i className="fas fa-plus" style={{
              marginRight: '8px'
            }}></i>
            <span>New Post</span>
          </button>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <button
              className="quick-action-btn story"
              onClick={handleCreateStory}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${currentTheme.border}`,
                backgroundColor: currentTheme.bgSecondary,
                color: currentTheme.textPrimary,
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.bgTertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.bgSecondary;
              }}
            >
              <i className="fas fa-camera" style={{
                marginRight: '6px',
                color: '#f59e0b'
              }}></i>
              <span>Story</span>
            </button>

            <button
              className="quick-action-btn secondary"
              onClick={handleFindFriends}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${currentTheme.border}`,
                backgroundColor: currentTheme.bgSecondary,
                color: currentTheme.textPrimary,
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.bgTertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.bgSecondary;
              }}
            >
              <i className="fas fa-user-plus" style={{
                marginRight: '6px',
                color: '#8b5cf6'
              }}></i>
              <span>Friends</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
