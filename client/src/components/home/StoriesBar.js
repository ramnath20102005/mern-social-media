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
  const [durationHours, setDurationHours] = useState(24); // how long the story is visible
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [tempDuration, setTempDuration] = useState(24);
  const [now, setNow] = useState(Date.now());
  const fileRef = useRef();
  const mountedRef = useRef(false);

  const fetchStories = async () => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);
      const res = await getDataAPI('stories', auth.token);
      if (!mountedRef.current) return;
      setStories(res.data.stories);
    } catch (err) {
      if (!mountedRef.current) return;
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to load stories' } });
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  };

  const onPickFiles = () => fileRef.current?.click();

  const handleDeleteStory = async (storyId) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        if (!mountedRef.current) return;
        setLoading(true);
        await deleteDataAPI(`story/${storyId}`, auth.token);
        if (!mountedRef.current) return;
        await fetchStories();
        if (!mountedRef.current) return;
        dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'Story deleted' } });
      } catch (err) {
        if (!mountedRef.current) return;
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to delete story' } });
      }
      finally {
        if (!mountedRef.current) return;
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

    // Store files and open duration modal using current dropdown as default
    setPendingFiles(files);
    setTempDuration(durationHours);
    setShowDurationModal(true);
  };

  const handleConfirmDuration = async () => {
    if (!pendingFiles.length) { 
      if (mountedRef.current) setShowDurationModal(false); 
      return; 
    }
    let chosen = Math.max(1, Math.min(Number(tempDuration) || 24, 72));
    try {
      if (!mountedRef.current) return;
      setLoading(true);
      const uploaded = await imageUpload(pendingFiles);
      if (!mountedRef.current) return;
      if (!uploaded || uploaded.length === 0) {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: 'No media uploaded' } });
        return;
      }
      await postDataAPI('story', { media: uploaded, durationHours: chosen }, auth.token);
      if (!mountedRef.current) return;
      dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'Story added' } });
      await fetchStories();
      if (!mountedRef.current) return;
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      if (!mountedRef.current) return;
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to add story' } });
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      if (mountedRef.current) {
        setShowDurationModal(false);
        setPendingFiles([]);
      }
    }
  };

  const handleCancelDuration = () => {
    if (mountedRef.current) {
      setShowDurationModal(false);
      setPendingFiles([]);
    }
    setPendingFiles([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  useEffect(() => {
    mountedRef.current = true;
    if (auth.token) fetchStories();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  // Tick every second to update progress bars and hide expired items
  useEffect(() => {
    const id = setInterval(() => {
      if (mountedRef.current) setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const computeProgress = (story) => {
    const created = new Date(story.createdAt).getTime();
    const expires = new Date(story.expiresAt).getTime();
    const total = Math.max(0, expires - created);
    const left = Math.max(0, expires - now);
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, (left / total) * 100));
  };

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

      {/* Controls Row: Add Story and Default Duration Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="add-story-btn" onClick={onPickFiles} disabled={loading}>
          <div className="add-story-icon">
            <i className="fas fa-plus"></i>
          </div>
          <span className="add-story-text">Add Story</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="story-duration" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Visible for
          </label>
          <select
            id="story-duration"
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            style={{
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-light)',
              padding: '0 8px',
              fontSize: 12,
              background: '#fff'
            }}
          >
            {[1, 6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h}h</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="stories-loading">
          <div className="loading-spinner-small"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Duration Selection Modal */}
      {showDurationModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 16, width: 320,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Story visibility</h4>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              Select how long this story should be visible to others.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {[1, 6, 12, 24, 48, 72].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTempDuration(h)}
                  style={{
                    padding: '8px 10px', borderRadius: 8,
                    border: tempDuration === h ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
                    background: tempDuration === h ? 'var(--primary-50)' : '#fff',
                    cursor: 'pointer', minWidth: 56
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={handleCancelDuration} style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', background: '#fff'
              }}>Cancel</button>
              <button type="button" onClick={handleConfirmDuration} style={{
                padding: '8px 12px', borderRadius: 8, border: 'none',
                background: 'var(--primary-500)', color: '#fff'
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      
      <div className="stories-scroll">
        {stories.map(story => {
          const expiresMs = new Date(story.expiresAt).getTime();
          if (expiresMs <= now) return null; // hide expired without refetch
          const percent = computeProgress(story);
          return (
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
            {/* Time remaining progress bar */}
            <div className="story-progress" title={`${Math.ceil((expiresMs - now)/3600000)}h left`}>
              <div className="story-progress-bar" style={{ width: `${percent}%` }} />
            </div>
            <span className="story-username">{story.user?.username || 'story'}</span>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoriesBar;
