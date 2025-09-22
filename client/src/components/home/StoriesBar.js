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
    <div className="d-flex align-items-center" style={{ overflowX: 'auto', gap: '12px' }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={onFilesSelected}
        style={{ display: 'none' }}
      />
      <button className="btn-1 outer-shadow hover-in-shadow" onClick={onPickFiles} disabled={loading}>
        + Add Story
      </button>
      {loading && <span className="text-muted">Loading stories...</span>}
      {stories.map(story => (
        <div key={story._id} className="d-flex flex-column align-items-center story-item" style={{ position: 'relative' }}>
          {auth.user._id === story.user._id &&
            <span className="material-icons text-danger" 
              style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', zIndex: 1, backgroundColor: 'white', borderRadius: '50%' }}
              onClick={() => handleDeleteStory(story._id)}>
              remove_circle
            </span>
          }
          <div
            className="outer-shadow"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={(story.media && story.media[0] && story.media[0].url) || auth.user.avatar}
              alt="story"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <small className="mt-1">{story.user?.username || 'story'}</small>
        </div>
      ))}
    </div>
  );
};

export default StoriesBar;
