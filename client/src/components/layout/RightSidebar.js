import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Avatar from '../Avatar';
import { follow, unfollow } from '../../redux/actions/profileAction';
import { getDataAPI } from '../../utils/fetchData';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import ActivityModal from '../modals/ActivityModal';

const RightSidebar = () => {
  const [modalContent, setModalContent] = useState(null);
  const { auth, suggestions, socket, online = { users: [] }, homePosts } = useSelector(state => state);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mounted = useRef(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [topFollowers, setTopFollowers] = useState([]);
  const [recommendedGroups, setRecommendedGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Initialize following state based on auth.user.following
  useEffect(() => {
    if (auth.user && auth.user.following) {
      setFollowingUsers(new Set(auth.user.following));
    }
  }, [auth.user]);

  // Random last seen generator
  const getRandomLastSeen = () => {
    const options = ['2m ago', '5m ago', '1h ago', '3h ago', 'yesterday'];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Fetch top 5 followers with their real online status
  useEffect(() => {
    const fetchTopFollowers = async () => {
      if (auth.user && auth.user.followers && auth.token) {
        try {
          // Get top 5 followers
          const followerIds = auth.user.followers.slice(0, 5);
          if (followerIds.length > 0) {
            const promises = followerIds.map(id =>
              getDataAPI(`user/${typeof id === 'object' ? id._id : id}`, auth.token).catch(() => null)
            );
            const results = await Promise.all(promises);
            const validFollowers = results
              .filter(result => result && result.data && result.data.user)
              .map(result => ({
                ...result.data.user,
                isOnline: online.users.includes(result.data.user._id), // Real online status
                lastSeen: getRandomLastSeen()
              }));
            if (mounted.current) {
              setTopFollowers(validFollowers);
            }
          }
        } catch (error) {
          console.error('Error fetching top followers:', error);
        }
      }
    };

    fetchTopFollowers();

    // Cleanup function
    return () => {
      mounted.current = false;
    };
  }, [auth.user, auth.token, online.users]);

  const handleFollow = (user) => {
    if (followingUsers.has(user._id)) {
      if (mounted.current) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(user._id);
          return newSet;
        });
      }
      dispatch(unfollow({ users: suggestions.users, user, auth, socket }));
    } else {
      if (mounted.current) {
        setFollowingUsers(prev => new Set(prev).add(user._id));
      }
      dispatch(follow({ users: suggestions.users, user, auth, socket }));
    }
  };

  // Get random 5 users from suggestions
  const getRandomUsers = (users, count) => {
    if (!users || users.length === 0) return [];
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  // Get suggested users or show empty state
  const suggestedUsers = React.useMemo(() => {
    const users = suggestions.users || [];
    return getRandomUsers(users, 5);
  }, [suggestions.users]);

  // Fetch recommended groups
  useEffect(() => {
    const fetchRecommendedGroups = async () => {
      try {
        setLoadingGroups(true);
        const res = await getDataAPI('group/recommended?limit=5', auth.token);
        if (mounted.current) {
          setRecommendedGroups(res.data.groups || []);
        }
      } catch (err) {
        console.error('Failed to load recommended groups:', err.message);
      } finally {
        if (mounted.current) {
          setLoadingGroups(false);
        }
      }
    };

    if (auth.token) {
      fetchRecommendedGroups();
    }

    return () => {
      mounted.current = false;
    };
  }, [auth.token, dispatch]);


  // Show message if no followers
  // Show message if no followers
  const displayFollowers = topFollowers.length > 0 ? topFollowers : [
    { fullname: 'No followers yet', username: 'empty', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', isOnline: false, lastSeen: 'not active' }
  ];

  const handleOpenModal = (type) => {
    setModalContent(type);
  };

  const handleCloseModal = () => {
    setModalContent(null);
  };

  // Removed unused calculateEngagementRate to satisfy linter


  return (
    <div className="right-sidebar">
      {/* People to Follow */}
      <div className="sidebar-card">
        <div className="suggestions-header">
          <h3 className="suggestions-title" style={{ color: 'var(--text-primary)' }}>{t('sidebar.peopleToFollow')}</h3>
          <Link to="/discover" className="see-all-link">
            {t('sidebar.seeAll')}
          </Link>
        </div>
        <div className="suggestions-list">
          {suggestedUsers.length === 0 ? (
            <div className="no-suggestions">
              <div className="no-suggestions-icon">
                <i className="fas fa-user-friends"></i>
              </div>
              <p className="no-suggestions-text">No people to follow</p>
              <p className="no-suggestions-hint">When you follow people, they'll appear here</p>
            </div>
          ) : (
            suggestedUsers.map((user) => (
              <div key={user._id} className="suggestion-item">
                <Link to={`/profile/${user._id}`} className="suggestion-link">
                  <div className="suggestion-avatar-container">
                    <Avatar src={user.avatar} size="medium" />
                    {online.users.includes(user._id) && (
                      <span className="online-status"></span>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <span className="suggestion-name">
                      {user.fullname || user.name || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || t('sidebar.user')}
                    </span>
                  </div>
                </Link>
                <button
                  className={`follow-btn ${followingUsers.has(user._id) ? 'following' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFollow(user);
                  }}
                  aria-label={followingUsers.has(user._id) ? `Unfollow ${user.username}` : `Follow ${user.username}`}
                >
                  {followingUsers.has(user._id) ? (
                    <>
                      <i className="fas fa-user-check"></i> Following
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i> Follow
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Active Friends */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title" style={{ color: 'var(--text-primary)' }}>{t('sidebar.activeNow')}</h3>
          <span className="active-count">{topFollowers.filter(f => f.isOnline).length} {t('sidebar.online')}</span>
        </div>
        <div className="active-friends">
          {displayFollowers.map((friend, index) => (
            <div key={index} className="friend-item">
              <div className="friend-avatar-wrapper">
                <Avatar src={friend.avatar} size="small-avatar" />
                <div className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}></div>
              </div>
              <div className="friend-info">
                <span className="friend-name" style={{ color: 'var(--text-primary)' }}>
                  {friend.fullname || friend.name || friend.username || `${friend.firstName || ''} ${friend.lastName || ''}`.trim() || 'User'}
                </span>
                <span className="friend-status">{friend.isOnline ? t('sidebar.activeNow') : friend.lastSeen}</span>
              </div>
              <button className="message-btn">
                <i className="fas fa-comment"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Groups */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title" style={{ color: 'var(--text-primary)' }}>{t('sidebar.recommendedGroups')}</h3>
          <Link to="/groups" className="see-all-link">
            {t('sidebar.seeAll')}
          </Link>
        </div>
        {loadingGroups ? (
          <div className="loading-groups">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="group-item-skeleton">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-info">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line-sm"></div>
                </div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </div>
        ) : recommendedGroups.length > 0 ? (
          <div className="recommended-groups">
            {recommendedGroups.map((group) => (
              <div key={group._id} className="group-item">
                <Link to={`/group/${group._id}`} className="group-image">
                  <img 
                    src={group.avatar || 'https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png'} 
                    alt={group.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png';
                    }}
                  />
                </Link>
                <div className="group-info">
                  <Link to={`/group/${group._id}`} className="group-name">
                    {group.name}
                  </Link>
                  <div className="group-meta">
                    <span className="members-count">
                      <i className="fas fa-users"></i> {group.memberCount || 0} {t('sidebar.members')}
                    </span>
                    {group.category && (
                      <span className="group-category">
                        <i className="fas fa-tag"></i> {group.category}
                      </span>
                    )}
                  </div>
                  {group.creatorName && (
                    <div className="group-creator">
                      <i className="fas fa-user"></i> Created by {group.creatorName}
                    </div>
                  )}
                </div>
                <button className="join-group-btn" onClick={(e) => {
                  e.preventDefault();
                  // Handle join group action
                  dispatch({ 
                    type: GLOBALTYPES.ALERT, 
                    payload: { info: `Request to join ${group.name} sent` } 
                  });
                }}>
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-groups">
            <div className="no-groups-icon">
              <i className="fas fa-users"></i>
            </div>
            <p className="no-groups-text">No groups to recommend</p>
            <p className="no-groups-hint">Join some groups to get better recommendations</p>
            <Link to="/groups/explore" className="explore-groups-btn">
              Explore Groups
            </Link>
          </div>
        )}
      </div>

      {modalContent && (
        <ActivityModal
          isOpen={!!modalContent}
          onClose={handleCloseModal}
          type={modalContent}
          count={0}
        />
      )}

      <div className="sidebar-footer">
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/help">Help</Link>
        </div>
        <div className="footer-copyright">
          <span> 2024 MESME. All rights reserved.</span>
          <span>© 2024 MESME. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
