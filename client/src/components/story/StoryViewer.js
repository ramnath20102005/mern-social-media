import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaTimes, FaChevronLeft, FaChevronRight, FaHeart, FaShare, FaComment } from 'react-icons/fa';

const StoryViewer = ({ show, onHide, stories = [], currentIndex = 0 }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    setCurrentStoryIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (!show || isPaused) return;

    const duration = 5000; // 5 seconds per story
    const startTime = Date.now();
    const interval = 50; // Update progress every 50ms
    let animationFrameId;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        goToNext();
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [show, currentStoryIndex, isPaused]);

  const goToNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onHide();
    }
  };

  const goToPrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      fullscreen="md-down"
      className="story-viewer"
    >
      <div className="story-container">
        <div className="progress-bars">
          {stories.map((_, index) => (
            <div key={index} className="progress-container">
              <div 
                className={`progress ${index === currentStoryIndex ? 'active' : ''}`}
                style={{ 
                  width: `${index === currentStoryIndex ? progress : 
                          index < currentStoryIndex ? 100 : 0}%` 
                }}
              />
            </div>
          ))}
        </div>

        <div className="story-header">
          <div className="user-info">
            <img 
              src={currentStory.user?.avatar || '/default-avatar.png'} 
              alt={currentStory.user?.name || 'User'} 
              className="user-avatar" 
            />
            <span className="username">{currentStory.user?.name || 'User'}</span>
            <span className="time-ago">{currentStory.timeAgo || 'Now'}</span>
          </div>
          <button className="close-btn" onClick={onHide}>
            <FaTimes />
          </button>
        </div>

        <div 
          className="story-content"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {currentStory.type === 'image' ? (
            <img 
              src={currentStory.url} 
              alt="Story" 
              className="story-media" 
            />
          ) : (
            <video 
              src={currentStory.url} 
              className="story-media" 
              autoPlay 
              controls={isPaused}
              onEnded={goToNext}
            />
          )}

          {stories.length > 1 && (
            <>
              <button 
                className={`nav-btn prev ${currentStoryIndex === 0 ? 'disabled' : ''}`}
                onClick={goToPrev}
                disabled={currentStoryIndex === 0}
              >
                <FaChevronLeft />
              </button>
              <button 
                className={`nav-btn next ${currentStoryIndex === stories.length - 1 ? 'disabled' : ''}`}
                onClick={goToNext}
                disabled={currentStoryIndex === stories.length - 1}
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>

        <div className="story-footer">
          <div className="caption">{currentStory.caption}</div>
          <div className="actions">
            <button className="action-btn">
              <FaHeart className="me-1" />
              {currentStory.likes || 0}
            </button>
            <button className="action-btn">
              <FaComment className="me-1" />
              Reply
            </button>
            <button className="action-btn">
              <FaShare className="me-1" />
              Share
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StoryViewer;
