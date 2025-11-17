import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Avatar from '../Avatar';
import { follow, unfollow } from '../../redux/actions/profileAction';
import { getDataAPI } from '../../utils/fetchData';
import ActivityModal from '../modals/ActivityModal';

const RightSidebar = () => {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [modalContent, setModalContent] = useState(null); // Can be 'likes' or 'comments'
  const { auth, suggestions, socket, online = { users: [] }, homePosts } = useSelector(state => state);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mounted = useRef(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [topFollowers, setTopFollowers] = useState([]);

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

  const suggestedUsers = suggestions.users?.slice(0, 5) || [
    { _id: '1', fullname: 'Sarah Wilson', username: 'sarahw', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', followers: ['1', '2'] },
    { _id: '3', fullname: 'Emma Davis', username: 'emmad', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', followers: ['2', '3'] },
    { _id: '4', fullname: 'Alex Johnson', username: 'alexj', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', followers: ['1', '2', '3'] },
    { _id: '5', fullname: 'Lisa Brown', username: 'lisab', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', followers: ['2'] },
  ];


  // Show message if no followers
  const displayFollowers = topFollowers.length > 0 ? topFollowers : [
    { fullname: 'No followers yet', username: 'empty', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', isOnline: false, lastSeen: 'not active' }
  ];

  const recommendedGroups = [
    { name: 'React Developers', members: '12.5K', category: 'Technology', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=80&fit=crop' },
    { name: 'UI/UX Designers', members: '8.2K', category: 'Design', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=80&h=80&fit=crop' },
    { name: 'Startup Founders', members: '15.7K', category: 'Business', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
  ];

  // Calculate dynamic stats
  const calculateTotalComments = useCallback(() => {
    if (!homePosts.posts || !auth.user) return 0;
    const userPosts = homePosts.posts.filter(post => post.user._id === auth.user._id);
    return userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
  }, [homePosts.posts, auth.user]);

  const calculateTotalLikes = useCallback(() => {
    if (!homePosts.posts || !auth.user) return 0;
    const userPosts = homePosts.posts.filter(post => post.user._id === auth.user._id);
    return userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  }, [homePosts.posts, auth.user]);

  const calculateProfileViews = useCallback(() => {
    const totalLikes = calculateTotalLikes();
    const followerCount = auth.user?.followers?.length || 0;
    return Math.floor(totalLikes * 1.5 + followerCount * 10 + Math.random() * 200);
  }, [calculateTotalLikes, auth.user]);

  useEffect(() => {
    if (auth.user) {
      setLikes(calculateTotalLikes());
      setComments(calculateTotalComments());
      setProfileViews(calculateProfileViews());
    }
  }, [auth.user, calculateTotalLikes, calculateTotalComments, calculateProfileViews]);

  useEffect(() => {
    if (socket) {
      const handleLikeUpdate = () => setLikes(calculateTotalLikes());
      const handleCommentUpdate = () => setComments(calculateTotalComments());

      socket.on('likePost', handleLikeUpdate);
      socket.on('unLikePost', handleLikeUpdate);
      socket.on('createComment', handleCommentUpdate);

      return () => {
        socket.off('likePost', handleLikeUpdate);
        socket.off('unLikePost', handleLikeUpdate);
        socket.off('createComment', handleCommentUpdate);
      };
    }
  }, [socket, calculateTotalLikes, calculateTotalComments]);

  const handleOpenModal = (type) => {
    setModalContent(type);
  };

  const handleCloseModal = () => {
    setModalContent(null);
  };

  // Removed unused calculateEngagementRate to satisfy linter

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
          {suggestedUsers.map((user) => (
            <div key={user._id} className="suggestion-item">
              <Link to={`/profile/${user._id}`} className="suggestion-link">
                <div className="suggestion-avatar-container">
                  <img
                    src={user.avatar}
                    alt={user.fullname || user.username}
                    className="suggestion-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://ui-avatars.com/api/?name=' + (user.fullname || user.username || 'User') + '&background=random';
                    }}
                  />
                </div>
                <div className="suggestion-info">
                  <span className="suggestion-name">
                    {user.fullname || user.name || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || t('sidebar.user')}
                  </span>
                  <span className="suggestion-username">
                    @{user.username || 'user' + user._id.slice(0, 5)}
                  </span>
                </div>
              </Link>
              <button
                className={`follow-button ${followingUsers.has(user._id) ? 'following' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFollow(user);
                }}
              >
                {followingUsers.has(user._id) ? (
                  <>
                    <i className="fas fa-check"></i>
                    <span>{t('sidebar.following')}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    <span>{t('sidebar.follow')}</span>
                  </>
                )}
              </button>
            </div>
          ))}
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
        <div className="recommended-groups">
          {recommendedGroups.map((group, index) => (
            <div key={index} className="group-item">
              <div className="group-image">
                <img src={group.image} alt={group.name} />
              </div>
              <div className="group-info">
                <span className="group-name">{group.name}</span>
                <span className="group-meta">{group.members} {t('sidebar.members')} • {group.category}</span>
              </div>
              <button className="join-group-btn">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Your Activity */}
      <div className="sidebar-card stats-card">
        <div className="section-header">
          <h3 className="section-title" style={{ color: 'var(--text-primary)' }}>{t('sidebar.yourActivity')}</h3>
          <button className="section-action"><i className="fas fa-chart-line"></i></button>
        </div>
        <div className="activity-stats">
          <div className="stat-item" onClick={() => handleOpenModal('likes')}>
            <div className="stat-icon likes-icon"><i className="fas fa-heart"></i></div>
            <div className="stat-info">
              <span className="stat-label">{t('sidebar.likesReceived')}</span>
              <span className="stat-value">{formatNumber(likes)}</span>
            </div>
            <div className="stat-trend up"><i className="fas fa-arrow-up"></i> +12%</div>
          </div>
          <div className="stat-item" onClick={() => handleOpenModal('comments')}>
            <div className="stat-icon comments-icon"><i className="fas fa-comment"></i></div>
            <div className="stat-info">
              <span className="stat-label">{t('sidebar.comments')}</span>
              <span className="stat-value">{formatNumber(comments)}</span>
            </div>
            <div className="stat-trend up"><i className="fas fa-arrow-up"></i> +8%</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon views-icon"><i className="fas fa-eye"></i></div>
            <div className="stat-info">
              <span className="stat-label">{t('sidebar.profileViews')}</span>
              <span className="stat-value">{formatNumber(profileViews)}</span>
            </div>
            <div className="stat-trend up"><i className="fas fa-arrow-up"></i> +15%</div>
          </div>
        </div>
      </div>

      {modalContent && (
        <ActivityModal type={modalContent} onClose={handleCloseModal} />
      )}

      <div className="sidebar-footer">
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/help">Help</Link>
        </div>
        <div className="footer-copyright">
          <span>© 2024 MESME. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
