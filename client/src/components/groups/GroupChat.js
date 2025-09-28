import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { sendGroupMessage, getGroupMessages, getGroup } from '../../redux/actions/groupAction';
import Avatar from '../Avatar';
import { imageShow, videoShow } from '../../utils/mediaShow';

const GroupChat = () => {
  const { groupId } = useParams();
  const { auth, groups, socket, theme } = useSelector(state => state);
  const dispatch = useDispatch();

  const [message, setMessage] = useState('');
  const [media, setMedia] = useState([]);
  const [typing, setTyping] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
      // Leave group socket room on unmount
      if (socket && groupId) {
        socket.emit('leaveGroup', { groupId, userId: auth.user._id });
      }
    };
  }, [groupId, auth.token, auth.user._id, socket, dispatch]);

  // Socket listeners for group messages
  useEffect(() => {
    if (!socket) return;

    const handleGroupMessage = (msg) => {
      if (msg.group === groupId) {
        dispatch({
          type: 'ADD_GROUP_MESSAGE',
          payload: { groupId, message: msg }
        });
      }
    };

    const handleGroupTyping = ({ from, groupId: gId }) => {
      if (gId === groupId && from !== auth.user._id) {
        setTyping(prev => [...prev.filter(id => id !== from), from]);
      }
    };

    const handleStopGroupTyping = ({ from, groupId: gId }) => {
      if (gId === groupId) {
        setTyping(prev => prev.filter(id => id !== from));
      }
    };

    socket.on('addGroupMessageToClient', handleGroupMessage);
    socket.on('groupTypingToClient', handleGroupTyping);
    socket.on('stopGroupTypingToClient', handleStopGroupTyping);

    return () => {
      socket.off('addGroupMessageToClient', handleGroupMessage);
      socket.off('groupTypingToClient', handleGroupTyping);
      socket.off('stopGroupTypingToClient', handleStopGroupTyping);
    };
  }, [socket, groupId, auth.user._id, dispatch]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() && media.length === 0) return;

    const messageData = {
      groupId,
      text: message,
      media,
      auth,
      socket
    };

    await dispatch(sendGroupMessage(messageData));
    
    setMessage('');
    setMedia([]);
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('groupTyping', { from: auth.user._id, groupId });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopGroupTyping', { from: auth.user._id, groupId });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeRemaining = () => {
    if (!currentGroup?.expiryDate) return '';
    
    const now = new Date();
    const expiry = new Date(currentGroup.expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (!currentGroup) {
    return (
      <div className="group-chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading group...</p>
      </div>
    );
  }

  return (
    <div className="group-chat-container">
      {/* Group Header */}
      <div className="group-chat-header">
        <div className="group-info" onClick={() => setShowGroupInfo(true)}>
          <Avatar src={currentGroup.avatar} size="medium-avatar" />
          <div className="group-details">
            <h3 className="group-name">{currentGroup.name}</h3>
            <div className="group-meta">
              <span className="member-count">
                {currentGroup.memberCount} members
              </span>
              <span className="expiry-time">
                {getTimeRemaining()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="group-actions">
          <button className="action-btn">
            <i className="fas fa-video"></i>
          </button>
          <button className="action-btn">
            <i className="fas fa-phone"></i>
          </button>
          <button className="action-btn" onClick={() => setShowGroupInfo(true)}>
            <i className="fas fa-info-circle"></i>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="group-messages-area">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">
              <i className="fas fa-users"></i>
            </div>
            <h4>Welcome to {currentGroup.name}!</h4>
            <p>Start the conversation by sending the first message.</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => (
              <div key={msg._id} className={`message-item ${msg.sender._id === auth.user._id ? 'own-message' : ''}`}>
                {msg.messageType === 'system' ? (
                  <div className="system-message">
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <div className="message-content">
                    {msg.sender._id !== auth.user._id && (
                      <div className="message-sender">
                        <Avatar src={msg.sender.avatar} size="tiny-avatar" />
                        <span className="sender-name">{msg.sender.fullname}</span>
                      </div>
                    )}
                    
                    <div className="message-bubble">
                      {msg.media && msg.media.length > 0 && (
                        <div className="message-media">
                          {msg.media.map((item, idx) => (
                            <div key={idx} className="media-item">
                              {item.url.match(/video/i) 
                                ? videoShow(item.url, theme)
                                : imageShow(item.url, theme)
                              }
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {msg.text && (
                        <div className="message-text">{msg.text}</div>
                      )}
                      
                      <div className="message-time">
                        {formatTime(msg.createdAt)}
                        {msg.readBy && msg.readBy.length > 0 && (
                          <span className="read-count">
                            <i className="fas fa-check-double"></i>
                            {msg.readBy.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicators */}
            {typing.length > 0 && (
              <div className="typing-indicators">
                <div className="typing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">
                  {typing.length === 1 ? 'Someone is typing...' : `${typing.length} people are typing...`}
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      {!currentGroup.isExpired ? (
        <div className="group-message-input">
          <div className="input-container">
            <button className="attachment-btn">
              <i className="fas fa-paperclip"></i>
            </button>
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${currentGroup.name}...`}
              rows="1"
            />
            
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!message.trim() && media.length === 0}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="expired-group-notice">
          <i className="fas fa-clock"></i>
          <span>This group has expired. No new messages can be sent.</span>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
