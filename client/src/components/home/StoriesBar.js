import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteDataAPI, getDataAPI, postDataAPI } from '../../utils/fetchData';
import { imageUpload, checkImage } from '../../utils/imageUpload';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';

const StoriesBar = () => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await getDataAPI('stories', auth.token);
      setStories(res.data.stories);
    } catch (err) {
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

    try {
      setLoading(true);
      const uploaded = await imageUpload(files);
      if (!uploaded || uploaded.length === 0) {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: 'No media uploaded' } });
        return;
      }
      await postDataAPI('story', { media: uploaded }, auth.token);
      dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'Story added' } });
      await fetchStories();
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to add story' } });
    } finally {
      setLoading(false);
    }
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
        {stories.map(story => (
          <div key={story._id} className="story-item">
            {auth.user._id === story.user._id && (
              <button 
                className="story-delete-btn"
                onClick={() => handleDeleteStory(story._id)}
                title="Delete story"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
            <div className="story-avatar">
              <div className="story-ring">
                <img
                  src={(story.media && story.media[0] && story.media[0].url) || auth.user.avatar}
                  alt="story"
                  className="story-image"
                />
              </div>
            </div>
            <span className="story-username">{story.user?.username || 'story'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesBar;
