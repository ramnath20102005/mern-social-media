import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getStoriesFeed } from '../../redux/actions/storyAction';
import AddStoryModal from './AddStoryModal';
import StoryViewer from './StoryViewer';

const StoryBar = () => {
  const { auth, story } = useSelector(state => state);
  const dispatch = useDispatch();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    if (auth.token) {
      dispatch(getStoriesFeed(auth.token));
    }
  }, [dispatch, auth.token]);

  const handleAddStory = () => {
    setShowAddModal(true);
  };

  const handleViewStory = (userStories, storyIndex = 0) => {
    setSelectedUser(userStories);
    setSelectedStoryIndex(storyIndex);
    setShowViewer(true);
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

  if (!story.stories || story.stories.length === 0) {
    return (
      <div className="story-bar-container">
        <div className="story-bar">
          {/* Add Story Button */}
          <div className="story-item add-story-item" onClick={handleAddStory}>
            <div className="story-ring add-story-ring">
              <div className="story-avatar add-story-avatar">
                <img src={auth.user?.avatar} alt="Your story" />
                <div className="add-story-plus">
                  <i className="fas fa-plus"></i>
                </div>
              </div>
            </div>
            <div className="story-info">
              <span className="story-username">Your story</span>
              <span className="story-time">Add story</span>
            </div>
          </div>
        </div>

        {showAddModal && (
          <AddStoryModal 
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="story-bar-container">
      <div className="story-bar">
        {/* Add Story Button */}
        <div className="story-item add-story-item" onClick={handleAddStory}>
          <div className="story-ring add-story-ring">
            <div className="story-avatar add-story-avatar">
              <img src={auth.user?.avatar} alt="Your story" />
              <div className="add-story-plus">
                <i className="fas fa-plus"></i>
              </div>
            </div>
          </div>
          <div className="story-info">
            <span className="story-username">Your story</span>
            <span className="story-time">Add story</span>
          </div>
        </div>

        {/* Stories from feed */}
        {story.stories.map((userStories, index) => {
          const latestStory = userStories.latestStory;
          const timeRemaining = getTimeRemaining(latestStory.expiryDate);
          const expiringSoon = isExpiringSoon(latestStory.expiryDate);
          
          return (
            <div 
              key={userStories.user._id} 
              className={`story-item ${timeRemaining.expired ? 'expired' : ''} ${expiringSoon ? 'expiring-soon' : ''}`}
              onClick={() => !timeRemaining.expired && handleViewStory(userStories)}
            >
              <div className={`story-ring ${userStories.hasUnviewed ? 'unviewed' : 'viewed'} ${latestStory.visibility === 'close_friends' ? 'close-friends' : ''}`}>
                <div className="story-avatar">
                  <img src={userStories.user.avatar} alt={userStories.user.fullname} />
                </div>
              </div>
              
              <div className="story-info">
                <span className="story-username">{userStories.user.username}</span>
                <span className={`story-time ${timeRemaining.expired ? 'expired' : ''}`}>
                  {timeRemaining.text}
                </span>
              </div>

              {/* Story badges */}
              <div className="story-badges">
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

      {/* Modals */}
      {showAddModal && (
        <AddStoryModal 
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showViewer && selectedUser && (
        <StoryViewer
          userStories={selectedUser}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => {
            setShowViewer(false);
            setSelectedUser(null);
            setSelectedStoryIndex(0);
          }}
          onNext={(nextUser) => {
            // Find next user in the stories array
            const currentIndex = story.stories.findIndex(s => s.user._id === selectedUser.user._id);
            const nextIndex = currentIndex + 1;
            if (nextIndex < story.stories.length) {
              setSelectedUser(story.stories[nextIndex]);
              setSelectedStoryIndex(0);
            }
          }}
          onPrevious={(prevUser) => {
            // Find previous user in the stories array
            const currentIndex = story.stories.findIndex(s => s.user._id === selectedUser.user._id);
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) {
              setSelectedUser(story.stories[prevIndex]);
              setSelectedStoryIndex(0);
            }
          }}
        />
      )}
    </div>
  );
};

export default StoryBar;
