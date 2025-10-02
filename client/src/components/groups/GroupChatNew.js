import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { sendGroupMessage, getGroupMessages, getGroup } from '../../redux/actions/groupAction';
import { imageUpload } from '../../utils/imageUpload';
import { imageShow, videoShow } from '../../utils/mediaShow';
import LoadIcon from '../../images/loading.gif';

const GroupChatNew = () => {
  const { id: groupId } = useParams();
  const { auth, groups, socket } = useSelector(state => state);
  const dispatch = useDispatch();

  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [loadMedia, setLoadMedia] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const refDisplay = useRef();

  // Get current group and messages
  const currentGroup = groups.groups.find(group => group._id === groupId);
  const messages = groups.groupMessages[groupId] || [];

  // Load group data and messages on mount
  useEffect(() => {
    if (groupId && auth.token) {
      dispatch(getGroup({ groupId, auth }));
      dispatch(getGroupMessages({ groupId, auth }));
      
      // Join group socket room
      if (socket) {
        socket.emit('joinGroup', { groupId, userId: auth.user._id });
      }
    }

    return () => {
      if (socket && groupId) {
        socket.emit('leaveGroup', { groupId, userId: auth.user._id });
      }
    };
  }, [groupId, auth.token, dispatch, socket, auth.user._id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message input
  const handleInputChange = (e) => {
    setText(e.target.value);
  };

  // Handle emoji click
  const handleEmojiClick = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Handle media upload
  const handleChangeMedia = (e) => {
    const files = [...e.target.files];
    let err = '';
    let newMedia = [];

    files.forEach(file => {
      if (!file) return err = 'File does not exist.';
      if (file.size > 1024 * 1024 * 5) {
        return err = 'The largest image size is 5mb.';
      }
      return newMedia.push(file);
    });

    if (err) {
      console.error(err);
    } else {
      setMedia([...media, ...newMedia]);
    }
  };

  // Delete media
  const handleDeleteMedia = (index) => {
    const newArr = [...media];
    newArr.splice(index, 1);
    setMedia(newArr);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && media.length === 0) return;

    let mediaArray = [];
    if (media.length > 0) {
      setLoadMedia(true);
      mediaArray = await imageUpload(media);
      setLoadMedia(false);
    }

    const messageData = {
      groupId,
      text: text.trim(),
      media: mediaArray,
      messageType: mediaArray.length > 0 ? 'image' : 'text'
    };

    dispatch(sendGroupMessage({ ...messageData, auth, socket }));
    
    setText('');
    setMedia([]);
    setShowEmojiPicker(false);
  };

  // Get group avatar (use first letter of group name if no avatar)
  const getGroupAvatar = () => {
    if (currentGroup?.avatar) {
      return currentGroup.avatar;
    }
    return null; // Will show default avatar with first letter
  };

  // Get time remaining
  const getTimeRemaining = () => {
    if (!currentGroup?.expiryDate) return '';
    
    const now = new Date();
    const expiry = new Date(currentGroup.expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expiring soon';
  };

  if (!currentGroup) {
    return (
      <div className="whatsapp-chat-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading group...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="whatsapp-chat-container">
      {/* Chat Header - Same as person-to-person */}
      <div className="whatsapp-chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            {currentGroup.avatar ? (
              <img src={currentGroup.avatar} alt={currentGroup.name} className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {currentGroup.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="chat-user-info">
            <h3 className="chat-user-name">{currentGroup.name}</h3>
            <p className="chat-user-status">
              {currentGroup.members?.length || 1} members • {getTimeRemaining()}
            </p>
          </div>
        </div>
        
        <div className="chat-header-actions">
          <button className="header-action-btn">
            <i className="fas fa-search"></i>
          </button>
          <button className="header-action-btn">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      {/* Messages Area - Same structure as person-to-person */}
      <div className="whatsapp-messages-container" ref={refDisplay}>
        <div className="messages-wrapper">
          {messages.length === 0 ? (
            <div className="empty-messages">
              <div className="welcome-message">
                <div className="welcome-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h3>Welcome to {currentGroup.name}!</h3>
                <p>Start the conversation by sending a message.</p>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div 
                  key={msg._id || index} 
                  className={`message-wrapper ${msg.sender._id === auth.user._id ? 'sent' : 'received'}`}
                >
                  {msg.sender._id !== auth.user._id && (
                    <div className="message-avatar">
                      <img src={msg.sender.avatar} alt={msg.sender.fullname} className="sender-avatar" />
                    </div>
                  )}
                  <div className="message-bubble">
                    {msg.sender._id !== auth.user._id && (
                      <div className="sender-name">{msg.sender.fullname}</div>
                    )}
                    
                    {msg.media && msg.media.length > 0 && (
                      <div className="message-media">
                        {msg.media.map((item, i) => (
                          <div key={i} className="media-item">
                            {item.url ? (
                              item.url.match(/video/i) ? videoShow(item.url) : imageShow(item.url)
                            ) : (
                              item.match(/video/i) ? videoShow(item) : imageShow(item)
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {msg.text && (
                      <div className="message-text">{msg.text}</div>
                    )}
                    
                    <div className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              
              {loadMedia && (
                <div className="message-wrapper sent">
                  <div className="message-bubble loading-message">
                    <img src={LoadIcon} alt="Sending..." className="loading-icon" />
                    <span>Sending...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Media Preview */}
      {media.length > 0 && (
        <div className="media-preview-container">
          <div className="media-preview-header">
            <h4>Media to send</h4>
            <button onClick={() => setMedia([])} className="clear-media-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="media-preview-list">
            {media.map((item, index) => (
              <div key={index} className="media-preview-item">
                {item.type.match(/video/i) ? (
                  <video src={URL.createObjectURL(item)} className="preview-video" />
                ) : (
                  <img src={URL.createObjectURL(item)} alt="Preview" className="preview-image" />
                )}
                <button 
                  onClick={() => handleDeleteMedia(index)}
                  className="remove-media-btn"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input - Exactly same as person-to-person */}
      <div className="whatsapp-message-input">
        <form onSubmit={handleSubmit} className="message-input-form">
          <div className="input-container">
            <div className="emoji-picker-container">
              <button type="button" className="emoji-btn" onClick={toggleEmojiPicker}>
                <i className="far fa-smile"></i>
              </button>
              {showEmojiPicker && (
                <div className="emoji-picker">
                  <div className="emoji-grid">
                    {['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😴', '🤗', '🙄', '😬', '🤐', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😇', '🤓'].map(emoji => (
                      <button 
                        key={emoji} 
                        className="emoji-item" 
                        onClick={() => handleEmojiClick(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-input-wrapper">
              <input
                type="text"
                value={text}
                onChange={handleInputChange}
                placeholder="Type a message"
                className="message-text-input"
              />
            </div>

            <div className="input-actions">
              <label className="attach-btn" htmlFor="file">
                <i className="fas fa-paperclip"></i>
                <input
                  type="file"
                  name="file"
                  id="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleChangeMedia}
                  style={{ display: 'none' }}
                />
              </label>
              
              {text.trim() || media.length > 0 ? (
                <button type="submit" className="send-btn">
                  <i className="fas fa-paper-plane"></i>
                </button>
              ) : (
                <button type="button" className="voice-btn">
                  <i className="fas fa-microphone"></i>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupChatNew;
