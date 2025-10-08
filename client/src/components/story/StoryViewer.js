import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { viewStory, replyToStory } from '../../redux/actions/storyAction';

const StoryViewer = ({ 
  userStories, 
  initialStoryIndex = 0, 
  onClose, 
  onNext, 
  onPrevious 
}) => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const progressInterval = useRef(null);
  const storyDuration = 5000; // 5 seconds per story
  const currentStory = userStories.stories[currentStoryIndex];

  // Auto-progress through stories
  useEffect(() => {
    if (!isPaused && currentStory) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (storyDuration / 100));
          
          if (newProgress >= 100) {
            handleNextStory();
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
  }, [currentStoryIndex, isPaused, currentStory]);

  // Mark story as viewed when it loads
  useEffect(() => {
    if (currentStory && auth.token) {
      dispatch(viewStory(currentStory._id, auth.token));
    }
  }, [currentStory, dispatch, auth.token]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);

  const handleNextStory = () => {
    if (currentStoryIndex < userStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      // Move to next user's stories
      if (onNext) {
        onNext();
      } else {
        onClose();
      }
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      // Move to previous user's stories
      if (onPrevious) {
        onPrevious();
      } else {
        onClose();
      }
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
      await dispatch(replyToStory(currentStory._id, replyText.trim(), auth.token));
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error sending reply:', error);
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

  if (!currentStory) {
    return null;
  }

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-container" onClick={(e) => e.stopPropagation()}>
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

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-user-info">
            <img 
              src={userStories.user.avatar} 
              alt={userStories.user.fullname}
              className="story-user-avatar"
            />
            <div className="story-user-details">
              <span className="story-user-name">{userStories.user.username}</span>
              <span className="story-time-ago">{getTimeAgo(currentStory.createdAt)}</span>
            </div>
          </div>
          
          <div className="story-viewer-actions">
            <button 
              className="story-action-btn pause-btn"
              onClick={handlePauseResume}
            >
              <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
            </button>
            <button 
              className="story-action-btn close-btn"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Story content */}
        <div className="story-content" onClick={handleStoryClick}>
          {currentStory.media.type === 'image' ? (
            <img 
              src={currentStory.media.url} 
              alt="Story content"
              className="story-media"
            />
          ) : (
            <video 
              src={currentStory.media.url}
              className="story-media"
              autoPlay
              muted
              loop
            />
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

        {/* Footer */}
        <div className="story-viewer-footer">
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
                  {currentStory.totalViews}
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

export default StoryViewer;
