import React, { useEffect, useState, useRef } from 'react';
import UserCard from "../UserCard";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import MsgDisplay from './MsgDisplay';
import Icons from "../Icons";
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import { imageShow, videoShow } from '../../utils/mediaShow';
import { imageUpload } from '../../utils/imageUpload';
import { addMessage, getMessages, MESSAGE_TYPES } from '../../redux/actions/messageAction';
import LoadIcon from '../../images/loading.gif';

const RightSide = () => {
    const { auth, message, theme, socket } = useSelector(state => state);
    const dispatch = useDispatch();
    const [user, setUser] = useState([]);
    const [text, setText] = useState('');
    const [page, setPage] = useState(0);
    const [data, setData] = useState([]);
    const { id } = useParams();
    const [media, setMedia] = useState([]);
    const [loadMedia, setLoadMedia] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

    const refDisplay = useRef();
    const pageEnd = useRef();

    useEffect(() => {
      if (id) {
        console.log('Conversation changed to:', id);
        // Clear previous messages first
        dispatch({ type: MESSAGE_TYPES.GET_MESSAGES, payload: { messages: [], result: 0 } });
        // Then fetch messages for this conversation
        dispatch(getMessages({ auth, id, page: 1 }));
      }
    }, [id, auth, dispatch]);

    useEffect(() => {
      console.log('Filtering messages for conversation:', id);
      console.log('All messages in state:', message.data);
      console.log('Current user ID:', auth.user._id);
      
      const newData = message.data.filter(
        (item) => {
          const isMyMessage = item.sender._id === auth.user._id && item.recipient._id === id;
          const isTheirMessage = item.sender._id === id && item.recipient._id === auth.user._id;
          const isMyMessageAlt = item.sender === auth.user._id && item.recipient === id;
          const isTheirMessageAlt = item.sender === id && item.recipient === auth.user._id;
          
          return isMyMessage || isTheirMessage || isMyMessageAlt || isTheirMessageAlt;
        }
      );
      
      console.log('Filtered messages:', newData);
      setData(newData);
    }, [message.data, auth.user._id, id]);

    useEffect(() => {
      const newUser = message.users.find((user) => user._id === id);
      if (newUser) {
        setUser(newUser);
      }
    }, [message.users, id]);

    const handleChangeMedia = (e) => {
      const files = [...e.target.files];
    let err = "";
    let newMedia = [];

    files.forEach((file) => {
      if (!file) {
        return (err = "File does not exist.");
      }
      if (file.size > 1024 * 1024 * 5) {
        return (err = "Image size must be less than 5 mb.");
      }
      return newMedia.push(file);
    });
    if (err) {
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err } });
    }
    setMedia([...media, ...newMedia]);
    };

    const handleDeleteMedia = (index) => {
      const newArr = [...media];
      newArr.splice(index, 1);
      setMedia(newArr);
    };

    // typing indicator debounce
    const typingTimeout = useRef();

    const handleInputChange = (e) => {
      const value = e.target.value;
      setText(value);
      if (!id) return;
      // emit typing start
      socket.emit('typing', { from: auth.user._id, to: id });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stopTyping', { from: auth.user._id, to: id });
      }, 1200);
    };

    const handleEmojiClick = (emoji) => {
      setText(prev => prev + emoji);
      setShowEmojiPicker(false);
    };

    const toggleEmojiPicker = () => {
      setShowEmojiPicker(!showEmojiPicker);
    };

    const handleMessageSearch = (query) => {
      setMessageSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        setCurrentSearchIndex(0);
        return;
      }

      const results = data.filter((msg, index) => 
        msg.text && msg.text.toLowerCase().includes(query.toLowerCase())
      ).map((msg, resultIndex) => {
        const originalIndex = data.findIndex(m => m._id === msg._id || 
          (m.text === msg.text && m.createdAt === msg.createdAt));
        return { ...msg, originalIndex, resultIndex };
      });

      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      if (results.length > 0) {
        scrollToMessage(results[0].originalIndex);
      }
    };

    const scrollToMessage = (messageIndex) => {
      const messageElements = document.querySelectorAll('.message-wrapper');
      if (messageElements[messageIndex]) {
        messageElements[messageIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        // Highlight the message temporarily
        messageElements[messageIndex].classList.add('search-highlight');
        setTimeout(() => {
          messageElements[messageIndex].classList.remove('search-highlight');
        }, 2000);
      }
    };

    const navigateSearchResults = (direction) => {
      if (searchResults.length === 0) return;
      
      let newIndex;
      if (direction === 'next') {
        newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
      } else {
        newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
      }
      
      setCurrentSearchIndex(newIndex);
      scrollToMessage(searchResults[newIndex].originalIndex);
    };

    const toggleMessageSearch = () => {
      setShowMessageSearch(!showMessageSearch);
      if (!showMessageSearch) {
        setMessageSearchQuery('');
        setSearchResults([]);
        setCurrentSearchIndex(0);
      }
    };

    const handleSubmit = async e => {
      e.preventDefault();
      if(!text.trim() && media.length === 0) return;
      
      const messageText = text;
      const messageMedia = [...media];
      
      setText('');
      setMedia([]);
      setLoadMedia(true);

      let newArr = [];
      if(messageMedia.length > 0) newArr = await imageUpload(messageMedia);

      const msg = {
        sender: auth.user._id,
        recipient: id,
        text: messageText,
        media: newArr,
        createdAt: new Date().toISOString()
      }
      
      console.log('Sending message:', msg);
      setLoadMedia(false);
      await dispatch(addMessage({msg, auth, socket}));
      if (refDisplay.current) {
        refDisplay.current.scrollIntoView({
          behaviour: "smooth",
          block: "end",
        });
      }
    };

    useEffect(() => {
      if (id) {
        const getMessagesData = async () => {

          dispatch({type: MESSAGE_TYPES.GET_MESSAGES, payload: { messages: [] } });
          
          setPage(1);
          await dispatch(getMessages({ auth, id }));
          if(refDisplay.current){
            refDisplay.current.scrollIntoView({behaviour: 'smooth', block: 'end'});
          }
        };

        getMessagesData();
      }
    }, [id, dispatch, auth]);

    // load more

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setPage((p) => p + 1);
          }
        },
        {
          threshold: 0.1,
        }
      );
      observer.observe(pageEnd.current);
    }, [setPage]);

    useEffect(() => {
      if (message.resultData >= (page - 1) * 9 && page > 1) {
        dispatch(getMessages({ auth, id, page }));
      }
    }, [message.resultData, page, id, auth, dispatch]);

    useEffect(() => {
      if (refDisplay.current) {
        refDisplay.current.scrollIntoView({
          behaviour: "smooth",
          block: "end",
        });
      }
    }, [text])

    return (
      <div className="whatsapp-chat-container">
        {/* Chat Header */}
        <div className="whatsapp-chat-header">
          {user.length !== 0 ? (
            <div className="chat-header-content">
              <div className="chat-user-info">
                <div className="chat-avatar-container">
                  <img 
                    src={user.avatar} 
                    alt={user.username}
                    className="chat-user-avatar"
                  />
                  <div className="online-status-dot"></div>
                </div>
                <div className="chat-user-details">
                  <h3 className="chat-user-name">{user.fullname}</h3>
                  <p className="chat-user-status">
                    {message.typingUsers.includes(id) ? 'typing...' : 'last seen recently'}
                  </p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button 
                  className="chat-action-btn" 
                  title="Search in conversation"
                  onClick={toggleMessageSearch}
                >
                  <i className="fas fa-search"></i>
                </button>
                <button className="chat-action-btn" title="More options">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-header-loading">
              <div className="loading-skeleton"></div>
            </div>
          )}
        </div>

        {/* Message Search Bar */}
        {showMessageSearch && (
          <div className="message-search-bar">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearchQuery}
                onChange={(e) => handleMessageSearch(e.target.value)}
                className="message-search-input"
                autoFocus
              />
              <button 
                className="close-search-btn"
                onClick={toggleMessageSearch}
                title="Close search"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {messageSearchQuery && (
              <div className="search-results-info">
                {searchResults.length > 0 ? (
                  <div className="search-navigation">
                    <span className="search-count">
                      {currentSearchIndex + 1} of {searchResults.length}
                    </span>
                    <div className="search-nav-buttons">
                      <button 
                        className="search-nav-btn"
                        onClick={() => navigateSearchResults('prev')}
                        disabled={searchResults.length <= 1}
                        title="Previous result"
                      >
                        <i className="fas fa-chevron-up"></i>
                      </button>
                      <button 
                        className="search-nav-btn"
                        onClick={() => navigateSearchResults('next')}
                        disabled={searchResults.length <= 1}
                        title="Next result"
                      >
                        <i className="fas fa-chevron-down"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-results">
                    <i className="fas fa-search"></i>
                    <span>No results found</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="whatsapp-messages-container">
          <div className="messages-background"></div>
          <div className="messages-content">
            <button style={{marginTop: '-25px', opacity: 0}} ref={pageEnd}>Load..</button>
            
            {data.length === 0 ? (
              <div className="chat-empty-state">
                <div className="empty-chat-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <h3>Start a conversation</h3>
                <p>Send a message to {user.fullname || 'this user'} to begin chatting</p>
              </div>
            ) : (
              <div className="messages-list" ref={refDisplay}>
                {data.map((msg, index) => {
                  console.log('Rendering message:', msg);
                  console.log('Sender:', msg.sender, 'Auth user:', auth.user._id);
                  console.log('Is sent message:', (msg.sender._id || msg.sender) === auth.user._id);
                  return (
                  <div key={index} className={`message-wrapper ${(msg.sender._id || msg.sender) === auth.user._id ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                      <MsgDisplay user={(msg.sender._id || msg.sender) === auth.user._id ? auth.user : user} msg={msg} theme={theme} />
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {(msg.sender._id || msg.sender) === auth.user._id && (
                          <div className="message-status">
                            <i className={`fas fa-check${msg.messageStatus === 'read' ? '-double status-read' : msg.messageStatus === 'delivered' ? '-double status-delivered' : ' status-sent'}`}></i>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
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
        {/* Message Input */}
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
}

export default RightSide
