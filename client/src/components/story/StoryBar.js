import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getStoriesFeed } from '../../redux/actions/storyAction';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import '../../styles/story_bar.css';

const StoryBar = () => {
  const { auth, stories } = useSelector(state => state);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (auth.token) {
      dispatch(getStoriesFeed(auth.token));
    }
  }, [dispatch, auth.token]);

  const handleAddStory = () => {
    dispatch({ type: GLOBALTYPES.STORY, payload: true });
  };

  const handleViewStory = (userStories, storyIndex = 0) => {
    dispatch({
      type: GLOBALTYPES.STORY_VIEWER,
      payload: {
        show: true,
        userStories,
        initialStoryIndex: storyIndex
      }
    });
  };

  // Get current user's stories
  const currentUserStories = stories.stories?.find(userStories => 
    userStories.user._id === auth.user?._id
  );

  // Get other users' stories (excluding current user)
  const otherUsersStories = stories.stories?.filter(userStories => 
    userStories.user._id !== auth.user?._id
  ) || [];

  if (!auth.token) return null;

  return (
    <div className="modern-story-container">
      <div className="story-bar-header">
        <h3 className="story-bar-title">People to Follow</h3>
        <a href="/explore/people" className="story-bar-see-all">See All</a>
      </div>
      <div className="story-scroll-area">
        {/* Always show Add Story button */}
        <div className="story-card" onClick={handleAddStory}>
          <div className="story-avatar-container">
            <div className="story-avatar-wrapper">
              <img
                src={auth.user?.avatar || '/images/default-avatar.png'}
                alt="Add story"
                className="story-avatar"
                onError={(e) => {
                  e.target.src = '/images/default-avatar.png';
                }}
              />
            </div>
          </div>
          <div className="story-label">Add Story</div>
        </div>

        {/* Show "Your Story" if there are stories */}
        {currentUserStories?.stories?.length > 0 && (
          <div 
            className="story-card"
            onClick={() => handleViewStory(currentUserStories, 0)}
          >
            <div className="story-avatar-container">
              <div className="story-avatar-wrapper">
                <img
                  src={currentUserStories.latestStory.media[0]?.url || auth.user?.avatar || '/images/default-avatar.png'}
                  alt="Your story"
                  className="story-avatar"
                  onError={(e) => {
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
              </div>
            </div>
            <div className="story-label">Your Story</div>
          </div>
        )}

        {/* Other Users' Stories */}
        {otherUsersStories.map((userStories) => {
          if (!userStories || !userStories.latestStory) return null;
          
          return (
            <div 
              key={`story-${userStories.user._id}`}
              className="story-card"
              onClick={() => handleViewStory(userStories, 0)}
            >
              <div className="story-avatar-container">
                <div className={`story-avatar-wrapper ${userStories.hasUnviewed ? 'unviewed' : ''}`}>
                  <img
                    src={userStories.user.avatar || '/images/default-avatar.png'}
                    alt={userStories.user.username}
                    className="story-avatar"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                </div>
              </div>
              <div className="story-label">
                {userStories.user.username}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoryBar;