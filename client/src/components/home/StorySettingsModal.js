import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getDataAPI } from '../../utils/fetchData';

const StorySettingsModal = ({ isOpen, onClose, onConfirm, selectedFiles }) => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();

  const [settings, setSettings] = useState({
    caption: '',
    visibility: 'FOLLOWERS',
    expiryDuration: 24,
    allowReplies: true,
    closeFriends: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Search close friends
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length > 2 && settings.visibility === 'CLOSE_FRIENDS') {
        setSearchLoading(true);
        try {
          const res = await getDataAPI(`search?username=${encodeURIComponent(searchQuery)}&type=users&limit=10`, auth.token);
          const users = res.data.users?.filter(user => 
            user._id !== auth.user._id && 
            !settings.closeFriends.some(friend => friend._id === user._id)
          ) || [];
          setSearchResults(users);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, auth.token, auth.user._id, settings.closeFriends, settings.visibility]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'expiryDuration' ? parseInt(value) : value
    }));
  };

  const addCloseFriend = (user) => {
    setSettings(prev => ({
      ...prev,
      closeFriends: [...prev.closeFriends, user]
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeCloseFriend = (userId) => {
    setSettings(prev => ({
      ...prev,
      closeFriends: prev.closeFriends.filter(friend => friend._id !== userId)
    }));
  };

  const handleSubmit = () => {
    const storyData = {
      ...settings,
      closeFriends: settings.closeFriends.map(friend => friend._id)
    };
    onConfirm(storyData);
  };

  const getDurationText = (hours) => {
    if (hours === 1) return '1 Hour';
    if (hours === 6) return '6 Hours';
    if (hours === 12) return '12 Hours';
    if (hours === 24) return '24 Hours';
    if (hours === 48) return '2 Days';
    if (hours === 72) return '3 Days';
    if (hours === 168) return '1 Week';
    return `${hours} Hours`;
  };

  if (!isOpen) return null;

  console.log('Story Settings Modal - Current settings:', settings);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="story-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Story Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          {/* Preview Section */}
          <div className="story-preview-section">
            <h4>Preview</h4>
            <div className="story-preview-grid">
              {selectedFiles?.slice(0, 3).map((file, index) => (
                <div key={index} className="story-preview-item">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${index + 1}`}
                    className="story-preview-image"
                  />
                </div>
              ))}
              {selectedFiles?.length > 3 && (
                <div className="story-preview-more">
                  +{selectedFiles.length - 3} more
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="form-group">
            <label>Caption (Optional)</label>
            <textarea
              name="caption"
              value={settings.caption}
              onChange={handleInputChange}
              placeholder="Write a caption for your story..."
              maxLength="500"
              rows="3"
            />
            <small>{settings.caption.length}/500</small>
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label>Who can see this story?</label>
            <div className="visibility-options">
              <div className="visibility-option">
                <input
                  type="radio"
                  id="public"
                  name="visibility"
                  value="PUBLIC"
                  checked={settings.visibility === 'PUBLIC'}
                  onChange={handleInputChange}
                />
                <label htmlFor="public" className="visibility-label">
                  <i className="fas fa-globe"></i>
                  <div>
                    <span className="visibility-title">Public</span>
                    <span className="visibility-desc">Anyone can see your story</span>
                  </div>
                </label>
              </div>

              <div className="visibility-option">
                <input
                  type="radio"
                  id="followers"
                  name="visibility"
                  value="FOLLOWERS"
                  checked={settings.visibility === 'FOLLOWERS'}
                  onChange={handleInputChange}
                />
                <label htmlFor="followers" className="visibility-label">
                  <i className="fas fa-users"></i>
                  <div>
                    <span className="visibility-title">Followers</span>
                    <span className="visibility-desc">Only your followers can see</span>
                  </div>
                </label>
              </div>

              <div className="visibility-option">
                <input
                  type="radio"
                  id="closeFriends"
                  name="visibility"
                  value="CLOSE_FRIENDS"
                  checked={settings.visibility === 'CLOSE_FRIENDS'}
                  onChange={handleInputChange}
                />
                <label htmlFor="closeFriends" className="visibility-label">
                  <i className="fas fa-heart"></i>
                  <div>
                    <span className="visibility-title">Close Friends</span>
                    <span className="visibility-desc">Only selected friends can see</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Close Friends Selection */}
          {settings.visibility === 'CLOSE_FRIENDS' && (
            <div className="close-friends-section">
              <h5>Select Close Friends</h5>
              
              <div className="search-input-container">
                <i className={`fas ${searchLoading ? 'fa-spinner fa-spin' : 'fa-search'}`}></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends to add..."
                />
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(user => (
                    <div key={user._id} className="search-result-item">
                      <img 
                        src={user.avatar} 
                        alt={user.fullname}
                        className="search-user-avatar"
                      />
                      <div className="user-info">
                        <span className="user-name">{user.fullname}</span>
                        <span className="user-username">@{user.username}</span>
                      </div>
                      <button 
                        className="add-friend-btn"
                        onClick={() => addCloseFriend(user)}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {settings.closeFriends.length > 0 && (
                <div className="selected-friends">
                  <h6>Selected Friends ({settings.closeFriends.length})</h6>
                  <div className="friends-grid">
                    {settings.closeFriends.map(friend => (
                      <div key={friend._id} className="friend-chip">
                        <img 
                          src={friend.avatar} 
                          alt={friend.fullname}
                          className="friend-chip-avatar"
                        />
                        <span>{friend.fullname}</span>
                        <button 
                          className="remove-friend-btn"
                          onClick={() => removeCloseFriend(friend._id)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Duration */}
          <div className="form-group">
            <label><i className="fas fa-clock"></i> Story Duration</label>
            <div className="duration-options">
              {[
                { value: 1, label: '1h', desc: '1 Hour' },
                { value: 6, label: '6h', desc: '6 Hours' },
                { value: 12, label: '12h', desc: '12 Hours' },
                { value: 24, label: '24h', desc: '24 Hours' },
                { value: 48, label: '2d', desc: '2 Days' },
                { value: 168, label: '1w', desc: '1 Week' }
              ].map(option => (
                <div key={option.value} className="duration-option">
                  <input
                    type="radio"
                    id={`duration-${option.value}`}
                    name="expiryDuration"
                    value={option.value}
                    checked={parseInt(settings.expiryDuration) === option.value}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`duration-${option.value}`} className="duration-label">
                    <span className="duration-time">{option.label}</span>
                    <span className="duration-desc">{option.desc}</span>
                  </label>
                </div>
              ))}
            </div>
            <small>Story will automatically disappear after {getDurationText(settings.expiryDuration)}</small>
          </div>

          {/* Allow Replies */}
          <div className="form-group">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="allowReplies"
                name="allowReplies"
                checked={settings.allowReplies}
                onChange={handleInputChange}
              />
              <label htmlFor="allowReplies" className="checkbox-label">
                <i className="fas fa-reply"></i>
                Allow replies to this story
              </label>
            </div>
            <small>People can send you messages about your story</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Share Story
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorySettingsModal;
