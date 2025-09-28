import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteDataAPI, getDataAPI, postDataAPI } from '../../utils/fetchData';
import { imageUpload, checkImage } from '../../utils/imageUpload';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import StorySettingsModal from './StorySettingsModal';

const StoriesBar = () => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileRef = useRef();

  const fetchStories = async () => {
    try {
      setLoading(true);
      console.log('Fetching stories...');
      const res = await getDataAPI('stories', auth.token);
      console.log('Stories response:', res.data);
      setStories(res.data.stories || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to load stories' } });
    } finally {
      setLoading(false);
    }
  };

  const onPickFiles = () => fileRef.current?.click();

  const handleDeleteStory = async (storyId) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        setLoading(true);
        await deleteDataAPI(`story/${storyId}`, auth.token);
        await fetchStories();
        dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'Story deleted' } });
      } catch (err) {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to delete story' } });
      }
      finally {
        setLoading(false);
      }
    }
  }

  const onFilesSelected = async (e) => {
    const files = [...e.target.files];
    if (files.length === 0) return;

    // validate images (only jpeg/png per current imageUpload)
    for (const f of files) {
      const err = checkImage(f);
      if (err) {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err } });
        return;
      }
    }

    // Store selected files and show settings modal
    setSelectedFiles(files);
    setShowSettingsModal(true);
  };

  const handleStoryCreate = async (storySettings) => {
    try {
      setLoading(true);
      setShowSettingsModal(false);
      
      const uploaded = await imageUpload(selectedFiles);
      if (!uploaded || uploaded.length === 0) {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: 'No media uploaded' } });
        return;
      }

      const storyData = {
        media: uploaded,
        caption: storySettings.caption,
        visibility: storySettings.visibility,
        expiryDuration: storySettings.expiryDuration,
        allowReplies: storySettings.allowReplies,
        closeFriends: storySettings.closeFriends
      };

      await postDataAPI('story', storyData, auth.token);
      dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'Story shared successfully!' } });
      await fetchStories();
      
      // Reset
      setSelectedFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to share story' } });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSettingsModal(false);
    setSelectedFiles([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  useEffect(() => {
    if (auth.token) fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  return (
    <div className="stories-carousel">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={onFilesSelected}
        style={{ display: 'none' }}
      />
      
      <div className="add-story-btn" onClick={onPickFiles} disabled={loading}>
        <div className="add-story-icon">
          <i className="fas fa-plus"></i>
        </div>
        <span className="add-story-text">Add Story</span>
      </div>
      
      {loading && (
        <div className="stories-loading">
          <div className="loading-spinner-small"></div>
          <span>Loading...</span>
        </div>
      )}
      
      <div className="stories-scroll">
        {stories.map(story => {
          const timeRemaining = story.expiresAt ? new Date(story.expiresAt) - new Date() : 0;
          const isExpiringSoon = timeRemaining > 0 && timeRemaining < 2 * 60 * 60 * 1000; // 2 hours
          const isExpired = timeRemaining <= 0;
          
          return (
            <div key={story._id} className={`story-item ${isExpiringSoon ? 'expiring-soon' : ''} ${isExpired ? 'expired' : ''}`}>
              {auth.user._id === story.user._id && (
                <div className="story-controls">
                  <button 
                    className="story-delete-btn"
                    onClick={() => handleDeleteStory(story._id)}
                    title="Delete story"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  {story.visibility === 'CLOSE_FRIENDS' && (
                    <div className="story-badge close-friends-badge">
                      <i className="fas fa-heart"></i>
                    </div>
                  )}
                  {story.visibility === 'PUBLIC' && (
                    <div className="story-badge public-badge">
                      <i className="fas fa-globe"></i>
                    </div>
                  )}
                </div>
              )}
              
              <div className="story-avatar">
                <div className={`story-ring ${story.visibility === 'CLOSE_FRIENDS' ? 'close-friends-ring' : ''}`}>
                  <img
                    src={(story.media && story.media[0] && story.media[0].url) || story.user?.avatar || auth.user.avatar}
                    alt="story"
                    className="story-image"
                  />
                </div>
              </div>
              
              <div className="story-info">
                <span className="story-username">{story.user?.username || 'story'}</span>
                {timeRemaining > 0 && (
                  <span className="story-time-remaining">
                    {Math.ceil(timeRemaining / (60 * 60 * 1000))}h left
                  </span>
                )}
                {isExpired && (
                  <span className="story-expired">Expired</span>
                )}
              </div>
              
              {story.caption && (
                <div className="story-caption-preview" title={story.caption}>
                  {story.caption.length > 30 ? `${story.caption.substring(0, 30)}...` : story.caption}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Story Settings Modal */}
      <StorySettingsModal
        isOpen={showSettingsModal}
        onClose={handleModalClose}
        onConfirm={handleStoryCreate}
        selectedFiles={selectedFiles}
      />
    </div>
  );
};

export default StoriesBar;
