import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createStory } from '../../redux/actions/storyAction';

const AddStoryModal = ({ onClose }) => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [timelineDuration, setTimelineDuration] = useState({ value: 24, label: '24h' });
  const [visibility, setVisibility] = useState('followers');
  const [closeFriends, setCloseFriends] = useState([]);
  const [allowReplies, setAllowReplies] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Settings, 3: Preview
  
  const fileInputRef = useRef(null);

  const timelineOptions = [
    { value: 1, label: '1h', description: '1 hour' },
    { value: 3, label: '3h', description: '3 hours' },
    { value: 6, label: '6h', description: '6 hours' },
    { value: 12, label: '12h', description: '12 hours' },
    { value: 24, label: '24h', description: '1 day' },
    { value: 48, label: '2d', description: '2 days' },
    { value: 72, label: '3d', description: '3 days' },
    { value: 168, label: '7d', description: '1 week' },
    { value: 720, label: '30d', description: '1 month' }
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length > 0) {
      // Convert files to preview URLs
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
        setStep(2); // Move to settings step
      });
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // For now, we'll submit one story at a time
      // In a real app, you might want to batch upload or handle multiple files
      const currentFile = selectedFiles[currentFileIndex];
      
      const storyData = {
        media: {
          type: currentFile.type,
          url: currentFile.url, // In production, upload to cloud storage first
          publicId: '' // Would be set after cloud upload
        },
        caption,
        timelineDuration,
        visibility,
        closeFriends: visibility === 'close_friends' ? closeFriends : [],
        allowReplies
      };

      await dispatch(createStory(storyData, auth.token));
      onClose();
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getCurrentFile = () => {
    return selectedFiles[currentFileIndex] || null;
  };

  const renderUploadStep = () => (
    <div className="add-story-step upload-step">
      <div className="step-header">
        <h3>Add to Your Story</h3>
        <p>Share a photo or video that will disappear after the time you choose</p>
      </div>
      
      <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <h4>Select photos or videos</h4>
        <p>Choose files from your device</p>
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
  );

  const renderSettingsStep = () => (
    <div className="add-story-step settings-step">
      <div className="step-header">
        <h3>Story Settings</h3>
        <p>Customize how your story appears</p>
      </div>
      
      <div className="settings-form">
        {/* Caption */}
        <div className="form-group">
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

        {/* Timeline Duration */}
        <div className="form-group">
          <label>Story Duration</label>
          <div className="timeline-options">
            {timelineOptions.map(option => (
              <div 
                key={option.label}
                className={`timeline-option ${timelineDuration.label === option.label ? 'selected' : ''}`}
                onClick={() => setTimelineDuration(option)}
              >
                <div className="timeline-label">{option.label}</div>
                <div className="timeline-desc">{option.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="form-group">
          <label>Who can see this?</label>
          <div className="visibility-options">
            <div 
              className={`visibility-option ${visibility === 'followers' ? 'selected' : ''}`}
              onClick={() => setVisibility('followers')}
            >
              <i className="fas fa-users"></i>
              <div>
                <strong>Followers</strong>
                <span>People who follow you</span>
              </div>
            </div>
            <div 
              className={`visibility-option ${visibility === 'close_friends' ? 'selected' : ''}`}
              onClick={() => setVisibility('close_friends')}
            >
              <i className="fas fa-heart"></i>
              <div>
                <strong>Close Friends</strong>
                <span>Only your close friends</span>
              </div>
            </div>
            <div 
              className={`visibility-option ${visibility === 'public' ? 'selected' : ''}`}
              onClick={() => setVisibility('public')}
            >
              <i className="fas fa-globe"></i>
              <div>
                <strong>Public</strong>
                <span>Anyone can see</span>
              </div>
            </div>
          </div>
        </div>

        {/* Allow Replies */}
        <div className="form-group">
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
  );

  const renderPreviewStep = () => {
    const currentFile = getCurrentFile();
    if (!currentFile) return null;

    return (
      <div className="add-story-step preview-step">
        <div className="step-header">
          <h3>Preview Your Story</h3>
          <p>This is how your story will appear to others</p>
        </div>
        
        <div className="story-preview">
          <div className="preview-container">
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
          </div>
          
          <div className="preview-info">
            <div className="preview-user">
              <img src={auth.user?.avatar} alt="Your avatar" />
              <span>{auth.user?.username}</span>
            </div>
            
            <div className="preview-settings">
              <div className="setting-item">
                <i className="fas fa-clock"></i>
                <span>Expires in {timelineDuration.label}</span>
              </div>
              <div className="setting-item">
                <i className={`fas ${visibility === 'followers' ? 'fa-users' : visibility === 'close_friends' ? 'fa-heart' : 'fa-globe'}`}></i>
                <span>{visibility === 'followers' ? 'Followers' : visibility === 'close_friends' ? 'Close Friends' : 'Public'}</span>
              </div>
              {allowReplies && (
                <div className="setting-item">
                  <i className="fas fa-comment"></i>
                  <span>Replies enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="add-story-modal-overlay" onClick={onClose}>
      <div className="add-story-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
          
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {step === 1 && renderUploadStep()}
          {step === 2 && renderSettingsStep()}
          {step === 3 && renderPreviewStep()}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          
          <div className="footer-actions">
            {step < 3 ? (
              <button 
                className="btn-primary"
                onClick={handleNext}
                disabled={step === 1 && selectedFiles.length === 0}
              >
                Next
              </button>
            ) : (
              <button 
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sharing...
                  </>
                ) : (
                  'Share Story'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStoryModal;
