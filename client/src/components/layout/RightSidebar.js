import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Avatar from '../Avatar';
import { follow, unfollow } from '../../redux/actions/profileAction';

const RightSidebar = () => {
  const { auth, suggestions } = useSelector(state => state);
  const dispatch = useDispatch();
  const [followingUsers, setFollowingUsers] = useState(new Set());

  const handleFollow = async (user) => {
    if (followingUsers.has(user._id)) {
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user._id);
        return newSet;
      });
      dispatch(unfollow({ users: [user], user: auth.user, auth }));
    } else {
      setFollowingUsers(prev => new Set(prev).add(user._id));
      dispatch(follow({ users: [user], user: auth.user, auth }));
    }
  };

  const suggestedUsers = suggestions.users?.slice(0, 5) || [
    { _id: '1', fullname: 'Sarah Wilson', username: 'sarahw', avatar: '/api/placeholder/48/48', followers: ['1', '2'] },
    { _id: '2', fullname: 'David Chen', username: 'davidc', avatar: '/api/placeholder/48/48', followers: ['1'] },
    { _id: '3', fullname: 'Emma Davis', username: 'emmad', avatar: '/api/placeholder/48/48', followers: ['2', '3'] },
    { _id: '4', fullname: 'Alex Johnson', username: 'alexj', avatar: '/api/placeholder/48/48', followers: ['1', '2', '3'] },
    { _id: '5', fullname: 'Lisa Brown', username: 'lisab', avatar: '/api/placeholder/48/48', followers: ['2'] },
  ];

  const trendingHashtags = [
    { tag: '#TechTrends2024', posts: '45.2K', growth: '+12%' },
    { tag: '#WebDev', posts: '32.1K', growth: '+8%' },
    { tag: '#AI', posts: '28.7K', growth: '+15%' },
    { tag: '#React', posts: '19.3K', growth: '+5%' },
    { tag: '#JavaScript', posts: '41.8K', growth: '+7%' },
  ];

  const activeFriends = [
    { name: 'John Doe', avatar: '/api/placeholder/32/32', status: 'online', lastSeen: 'now' },
    { name: 'Jane Smith', avatar: '/api/placeholder/32/32', status: 'online', lastSeen: '2m ago' },
    { name: 'Mike Johnson', avatar: '/api/placeholder/32/32', status: 'away', lastSeen: '5m ago' },
    { name: 'Sarah Wilson', avatar: '/api/placeholder/32/32', status: 'online', lastSeen: 'now' },
    { name: 'Tom Brown', avatar: '/api/placeholder/32/32', status: 'offline', lastSeen: '1h ago' },
  ];

  const recommendedGroups = [
    { name: 'React Developers', members: '12.5K', category: 'Technology', image: '/api/placeholder/40/40' },
    { name: 'UI/UX Designers', members: '8.2K', category: 'Design', image: '/api/placeholder/40/40' },
    { name: 'Startup Founders', members: '15.7K', category: 'Business', image: '/api/placeholder/40/40' },
  ];

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

      {/* Trending Hashtags */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title">Trending Topics</h3>
          <button className="section-action">
            <i className="fas fa-hashtag"></i>
          </button>
        </div>
        <div className="trending-hashtags">
          {trendingHashtags.map((item, index) => (
            <div key={index} className="hashtag-item">
              <div className="hashtag-content">
                <span className="hashtag-tag">{item.tag}</span>
                <span className="hashtag-posts">{item.posts} posts</span>
              </div>
              <div className="hashtag-growth">
                <span className="growth-indicator positive">
                  <i className="fas fa-arrow-up"></i>
                  {item.growth}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Friends */}
      <div className="sidebar-card">
        <div className="section-header">
          <h3 className="section-title">Active Now</h3>
          <span className="active-count">{activeFriends.filter(f => f.status === 'online').length} online</span>
        </div>
        <div className="active-friends">
          {activeFriends.map((friend, index) => (
            <div key={index} className="friend-item">
              <div className="friend-avatar-wrapper">
                <Avatar src={friend.avatar} size="small-avatar" />
                <div className={`status-indicator ${friend.status}`}></div>
              </div>
              <div className="friend-info">
                <span className="friend-name">{friend.name}</span>
                <span className="friend-status">{friend.lastSeen}</span>
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
      <div className="sidebar-card">
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-eye"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">2.4K</span>
              <span className="stat-label">Profile Views</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-heart"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">1.8K</span>
              <span className="stat-label">Total Likes</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-share"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">342</span>
              <span className="stat-label">Shares</span>
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
