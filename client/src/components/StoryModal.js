import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GLOBALTYPES } from "../redux/actions/globalTypes";
import { createStory } from "../redux/actions/storyAction";
import "../styles/story_modal.css";

const StoryModal = () => {
  const { auth, story } = useSelector((state) => state);
  const dispatch = useDispatch();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [timelineDuration, setTimelineDuration] = useState({ value: 24, label: '24h' });
  const [visibility, setVisibility] = useState('followers');
  const [allowReplies, setAllowReplies] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  const timelineOptions = [
    { value: 1, label: '1h', description: '1 hour' },
    { value: 3, label: '3h', description: '3 hours' },
    { value: 6, label: '6h', description: '6 hours' },
    { value: 12, label: '12h', description: '12 hours' },
    { value: 24, label: '24h', description: '1 day' },
    { value: 48, label: '2d', description: '2 days' },
    { value: 72, label: '3d', description: '3 days' },
    { value: 168, label: '7d', description: '1 week' }
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length > 0) {
      const filePromises = validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              file,
              url: e.target.result,
              type: file.type.startsWith('image/') ? 'image' : 'video',
              name: file.name
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(fileData => {
        setSelectedFiles(fileData);
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (currentFileIndex >= newFiles.length) {
      setCurrentFileIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Process all selected files
      const mediaArray = selectedFiles.map(file => ({
        url: file.url,
        public_id: '',
        type: file.type
      }));
      
      const storyData = {
        media: mediaArray,
        caption: caption.trim(),
        visibility: visibility.toUpperCase(),
        expiryDuration: timelineDuration.value,
        allowReplies,
        closeFriends: visibility === 'close_friends' ? [] : undefined
      };

      await dispatch(createStory(storyData, auth.token));
      
      // Show success message
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { success: 'Story shared successfully!' }
      });
      
      // Close modal and reset state
      dispatch({ type: GLOBALTYPES.STORY, payload: false });
      setSelectedFiles([]);
      setCaption('');
      setCurrentFileIndex(0);
      setTimelineDuration({ value: 24, label: '24h' });
      setVisibility('followers');
      setAllowReplies(true);
    } catch (error) {
      console.error('Error creating story:', error);
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: error.response?.data?.msg || 'Failed to create story' }
      });
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    dispatch({ type: GLOBALTYPES.STORY, payload: false });
  };

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending operations when component unmounts
      setIsUploading(false);
    };
  }, []);

  if (!story) return null;

  const getCurrentFile = () => selectedFiles[currentFileIndex] || null;
  const currentFile = getCurrentFile();

  return (
    <div className="story-modal-overlay" onClick={closeModal}>
      <div className="story-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="story-modal-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div className="header-text">
              <h2>Add to Your Story</h2>
              <p>Share a moment that disappears</p>
            </div>
          </div>
          <button className="close-btn" onClick={closeModal}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="story-modal-body">
          {selectedFiles.length === 0 ? (
            // Upload Section
            <div 
              className={`upload-section ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">
                  <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <h3>Select photos or videos</h3>
                <p>Drag and drop or click to browse</p>
                <button className="upload-btn">
                  <i className="fas fa-plus"></i>
                  Choose Files
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            // Preview and Settings Section
            <div className="story-content">
              {/* Preview */}
              <div className="story-preview">
                <div className="preview-container">
                  {currentFile && (
                    <>
                      {currentFile.type === 'image' ? (
                        <img src={currentFile.url} alt="Story preview" />
                      ) : (
                        <video src={currentFile.url} controls />
                      )}
                      
                      {caption && (
                        <div className="preview-caption">
                          {caption}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* File Navigation */}
                {selectedFiles.length > 1 && (
                  <div className="file-navigation">
                    {selectedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className={`file-thumb ${index === currentFileIndex ? 'active' : ''}`}
                        onClick={() => setCurrentFileIndex(index)}
                      >
                        {file.type === 'image' ? (
                          <img src={file.url} alt={`Preview ${index + 1}`} />
                        ) : (
                          <video src={file.url} />
                        )}
                        <button 
                          className="remove-file"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="story-settings">
                <div className="user-info">
                  <img src={auth.user?.avatar} alt="Your avatar" className="user-avatar" />
                  <span className="username">{auth.user?.username}</span>
                </div>

                {/* Caption */}
                <div className="setting-group">
                  <label>Caption (optional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    maxLength={500}
                    rows={3}
                  />
                  <span className="char-count">{caption.length}/500</span>
                </div>

                {/* Duration */}
                <div className="setting-group">
                  <label>Story Duration</label>
                  <div className="timeline-options">
                    {timelineOptions.map(option => (
                      <div 
                        key={option.label}
                        className={`timeline-option ${timelineDuration.label === option.label ? 'selected' : ''}`}
                        onClick={() => setTimelineDuration(option)}
                      >
                        <span className="timeline-label">{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div className="setting-group">
                  <label>Who can see this?</label>
                  <div className="visibility-options">
                    <div 
                      className={`visibility-option ${visibility === 'followers' ? 'selected' : ''}`}
                      onClick={() => setVisibility('followers')}
                    >
                      <i className="fas fa-users"></i>
                      <span>Followers</span>
                    </div>
                    <div 
                      className={`visibility-option ${visibility === 'close_friends' ? 'selected' : ''}`}
                      onClick={() => setVisibility('close_friends')}
                    >
                      <i className="fas fa-heart"></i>
                      <span>Close Friends</span>
                    </div>
                    <div 
                      className={`visibility-option ${visibility === 'public' ? 'selected' : ''}`}
                      onClick={() => setVisibility('public')}
                    >
                      <i className="fas fa-globe"></i>
                      <span>Public</span>
                    </div>
                  </div>
                </div>

                {/* Allow Replies */}
                <div className="setting-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={allowReplies}
                      onChange={(e) => setAllowReplies(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Allow replies to this story
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="story-modal-footer">
          <div className="footer-actions">
            {selectedFiles.length > 0 && (
              <button 
                className="btn-secondary"
                onClick={() => setSelectedFiles([])}
              >
                <i className="fas fa-arrow-left"></i>
                Change Media
              </button>
            )}
            
            <button 
              className="btn-primary"
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sharing...
                </>
              ) : (
                <>
                  <i className="fas fa-share"></i>
                  Share Story
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;
