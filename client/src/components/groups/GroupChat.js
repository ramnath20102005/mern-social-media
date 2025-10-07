import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import { sendGroupMessage, getGroupMessages, getGroup, deleteGroupMessage, deleteMultipleGroupMessages } from '../../redux/actions/groupAction';
import { imageUpload } from '../../utils/imageUpload';
import { imageShow, videoShow } from '../../utils/mediaShow';
import GroupSidebar from './GroupSidebar';
import '../../styles/group-chat-new.css';

const GroupChat = () => {
  const { id: groupId } = useParams();
  const { auth, groups, socket } = useSelector(state => state);
  const dispatch = useDispatch();
  const history = useHistory();

  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [loadMedia, setLoadMedia] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typing, setTyping] = useState([]);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const refMedia = useRef(null);
  const refDisplay = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentGroup = groups.groups.find(group => group._id === groupId);
  const messages = useMemo(() => groups.groupMessages[groupId] || [], [groups.groupMessages, groupId]);
  // Component state tracking
  // console.log('GroupChat loaded:', { groupId, currentGroup: currentGroup?.name, messagesCount: messages.length });

  // Smart Avatar System - Generate gradient classes
  const avatarGradients = [
    'gradient-blue-purple', 'gradient-green-blue', 'gradient-purple-pink',
    'gradient-orange-red', 'gradient-teal-cyan', 'gradient-indigo-purple',
    'gradient-pink-rose', 'gradient-emerald-teal', 'gradient-amber-orange',
    'gradient-violet-purple'
  ];

  const getAvatarGradientClass = (groupName) => {
    if (!groupName || typeof groupName !== 'string') {
      return avatarGradients[0]; // Default gradient
    }
    
    const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarGradients[hash % avatarGradients.length];
  };


  const getGroupInitials = (groupName) => {
    if (!groupName || typeof groupName !== 'string') {
      return 'GR'; // Default initials
    }
    
    return groupName
      .split(' ')
      .filter(word => word && word.length > 0) // Filter out empty strings
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'GR'; // Fallback to 'GR' if empty
  };

  // Permission checks
  const isGroupCreator = () => {
    return currentGroup?.creator === auth.user._id;
  };

  const isGroupAdmin = () => {
    return currentGroup?.members?.some(
      member => member.user === auth.user._id && member.role === 'admin'
    );
  };

  // Media handling functions
  const handleChangeMedia = async (e) => {
    const files = [...e.target.files];
    let err = "";
    let validFiles = [];

    files.forEach((file) => {
      if (!file) return (err = "File does not exist.");
      if (file.size > 1024 * 1024 * 5) return (err = "File size must be less than 5 MB.");
      return validFiles.push(file);
    });

    if (err) {
      console.error(err);
      return;
    }

    setLoadMedia(true);
    try {
      const uploadedMedia = await imageUpload(validFiles);
      // Ensure proper media type is set
      const processedMedia = uploadedMedia.map((item, index) => ({
        ...item,
        type: item.type || validFiles[index]?.type || 'image/jpeg',
        name: item.name || validFiles[index]?.name || 'uploaded_file'
      }));
      console.log('Processed media from handleChangeMedia:', processedMedia);
      setMedia(prev => [...prev, ...processedMedia]);
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setLoadMedia(false);
    }
  };


  // Expiry management
  const getExpiryStatusClass = () => {
    if (!currentGroup?.expiresAt) return 'status-normal';
    
    const now = new Date();
    const expiry = new Date(currentGroup.expiresAt);
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 1) return 'status-critical';
    if (daysLeft <= 7) return 'status-warning';
    return 'status-normal';
  };

  // Search functionality
  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = messages.filter(msg => 
      msg.text && msg.text.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    // Scroll to first result if any
    if (results.length > 0) {
      scrollToMessage(results[0]._id);
    }
  };

  // Navigate search results
  const navigateSearchResults = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    } else {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    }
    
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex]._id);
  };

  // Scroll to specific message
  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add highlight effect
      messageElement.classList.add('search-highlight');
      setTimeout(() => {
        messageElement.classList.remove('search-highlight');
      }, 2000);
    }
  };

  // Clear search
  const clearSearch = () => {
    setMessageSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setShowMessageSearch(false);
  };

  // Context menu functions
  const handleRightClick = (e, message) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: message
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const selectMessage = (messageId) => {
    setSelectedMessages(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId);
      } else {
        return [...prev, messageId];
      }
    });
    closeContextMenu();
  };

  const deleteMessage = async (messageId) => {
    try {
      console.log('🗑️ Starting delete for message:', messageId, 'in group:', groupId);
      console.log('🔐 Auth token available:', !!auth.token);
      console.log('🔌 Socket available:', !!socket);
      console.log('👤 Current user ID:', auth.user._id);
      
      // Check if user has permission to delete
      const message = messages.find(msg => msg._id === messageId);
      console.log('📄 Message to delete:', message);
      console.log('👤 Message sender:', message?.sender);
      console.log('🔐 Is my message:', message?.sender === auth.user._id || message?.sender._id === auth.user._id);
      
      const result = await dispatch(deleteGroupMessage({ messageId, groupId, auth, socket }));
      console.log('✅ Delete dispatch result:', result);
      
      closeContextMenu();
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Show specific error message
      const errorMsg = error.response?.data?.msg || error.message || 'Failed to delete message. Please try again.';
      alert(`Delete failed: ${errorMsg}`);
    }
  };


  const deleteSelectedMessages = async () => {
    try {
      console.log('Deleting selected messages:', selectedMessages);
      await dispatch(deleteMultipleGroupMessages({ messageIds: selectedMessages, groupId, auth, socket }));
      setSelectedMessages([]);
    } catch (error) {
      console.error('Error deleting selected messages:', error);
    }
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // Effect for search
  useEffect(() => {
    handleSearch(messageSearchQuery);
  }, [messageSearchQuery, messages]);

  const shouldShowExpiryWarning = () => {
    if (!currentGroup?.expiresAt) return false;
    
    const now = new Date();
    const expiry = new Date(currentGroup.expiresAt);
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysLeft <= 7;
  };

  const getExpiryWarningType = () => {
    const now = new Date();
    const expiry = new Date(currentGroup.expiresAt);
    const hoursLeft = Math.ceil((expiry - now) / (1000 * 60 * 60));
    
    if (hoursLeft <= 24) return 'critical';
    return 'warning';
  };

  const getExpiryWarningMessage = () => {
    const now = new Date();
    const expiry = new Date(currentGroup.expiresAt);
    const hoursLeft = Math.ceil((expiry - now) / (1000 * 60 * 60));
    const daysLeft = Math.ceil(hoursLeft / 24);
    
    if (hoursLeft <= 24) {
      return `This group expires in ${hoursLeft} hours!`;
    }
    return `This group expires in ${daysLeft} days`;
  };

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
      const media = await imageUpload(files);
      // Ensure proper media type is set
      const processedMedia = media.map(item => ({
        ...item,
        type: item.type || (files.find(f => f.name === item.name)?.type) || 'image/jpeg'
      }));
      console.log('Processed media:', processedMedia);
      setMedia(prev => [...prev, ...processedMedia]);
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setLoadMedia(false);
    }
  };

  useEffect(() => {
    if (groupId && auth.token) {
      console.log('🔄 Fetching group data and messages for:', groupId);
      dispatch(getGroup({ groupId, auth }));
      dispatch(getGroupMessages({ groupId, auth }));
    }
  }, [groupId, auth, dispatch]);

  // Socket listeners for group messages
  useEffect(() => {
    if (!socket) return;

    const handleGroupMessage = (msg) => {
      console.log('📨 Received group message:', msg);
      if (msg.group === groupId) {
        dispatch({
          type: 'ADD_GROUP_MESSAGE',
          payload: { groupId, message: msg }
        });
      }
    };

    socket.on('addGroupMessageToClient', handleGroupMessage);

    return () => {
      socket.off('addGroupMessageToClient', handleGroupMessage);
    };
  }, [socket, groupId, auth.user._id, dispatch]);

  // Socket events for real-time updates
  useEffect(() => {
    if (socket && groupId && auth.user._id) {
      console.log('🔌 Joining group socket room:', groupId);
      // Join group room
      socket.emit('joinGroup', { groupId, userId: auth.user._id });

      // Listen for real-time group events
      const handleGroupUpdated = (data) => {
        if (data.groupId === groupId) {
          dispatch(getGroup({ groupId, auth }));
        }
      };

      const handleMemberJoined = (data) => {
        if (data.groupId === groupId) {
          dispatch(getGroup({ groupId, auth }));
        }
      };

      const handleMemberLeft = (data) => {
        if (data.groupId === groupId) {
          dispatch(getGroup({ groupId, auth }));
        }
      };

      socket.on('groupUpdated', handleGroupUpdated);
      socket.on('memberJoined', handleMemberJoined);
      socket.on('memberLeft', handleMemberLeft);

      return () => {
        console.log('🔌 Leaving group socket room:', groupId);
        // Leave group room when component unmounts
        socket.emit('leaveGroup', { groupId, userId: auth.user._id });
        socket.off('groupUpdated', handleGroupUpdated);
        socket.off('memberJoined', handleMemberJoined);
        socket.off('memberLeft', handleMemberLeft);
      };
    }
  }, [socket, groupId, auth.user._id, dispatch]);

  // Additional socket events
  useEffect(() => {
    if (socket && groupId) {
      const handleMemberPromoted = (data) => {
        if (data.groupId === groupId) {
          dispatch(getGroup({ groupId, auth }));
        }
      };

      const handleMemberRemoved = (data) => {
        if (data.groupId === groupId) {
          dispatch(getGroup({ groupId, auth }));
        }
      };

      socket.on('memberPromoted', handleMemberPromoted);
      socket.on('memberRemoved', handleMemberRemoved);

      return () => {
        socket.off('memberPromoted', handleMemberPromoted);
        socket.off('memberRemoved', handleMemberRemoved);
      };
    }
  }, [socket, groupId, auth, dispatch]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Removed unused functions to clean up warnings

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
    <div className="chat-page-container">
      <div className="whatsapp-chat-container">
      {/* WhatsApp-Style Group Header */}
      <div className="whatsapp-chat-header">
        <div className="chat-header-content">
          <div className="chat-user-info">
            <button className="back-btn" onClick={() => history.goBack()}>
              <i className="fas fa-arrow-left"></i>
            </button>
            
            <div className="chat-avatar-container">
              {currentGroup?.avatar ? (
                <img 
                  src={currentGroup.avatar} 
                  alt={currentGroup.name}
                  className="chat-user-avatar"
                />
              ) : (
                <div className={`group-avatar-generated ${getAvatarGradientClass(currentGroup?.name)}`}>
                  <span className="avatar-initials">
                    {getGroupInitials(currentGroup?.name)}
                  </span>
                </div>
              )}
              <div className="online-status-dot"></div>
            </div>
            
            <div className="chat-user-details">
              <h3 className="chat-user-name">{currentGroup?.name || 'Group Chat'}</h3>
              <p className="chat-user-status">
                {currentGroup?.members?.length || 1} members • {getTimeRemaining()}
              </p>
            </div>
          </div>
          
          <div className="chat-header-actions">
            <button 
              className="chat-action-btn" 
              title="Search Messages" 
              onClick={() => setShowMessageSearch(!showMessageSearch)}
            >
              <i className="fas fa-search"></i>
            </button>
            <button className="chat-action-btn" title="Group Info" onClick={() => setShowGroupInfo(true)}>
              <i className="fas fa-info-circle"></i>
            </button>
            <button className="chat-action-btn" title="More options">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Message Search Bar */}
      {showMessageSearch && (
        <div className="message-search-bar">
          <div className="search-input-container">
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="search-input"
            />
            <button className="search-clear-btn" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="search-results-info">
              {currentSearchIndex + 1} of {searchResults.length} results
              <div className="search-navigation">
                <button 
                  className="search-nav-btn" 
                  onClick={() => navigateSearchResults('up')}
                  disabled={searchResults.length <= 1}
                  title="Previous result"
                >
                  <i className="fas fa-chevron-up"></i>
                </button>
                <button 
                  className="search-nav-btn" 
                  onClick={() => navigateSearchResults('down')}
                  disabled={searchResults.length <= 1}
                  title="Next result"
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expiry Warning Banner */}
      {shouldShowExpiryWarning() && (
        <div className={`expiry-warning-banner ${getExpiryWarningType()}`}>
          <div className="warning-content">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{getExpiryWarningMessage()}</span>
            {(isGroupCreator() || isGroupAdmin()) && (
              <button className="extend-btn" onClick={() => setShowExtendModal(true)}>
                Extend
              </button>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Messages Container */}
      <div className="whatsapp-messages-container">
        <div className="messages-background"></div>
        <div className="messages-content">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="empty-chat-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Welcome to {currentGroup?.name || 'this group'}!</h3>
              <p>Start the conversation by sending the first message.</p>
            </div>
          ) : (
            <div className="messages-list" ref={refDisplay}>
              {messages.map((msg, index) => {
                // Fix sender ID comparison for groups too
                const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                const isSentByMe = senderId === auth.user._id;
                
                // Check if this message is currently highlighted in search
                const isSearchHighlight = searchResults.length > 0 && 
                  searchResults[currentSearchIndex]?._id === msg._id;
                
                // Check if message is selected
                const isSelected = selectedMessages.includes(msg._id);

                return (
                  <div 
                    key={msg._id} 
                    data-message-id={msg._id}
                    className={`message-wrapper ${isSentByMe ? 'sent' : 'received'} ${isSearchHighlight ? 'search-active' : ''} ${isSelected ? 'selected' : ''}`}
                    onContextMenu={(e) => handleRightClick(e, msg)}
                  >
                    {!isSentByMe && (
                      <div className="message-sender-name">
                        {msg.sender?.fullname || msg.sender?.username || 'Unknown User'}
                      </div>
                    )}
                    <div className="message-bubble">
                      <div className="message-content">
                        {msg.media && msg.media.length > 0 && (
                          <div className="message-media">
                            {msg.media.map((item, mediaIndex) => {
                              // Enhanced media type detection including base64
                              console.log('Media item:', item); // Debug log
                              
                              const isBase64Image = item.url?.startsWith('data:image/');
                              const isImageUrl = item.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
                              const isImageType = item.type?.startsWith('image');
                              const isImage = isBase64Image || isImageUrl || isImageType;
                              
                              const isBase64Video = item.url?.startsWith('data:video/');
                              const isVideoUrl = item.url?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i);
                              const isVideoType = item.type?.startsWith('video');
                              const isVideo = isBase64Video || isVideoUrl || isVideoType;
                              
                              return (
                                <div key={mediaIndex} className="media-item">
                                  {isImage ? (
                                    <img 
                                      src={item.url} 
                                      alt="shared image" 
                                      onClick={() => imageShow(item.url)}
                                      className="message-image"
                                      loading="lazy"
                                      onError={(e) => {
                                        console.error('Image failed to load:', item.url);
                                        e.target.style.display = 'none';
                                        const errorDiv = e.target.parentElement.querySelector('.image-error');
                                        if (errorDiv) errorDiv.style.display = 'flex';
                                      }}
                                      onLoad={(e) => {
                                        console.log('Image loaded successfully:', item.url);
                                        e.target.style.display = 'block';
                                        const errorDiv = e.target.parentElement.querySelector('.image-error');
                                        if (errorDiv) errorDiv.style.display = 'none';
                                      }}
                                    />
                                  ) : isVideo ? (
                                    <video 
                                      src={item.url} 
                                      controls 
                                      onClick={() => videoShow(item.url)}
                                      className="message-video"
                                      onError={(e) => {
                                        console.error('Video failed to load:', item.url);
                                      }}
                                    />
                                  ) : (
                                    <div className="message-file">
                                      <i className="fas fa-file"></i>
                                      <span>Unknown file type</span>
                                    </div>
                                  )}
                                  <div className="image-error" style={{ display: 'none' }}>
                                    <i className="fas fa-image"></i>
                                    <span>Image failed to load</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {msg.text && (
                          <p className="message-text">
                            {messageSearchQuery && msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase()) ? (
                              msg.text.split(new RegExp(`(${messageSearchQuery})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === messageSearchQuery.toLowerCase() ? 
                                  <mark key={i} className="search-highlight-text">{part}</mark> : part
                              )
                            ) : (
                              msg.text
                            )}
                          </p>
                        )}
                      </div>
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* WhatsApp Message Input */}
      <div className="whatsapp-message-input">
        <form onSubmit={handleSendMessage} className="message-input-form">
            <div className="input-container">
              <div className="text-input-wrapper">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${currentGroup?.name || 'group'}...`}
                className="message-text-input"
                rows="1"
              />
            </div>

            <div className="input-actions">
              <label className="attach-btn" htmlFor="group-file">
                <i className="fas fa-paperclip"></i>
                <input
                  type="file"
                  name="file"
                  id="group-file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleChangeMedia}
                  style={{ display: 'none' }}
                />
              </label>
              
              <button type="submit" className="send-btn" disabled={!text.trim() && media.length === 0}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Media Preview */}
      {media.length > 0 && (
        <div className="group-media-preview">
          {media.map((item, index) => (
            <div key={index} className="group-preview-item">
              {item.type?.startsWith('image') ? (
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

      {/* Group Sidebar */}
      {showGroupInfo && (
        <GroupSidebar 
          group={currentGroup}
          onClose={() => setShowGroupInfo(false)}
          showSettings={showGroupSettings}
        />
      )}

      {/* Group Settings Sidebar */}
      {showGroupSettings && (
        <GroupSidebar 
          group={currentGroup}
          onClose={() => setShowGroupSettings(false)}
          showSettings={true}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 10000
          }}
        >
          <div className="context-menu-item" onClick={() => selectMessage(contextMenu.message._id)}>
            <i className="fas fa-check-square"></i>
            <span>{selectedMessages.includes(contextMenu.message._id) ? 'Deselect' : 'Select'}</span>
          </div>
          {(contextMenu.message.sender === auth.user._id || contextMenu.message.sender._id === auth.user._id) && (
            <div className="context-menu-item delete" onClick={() => deleteMessage(contextMenu.message._id)}>
              <i className="fas fa-trash"></i>
              <span>Delete</span>
            </div>
          )}
          <div className="context-menu-item" onClick={() => {
            navigator.clipboard.writeText(contextMenu.message.text || 'Media message');
            closeContextMenu();
          }}>
            <i className="fas fa-copy"></i>
            <span>Copy</span>
          </div>
        </div>
      )}

      {/* Selection Toolbar */}
      {selectedMessages.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            <span>{selectedMessages.length} message{selectedMessages.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="selection-actions">
            <button className="selection-btn" onClick={() => setSelectedMessages([])}>
              <i className="fas fa-times"></i>
              Clear
            </button>
            <button className="selection-btn delete" onClick={deleteSelectedMessages}>
              <i className="fas fa-trash"></i>
              Delete ({selectedMessages.length})
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GroupChat;
