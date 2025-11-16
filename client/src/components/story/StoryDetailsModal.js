import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { viewStory, replyToStory } from '../../redux/actions/storyAction';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import '../../styles/story_details_modal.css';

const StoryDetailsModal = () => {
  const { auth, storyViewer } = useSelector(state => state);
  const dispatch = useDispatch();
  
  // All hooks must be called before any early returns
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const progressInterval = useRef(null);
  const viewedStories = useRef(new Set()); // Track viewed stories to prevent duplicate views
  const storyDuration = 5000; // 5 seconds per story
  
  // Get data from Redux state
  const userStories = storyViewer.userStories;
  const initialStoryIndex = storyViewer.initialStoryIndex || 0;
  const currentStory = userStories ? userStories.stories[currentStoryIndex] : null;

  // Auto-progress through stories
  useEffect(() => {
    if (!isPaused && currentStory && storyViewer.show) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (storyDuration / 100));
          
          if (newProgress >= 100) {
            // Handle next story logic here
            if (userStories && currentStoryIndex < userStories.stories.length - 1) {
              setCurrentStoryIndex(prev => prev + 1);
            } else {
              // Close modal when all stories are done
              dispatch({
                type: GLOBALTYPES.STORY_VIEWER,
                payload: {
                  show: false,
                  userStories: null,
                  initialStoryIndex: 0
                }
              });
            }
            return 0;
          }
          
          return newProgress;
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStoryIndex, isPaused, currentStory, storyViewer.show, userStories, dispatch]);

  // Mark story as viewed when it loads
  useEffect(() => {
    if (currentStory && auth.token && storyViewer.show) {
      const storyId = currentStory._id;
      if (!viewedStories.current.has(storyId)) {
        viewedStories.current.add(storyId);
        dispatch(viewStory(storyId, auth.token));
      }
    }
  }, [currentStory, dispatch, auth.token, storyViewer.show]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);

  // Reset story index when modal opens and cleanup when it closes
  useEffect(() => {
    if (storyViewer.show && userStories) {
      setCurrentStoryIndex(initialStoryIndex);
    } else if (!storyViewer.show) {
      // Clear viewed stories when modal closes
      viewedStories.current.clear();
    }
  }, [storyViewer.show, initialStoryIndex, userStories]);
  
  // Return null if modal is not shown
  if (!storyViewer.show || !userStories) {
    return null;
  }


  const handleClose = () => {
    dispatch({
      type: GLOBALTYPES.STORY_VIEWER,
      payload: {
        show: false,
        userStories: null,
        initialStoryIndex: 0
      }
    });
  };

  const handleNextStory = () => {
    if (userStories && currentStoryIndex < userStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      // Move to next user's stories or close
      handleClose();
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      // Move to previous user's stories or close
      handleClose();
    }
  };

  const handleStoryClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 2) {
      handlePreviousStory();
    } else {
      handleNextStory();
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    
    setIsSubmittingReply(true);
    try {
      const result = await dispatch(replyToStory(currentStory._id, replyText.trim(), auth.token));
      setReplyText('');
      setShowReplyInput(false);
      
      // Optionally close the modal after successful reply
      // setTimeout(() => handleClose(), 1500);
      
    } catch (error) {
      console.error('Error sending reply:', error);
      // Error is already handled by the action, just log it
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const storyDate = new Date(date);
    const diffInHours = Math.floor((now - storyDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - storyDate) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Format time remaining for the current story
  const formatTimeRemaining = (expiryDate) => {
    if (!expiryDate) return { text: 'Expired', shortText: 'Exp' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return { text: 'Expired', shortText: 'Exp' };
    
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHrs = Math.round(diffMins / 60);
    
    if (diffMins < 60) {
      return { 
        text: `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} left`,
        shortText: `${diffMins}m`
      };
    } else if (diffHrs < 24) {
      return { 
        text: `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hrs'} left`,
        shortText: `${diffHrs}h`
      };
    } else {
      const days = Math.round(diffHrs / 24);
      return { 
        text: `${days} ${days === 1 ? 'day' : 'days'} left`,
        shortText: `${days}d`
      };
    }
  };

  // Get time remaining for current story
  const currentTimeRemaining = currentStory ? formatTimeRemaining(currentStory.expiresAt) : null;

  if (!currentStory) {
    return null;
  }

  return (
    <div className="story-details-overlay" onClick={handleClose}>
      <div className="story-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="story-details-header">
          <div className="header-content">
            <div className="story-user-info">
              <img 
                src={userStories.user.avatar} 
                alt={userStories.user.fullname}
                className="story-user-avatar"
                onError={(e) => {
                  e.target.src = '/images/default-avatar.png';
                }}
              />
              <div className="story-user-details">
                <span className="story-user-name">
                  {userStories.user.username}
                  {currentTimeRemaining && (
                    <span className="story-time-remaining-header">
                      • {currentTimeRemaining.text}
                    </span>
                  )}
                </span>
                <span className="story-time-ago">{getTimeAgo(currentStory.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="story-header-actions">
            <button 
              className="story-action-btn pause-btn"
              onClick={handlePauseResume}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
            </button>
            <button 
              className="story-action-btn close-btn"
              onClick={handleClose}
              title="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Progress bars */}
        <div className="story-progress-container">
          {userStories.stories.map((_, index) => (
            <div key={index} className="story-progress-bar">
              <div 
                className="story-progress-fill"
                style={{
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Content */}
        <div className="story-details-body">
          <div className="story-media-container" onClick={handleStoryClick}>
            {currentStory.media && currentStory.media.length > 0 && currentStory.media[0].type === 'image' ? (
              <img 
                src={currentStory.media[0].url} 
                alt="Story content"
                className="story-media"
                onError={(e) => {
                  console.error('Image failed to load:', currentStory.media[0].url);
                  e.target.style.display = 'none';
                }}
                onLoad={() => console.log('Image loaded successfully:', currentStory.media[0].url)}
              />
            ) : currentStory.media && currentStory.media.length > 0 ? (
              <video 
                src={currentStory.media[0].url}
                className="story-media"
                autoPlay
                muted
                loop
                onError={(e) => {
                  console.error('Video failed to load:', currentStory.media[0].url);
                  e.target.style.display = 'none';
                }}
                onLoadedData={() => console.log('Video loaded successfully:', currentStory.media[0].url)}
              />
            ) : (
              <div className="story-no-media">
                <p>No media available</p>
                {currentStory.media && (
                  <p>Media array length: {currentStory.media.length}</p>
                )}
                <div className="story-time-remaining-overlay">
                  {formatTimeRemaining(currentStory.expiresAt)}
                </div>
              </div>
            )}
            
            {/* Caption overlay */}
            {currentStory.caption && (
              <div className="story-caption-overlay">
                <p>{currentStory.caption}</p>
              </div>
            )}

            {/* Navigation hints */}
            <div className="story-nav-hints">
              <div className="story-nav-hint left">
                <i className="fas fa-chevron-left"></i>
              </div>
              <div className="story-nav-hint right">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="story-details-footer">
          {!showReplyInput ? (
            <div className="story-footer-actions">
              <button 
                className="story-reply-btn"
                onClick={() => setShowReplyInput(true)}
              >
                <i className="fas fa-paper-plane"></i>
                Send message
              </button>
              
              {/* Story info */}
              <div className="story-info-actions">
                <span className="story-views-count">
                  <i className="fas fa-eye"></i>
                  {currentStory.totalViews || 0}
                </span>
                {currentStory.totalReplies > 0 && (
                  <span className="story-replies-count">
                    <i className="fas fa-comment"></i>
                    {currentStory.totalReplies}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="story-reply-input-container">
              <input
                type="text"
                placeholder="Reply to story..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="story-reply-input"
                autoFocus
              />
              <div className="story-reply-actions">
                <button 
                  className="story-reply-cancel"
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyText('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="story-reply-send"
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                >
                  {isSubmittingReply ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetailsModal;
