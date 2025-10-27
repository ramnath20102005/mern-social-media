import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getStoriesFeed } from '../../redux/actions/storyAction';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';

const StoryBar = () => {
  const { auth, stories } = useSelector(state => state);
  const dispatch = useDispatch();
  

  useEffect(() => {
    if (auth.token) {
      console.log('Fetching stories feed...');
      dispatch(getStoriesFeed(auth.token));
    }
  }, [dispatch, auth.token]);

  // Debug log
  useEffect(() => {
    console.log('Stories state:', stories);
  }, [stories]);

  const handleAddStory = () => {
    dispatch({ type: GLOBALTYPES.STORY, payload: true });
  };

  const handleViewStory = (userStories, storyIndex = 0) => {
    dispatch({
      type: GLOBALTYPES.STORY_VIEWER,
      payload: {
        show: true,
        userStories: userStories,
        initialStoryIndex: storyIndex
      }
    });
  };

  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const remaining = expiry - now;
    
    if (remaining <= 0) {
      return { expired: true, text: 'Expired' };
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { expired: false, text: `${days}d left` };
    } else if (hours > 0) {
      return { expired: false, text: `${hours}h left` };
    } else {
      return { expired: false, text: `${minutes}m left` };
    }
  };

  const isExpiringSoon = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const remaining = expiry - now;
    const hoursRemaining = remaining / (1000 * 60 * 60);
    return hoursRemaining <= 2 && hoursRemaining > 0;
  };

  // Show loading state
  if (stories.loading) {
    return (
      <div className="modern-story-container">
        <div className="story-scroll-area">
          {/* Add Story Card */}
          <div className="story-card add-story-card" onClick={handleAddStory}>
            <div className="story-avatar-container">
              <div className="story-avatar-wrapper">
                <img src={auth.user?.avatar} alt="Your story" className="story-avatar" />
                <div className="add-story-icon">
                  <i className="fas fa-plus"></i>
                </div>
              </div>
            </div>
            <div className="story-label">
              <span className="story-text">Add Story</span>
            </div>
          </div>
          
          {/* Loading skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} className="story-card">
              <div className="story-avatar-container">
                <div className="story-avatar-wrapper loading-skeleton">
                  <div className="story-avatar loading-skeleton"></div>
                </div>
              </div>
              <div className="story-label">
                <span className="story-text loading-skeleton">Loading...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state with just add story button
  if (!stories || !stories.stories || stories.stories.length === 0) {
    return (
      <div className="modern-story-container">
        <div className="story-scroll-area">
          {/* Add Story Card */}
          <div className="story-card add-story-card" onClick={handleAddStory}>
            <div className="story-avatar-container">
              <div className="story-avatar-wrapper">
                <img src={auth.user?.avatar} alt="Your story" className="story-avatar" />
                <div className="add-story-icon">
                  <i className="fas fa-plus"></i>
                </div>
              </div>
            </div>
            <div className="story-label">
              <span className="story-text">Add Story</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user has stories
  const currentUserStories = stories.stories?.find(userStories => 
    userStories.user._id === auth.user._id
  );

  return (
    <div className="modern-story-container">
      <div className="story-scroll-area">
        {/* Current User Story Card */}
        {currentUserStories ? (
          // User has stories - show their story with ring
          <div 
            className="story-card user-story-card current-user-story"
            onClick={() => handleViewStory(currentUserStories)}
          >
            <div className="story-avatar-container">
              <div className="story-avatar-wrapper unviewed">
                <img src={auth.user?.avatar} alt="Your story" className="story-avatar" />
                {currentUserStories.storyCount > 1 && (
                  <div className="story-badge count">
                    {currentUserStories.storyCount}
                  </div>
                )}
              </div>
            </div>
            <div className="story-label">
              <span className="story-text">Your story</span>
            </div>
          </div>
        ) : (
          // User has no stories - show add story button
          <div className="story-card add-story-card" onClick={handleAddStory}>
            <div className="story-avatar-container">
              <div className="story-avatar-wrapper">
                <img src={auth.user?.avatar} alt="Your story" className="story-avatar" />
                <div className="add-story-icon">
                  <i className="fas fa-plus"></i>
                </div>
              </div>
            </div>
            <div className="story-label">
              <span className="story-text">Add Story</span>
            </div>
          </div>
        )}

        {/* Other Users' Stories */}
        {stories.stories && stories.stories
          .filter(userStories => userStories.user._id !== auth.user._id) // Exclude current user
          .map((userStories, index) => {
          // Safety check for latestStory
          if (!userStories || !userStories.latestStory) {
            return null;
          }
          
          const latestStory = userStories.latestStory;
          const timeRemaining = getTimeRemaining(latestStory.expiresAt || latestStory.expiryDate);
          const expiringSoon = isExpiringSoon(latestStory.expiresAt || latestStory.expiryDate);
          
          return (
            <div 
              key={`story-${userStories.user._id}-${index}`} 
              className={`story-card user-story-card ${timeRemaining.expired ? 'expired' : ''} ${expiringSoon ? 'expiring-soon' : ''}`}
              onClick={() => !timeRemaining.expired && handleViewStory(userStories)}
            >
              <div className="story-avatar-container">
                <div className={`story-avatar-wrapper ${userStories.hasUnviewed ? 'unviewed' : 'viewed'} ${latestStory.visibility === 'close_friends' ? 'close-friends' : ''}`}>
                  <img src={userStories.user.avatar} alt={userStories.user.fullname} className="story-avatar" />
                  
                  {/* Story badges */}
                  {latestStory.visibility === 'close_friends' && (
                    <div className="story-badge close-friends">
                      <i className="fas fa-heart"></i>
                    </div>
                  )}
                  {latestStory.visibility === 'public' && (
                    <div className="story-badge public">
                      <i className="fas fa-globe"></i>
                    </div>
                  )}
                  {userStories.storyCount > 1 && (
                    <div className="story-badge count">
                      {userStories.storyCount}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="story-label">
                <span className="story-text">{userStories.user.username}</span>
                <span className={`story-time ${timeRemaining.expired ? 'expired' : ''}`}>
                  {timeRemaining.text}
                </span>
              </div>

              {/* Caption preview */}
              {latestStory.caption && (
                <div className="story-caption-preview" title={latestStory.caption}>
                  {latestStory.caption}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
    </div>
  );
};


export default StoryBar;
