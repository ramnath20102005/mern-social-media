import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import { sendGroupMessage, getGroupMessages, getGroup } from '../../redux/actions/groupAction';
import { imageUpload } from '../../utils/imageUpload';
import { imageShow, videoShow } from '../../utils/mediaShow';
import LoadIcon from '../../images/loading.gif';
import '../../styles/group-chat-new.css';

const GroupChatNew = () => {
  const { id: groupId } = useParams();
  const { auth, groups, socket } = useSelector(state => state);
  const dispatch = useDispatch();
  const history = useHistory();

  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [loadMedia, setLoadMedia] = useState(false);
  
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
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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
    <div className="modern-group-chat">
      {/* Modern Header */}
      <div className="modern-group-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => history.goBack()}>
            <i className="fas fa-arrow-left"></i>
          </button>
          
          <div className="group-avatar-wrapper">
            {currentGroup.avatar ? (
              <img src={currentGroup.avatar} alt={currentGroup.name} className="group-avatar" />
            ) : (
              <div className="group-avatar-placeholder">
                <i className="fas fa-users"></i>
              </div>
            )}
            <span className="online-dot"></span>
          </div>
          
          <div className="group-info">
            <h3 className="group-name">{currentGroup.name}</h3>
            <div className="group-status">
              <span>{currentGroup.members?.length || 1} members</span>
              <span className="dot">•</span>
              <span className="expiry">{getTimeRemaining()}</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="action-btn" title="Search">
            <i className="fas fa-search"></i>
          </button>
          <button className="action-btn" title="More">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="whatsapp-group-messages">
        {messages.length === 0 ? (
          <div className="group-empty-state">
            <div className="empty-group-icon">
              <i className="fas fa-users"></i>
            </div>
            <h4>Welcome to {currentGroup.name}!</h4>
            <p>Start the conversation by sending the first message.</p>
          </div>
        ) : (
          <div className="group-messages-scroll">
            {messages.map((msg, index) => (
              <div 
                key={msg._id || index} 
                className={`group-message-wrapper ${msg.sender._id === auth.user._id ? 'sent' : 'received'}`}
              >
                <div className="group-message-container">
                  {msg.sender._id !== auth.user._id && (
                    <div className="group-message-avatar">
                      <img src={msg.sender.avatar} alt={msg.sender.fullname} className="sender-avatar" />
                    </div>
                  )}
                  
                  <div className="group-message-content">
                    {msg.sender._id !== auth.user._id && (
                      <div className="group-sender-name">{msg.sender.fullname}</div>
                    )}
                    
                    <div className={`group-message-bubble ${msg.sender._id === auth.user._id ? 'own' : 'other'}`}>
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
                        <div className="group-message-text">{msg.text}</div>
                      )}
                      
                      <div className="group-message-meta">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loadMedia && (
              <div className="group-message-wrapper sent">
                <div className="group-message-container">
                  <div className="group-message-content">
                    <div className="group-message-bubble own">
                      <img src={LoadIcon} alt="Sending..." className="loading-icon" />
                      <span>Sending...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Input Container */}
      <div className="group-input-container">
        <button 
          className="group-attachment-btn"
          onClick={() => document.getElementById('file').click()}
          title="Attach media"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        
        <div className="group-text-input-wrapper">
          <textarea
            value={text}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Message ${currentGroup.name}...`}
            className="group-text-input"
            rows="1"
          />
          
          <button 
            className="group-emoji-btn"
            onClick={() => setText(prev => prev + '😊')}
            title="Emoji"
          >
            <i className="fas fa-smile"></i>
          </button>
        </div>
        
        <button 
          className="group-send-btn"
          onClick={handleSubmit}
          disabled={!text.trim() && media.length === 0}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          id="file"
          multiple
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleChangeMedia}
        />
      </div>
    </div>
  );
};

export default GroupChatNew;
