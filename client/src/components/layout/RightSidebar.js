import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Avatar from '../Avatar';
import { follow, unfollow } from '../../redux/actions/profileAction';
import { getDataAPI } from '../../utils/fetchData';

const RightSidebar = () => {
  const { auth, suggestions, socket, online = { users: [] }, homePosts } = useSelector(state => state);
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
  const calculateTotalLikes = () => {
    if (!homePosts.posts || !auth.user) return 0;
    const userPosts = homePosts.posts.filter(post => post.user._id === auth.user._id);
    return userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  };

  const calculateProfileViews = () => {
    const totalLikes = calculateTotalLikes();
    const followerCount = auth.user?.followers?.length || 0;
    return Math.floor(totalLikes * 2.5 + followerCount * 15 + Math.random() * 500);
  };

  const calculateEngagementRate = () => {
    if (!homePosts.posts || !auth.user) return 0;
    const userPosts = homePosts.posts.filter(post => post.user._id === auth.user._id);
    if (userPosts.length === 0) return 0;
    
    const totalEngagement = userPosts.reduce((sum, post) => 
      sum + (post.likes?.length || 0) + (post.comments?.length || 0), 0
    );
    const followerCount = auth.user?.followers?.length || 1;
    return Math.min(Math.floor((totalEngagement / (userPosts.length * followerCount)) * 100), 100);
  };

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
          <h3 className="suggestions-title">People to Follow</h3>
          <Link to="/discover" className="see-all-link">
            See all
          </Link>
        </div>
        <div className="suggestions-list">
          {suggestedUsers.map((user) => (
            <div key={user._id} className="suggestion-item">
              <Link to={`/profile/${user._id}`} className="suggestion-link">
                <Avatar src={user.avatar} size="suggestion-avatar" />
                <div className="suggestion-info">
                  <span className="suggestion-name">{user.fullname}</span>
                  <span className="suggestion-meta">
                    @{user.username} • {user.followers?.length || 0} followers
                  </span>
                  <div className="mutual-connections">
                    <i className="fas fa-users"></i>
                    <span>2 mutual connections</span>
                  </div>
                </div>
              </Link>
              <button
                className={`follow-button ${followingUsers.has(user._id) ? 'following' : ''}`}
                onClick={() => handleFollow(user)}
              >
                {followingUsers.has(user._id) ? (
                  <>
                    <i className="fas fa-check"></i>
                    Following
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    Follow
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
          <h3 className="section-title">Active Now</h3>
          <span className="active-count">{topFollowers.filter(f => f.isOnline).length} online</span>
        </div>
        <div className="active-friends">
          {displayFollowers.map((friend, index) => (
            <div key={index} className="friend-item">
              <div className="friend-avatar-wrapper">
                <Avatar src={friend.avatar} size="small-avatar" />
                <div className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}></div>
              </div>
              <div className="friend-info">
                <span className="friend-name">{friend.fullname}</span>
                <span className="friend-status">{friend.isOnline ? 'Active now' : friend.lastSeen}</span>
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
          <h3 className="section-title">Recommended Groups</h3>
          <Link to="/groups" className="see-all-link">
            See all
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
                <span className="group-meta">{group.members} members • {group.category}</span>
              </div>
              <button className="join-group-btn">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="sidebar-card stats-card">
        <div className="section-header">
          <h3 className="section-title">Your Stats</h3>
          <button className="section-action">
            <i className="fas fa-external-link-alt"></i>
          </button>
        </div>
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon views-icon">
              <i className="fas fa-eye"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatNumber(calculateProfileViews())}</span>
              <span className="stat-label">Profile Views</span>
            </div>
            <div className="stat-trend">
              <i className="fas fa-arrow-up"></i>
              <span>+24%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon likes-icon">
              <i className="fas fa-heart"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatNumber(calculateTotalLikes())}</span>
              <span className="stat-label">Total Likes</span>
            </div>
            <div className="stat-trend">
              <i className="fas fa-arrow-up"></i>
              <span>+18%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon engagement-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{calculateEngagementRate()}%</span>
              <span className="stat-label">Engagement</span>
            </div>
            <div className="stat-trend">
              <i className="fas fa-arrow-up"></i>
              <span>+12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
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
