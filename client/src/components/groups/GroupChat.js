import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { sendGroupMessage, getGroupMessages, getGroup } from '../../redux/actions/groupAction';
import { imageUpload } from '../../utils/imageUpload';
import { imageShow, videoShow } from '../../utils/mediaShow';
import Avatar from '../Avatar';
import LoadIcon from '../../images/loading.gif';
import { getDataAPI } from '../../utils/fetchData';
import '../../styles/group-chat-new.css';

const GroupChat = () => {
  const { id: groupId } = useParams();
  const { auth, groups, socket } = useSelector(state => state);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [loadMedia, setLoadMedia] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [typing, setTyping] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [followers, setFollowers] = useState([]);
  const typingTimeoutRef = useRef();
  
  const messagesEndRef = useRef(null);
  const refDisplay = useRef();

  const currentGroup = groups.groups.find(group => group._id === groupId);
  const messages = groups.groupMessages[groupId] || [];

  // Handler functions
  const handleSendMessage = () => {
    if (!text.trim() && media.length === 0) return;
    
    dispatch(sendGroupMessage({
      groupId,
      text: text.trim(),
      media,
      auth,
      socket
    }));
    
    setText('');
    setMedia([]);
  };

  const handleFileSelect = async (e) => {
    const files = [...e.target.files];
    setLoadMedia(true);
    
    try {
      const uploadedMedia = await imageUpload(files);
      setMedia(prev => [...prev, ...uploadedMedia]);
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setLoadMedia(false);
    }
  };

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
  }, [groupId, auth.token, dispatch, socket, auth.user._id]);

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

  const loadFollowers = async () => {
    try {
      setLoadingFollowers(true);
      const res = await getDataAPI(`user/${auth.user._id}`, auth.token);
      const userFollowers = res.data.user.followers || [];
      
      // Get detailed follower info
      const followerDetails = await Promise.all(
        userFollowers.slice(0, 50).map(async (followerId) => {
          try {
            const followerRes = await getDataAPI(`user/${followerId}`, auth.token);
            return followerRes.data.user;
          } catch (err) {
            return null;
          }
        })
      );
      
      // Filter out null results and current members
      const availableFollowers = followerDetails.filter(follower => 
        follower && 
        !currentGroup.members.some(member => member.user._id === follower._id) &&
        follower._id !== auth.user._id
      );
      
      setFollowers(availableFollowers);
    } catch (err) {
      console.error('Error loading followers:', err);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const inviteMember = async (userId) => {
    try {
      const res = await postDataAPI(`groups/${groupId}/invite`, {
        userIds: [userId],
        message: `You've been invited to join ${currentGroup.name}`
      }, auth.token);
      
      // Refresh group data
      dispatch(getGroup({ groupId, auth }));
      
      // Remove from available followers
      setFollowers(prev => prev.filter(f => f._id !== userId));
      
      alert('Invitation sent successfully!');
    } catch (err) {
      console.error('Error inviting member:', err);
      alert('Failed to send invitation');
    }
  };

  const debugGroupMembership = async () => {
    try {
      const res = await getDataAPI(`groups/${groupId}/membership`, auth.token);
      console.log('🔍 Group Membership Debug:', res.data);
    } catch (err) {
      console.error('Debug membership error:', err);
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

  if (!currentGroup && groups.loading) {
    return (
      <div className="group-chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading group...</p>
      </div>
    );
  }

  if (!currentGroup && !groups.loading) {
    return (
      <div className="group-chat-error">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Group Not Found</h3>
        <p>This group may have been deleted, expired, or you don't have access to it.</p>
        <div className="error-actions">
          <button 
            className="retry-btn"
            onClick={() => {
              console.log('Retrying group fetch for:', groupId);
              dispatch(getGroup({ groupId, auth }));
              dispatch(getGroupMessages({ groupId, auth }));
            }}
          >
            <i className="fas fa-redo"></i>
            Try Again
          </button>
          <button 
            className="back-btn"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-group-chat">
      {/* Compact Modern Header */}
      <div className="modern-group-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
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
          <button className="action-btn" title="Voice Call">
            <i className="fas fa-phone"></i>
          </button>
          <button className="action-btn" title="Video Call">
            <i className="fas fa-video"></i>
          </button>
          <button className="action-btn" onClick={() => setShowGroupInfo(true)} title="More">
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
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender._id === auth.user._id;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].sender._id !== msg.sender._id);
              const isLastFromSender = index === messages.length - 1 || messages[index + 1].sender._id !== msg.sender._id;
              
              return (
                <div key={msg._id} className={`group-message-wrapper ${isOwnMessage ? 'sent' : 'received'}`}>
                  {msg.messageType === 'system' ? (
                    <div className="group-system-message">
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <div className="group-message-container">
                      {/* Avatar for received messages */}
                      {!isOwnMessage && (
                        <div className="group-message-avatar">
                          {showAvatar ? (
                            msg.sender.avatar ? (
                              <img src={msg.sender.avatar} alt={msg.sender.fullname} className="sender-avatar" />
                            ) : (
                              <div className="sender-avatar-placeholder">
                                {msg.sender.fullname.charAt(0).toUpperCase()}
                              </div>
                            )
                          ) : (
                            <div className="avatar-spacer"></div>
                          )}
                        </div>
                      )}
                      
                      <div className="group-message-content">
                        {/* Sender name for received messages */}
                        {!isOwnMessage && showAvatar && (
                          <div className="group-sender-name">
                            {msg.sender.fullname}
                          </div>
                        )}
                        
                        <div className={`group-message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
                          {/* Media */}
                          {msg.media && msg.media.length > 0 && (
                            <div className="group-message-media">
                              {msg.media.map((item, idx) => (
                                <div key={idx} className="group-media-item">
                                  {item.url.match(/video/i) 
                                    ? videoShow(item.url)
                                    : imageShow(item.url)
                                  }
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Text */}
                          {msg.text && (
                            <div className="group-message-text">{msg.text}</div>
                          )}
                          
                          {/* Time and status */}
                          <div className="group-message-meta">
                            <span className="group-message-time">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })}
                            </span>
                            {isOwnMessage && (
                              <div className="group-message-status">
                                <i className="fas fa-check-double"></i>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Typing Indicators */}
            {typing.length > 0 && (
              <div className="group-typing-indicator">
                <div className="typing-dots">
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
      {!currentGroup.isExpired && new Date() < new Date(currentGroup.expiryDate) ? (
        <div className="whatsapp-group-input">
          <div className="group-input-container">
            <button 
              className="group-attachment-btn"
              onClick={() => refDisplay.current.click()}
              title="Attach media"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            
            <div className="group-text-input-wrapper">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${currentGroup.name}...`}
                className="group-text-input"
                rows="1"
              />
              
              <button 
                className="group-emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Emoji"
              >
                <i className="fas fa-smile"></i>
              </button>
            </div>
            
            <button 
              className="group-send-btn"
              onClick={handleSendMessage}
              disabled={!text.trim() && media.length === 0}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          
          {/* Media Preview */}
          {media.length > 0 && (
            <div className="group-media-preview">
              {media.map((item, index) => (
                <div key={index} className="group-preview-item">
                  {item.type.startsWith('image') ? (
                    <img src={item.url} alt="preview" />
                  ) : (
                    <video src={item.url} controls />
                  )}
                  <button 
                    className="remove-media-btn"
                    onClick={() => setMedia(media.filter((_, i) => i !== index))}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={refDisplay}
            multiple
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="expired-group-notice">
          <i className="fas fa-clock"></i>
          <span>This group has expired. No new messages can be sent.</span>
        </div>
      )}

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div className="modal-overlay" onClick={() => setShowGroupInfo(false)}>
          <div className="group-info-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Group Info</h2>
              <button className="close-btn" onClick={() => setShowGroupInfo(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              {/* Group Details */}
              <div className="group-info-section">
                <div className="group-avatar-large">
                  <Avatar src={currentGroup.avatar} size="large-avatar" />
                </div>
                <h3>{currentGroup.name}</h3>
                {currentGroup.description && (
                  <p className="group-description">{currentGroup.description}</p>
                )}
                <div className="group-stats">
                  <span>{currentGroup.members?.length || 1} members</span>
                  <span>•</span>
                  <span>Expires {getTimeRemaining()}</span>
                </div>
              </div>

              {/* Members Section */}
              <div className="members-section">
                <div className="section-header">
                  <h4>Members ({currentGroup.members?.length || 1})</h4>
                  {(currentGroup.creator === auth.user._id || 
                    currentGroup.members?.some(m => m.user._id === auth.user._id && m.role === 'admin')) && (
                    <button 
                      className="add-members-btn"
                      onClick={() => {
                        setShowAddMembers(true);
                        loadFollowers();
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      Add Members
                    </button>
                  )}
                </div>
                
                <div className="members-list">
                  {/* Creator */}
                  <div className="member-item">
                    <Avatar src={currentGroup.creator.avatar} size="medium-avatar" />
                    <div className="member-info">
                      <span className="member-name">{currentGroup.creator.fullname}</span>
                      <span className="member-role">Creator</span>
                    </div>
                  </div>
                  
                  {/* Other Members */}
                  {currentGroup.members?.filter(member => member.user._id !== currentGroup.creator._id).map(member => (
                    <div key={member.user._id} className="member-item">
                      <Avatar src={member.user.avatar} size="medium-avatar" />
                      <div className="member-info">
                        <span className="member-name">{member.user.fullname}</span>
                        <span className="member-role">{member.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="modal-overlay" onClick={() => setShowAddMembers(false)}>
          <div className="add-members-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Members</h2>
              <button className="close-btn" onClick={() => setShowAddMembers(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <p>Select followers to invite to {currentGroup.name}:</p>
              
              {loadingFollowers ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <span>Loading followers...</span>
                </div>
              ) : followers.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <p>No followers available to invite</p>
                </div>
              ) : (
                <div className="followers-list">
                  {followers.map(follower => (
                    <div key={follower._id} className="follower-item">
                      <Avatar src={follower.avatar} size="medium-avatar" />
                      <div className="follower-info">
                        <span className="follower-name">{follower.fullname}</span>
                        <span className="follower-username">@{follower.username}</span>
                      </div>
                      <button 
                        className="invite-btn"
                        onClick={() => inviteMember(follower._id)}
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
