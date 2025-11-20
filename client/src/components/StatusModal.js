import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GLOBALTYPES } from "../redux/actions/globalTypes";
import { createPost, updatePost } from "../redux/actions/postAction";
import Icons from "./Icons";
import { imageShow, videoShow } from "../utils/mediaShow";
import { getDataAPI } from "../utils/fetchData";
import "../styles/status_modal.css";

const StatusModal = () => {
  const { auth, theme, status, socket } = useSelector((state) => state);
  const dispatch = useDispatch();

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [stream, setStream] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [location, setLocation] = useState(null);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [feeling, setFeeling] = useState("");
  const [activity, setActivity] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showFeelingModal, setShowFeelingModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const videoRef = useRef();
  const refCanvas = useRef();
  const [tracks, setTracks] = useState("");

  const handleChangeImages = (e) => {
    const files = [...e.target.files];
    let err = "";
    let newImages = [];

    files.forEach((file) => {
      if (!file) {
        return (err = "File does not exist.");
      }
      if (file.size > 1024 * 1024 * 5) {
        return (err = "Image size must be less than 5 mb.");
      }
      return newImages.push(file);
    });
    if (err) {
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err } });
    }
    setImages([...images, ...newImages]);
  };

  const deleteImages = (index) => {
    const newArr = [...images];
    newArr.splice(index, 1);
    setImages(newArr);
  };

  const handleStream = () => {
    setStream(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
          const track = mediaStream.getTracks();
          setTracks(track[0]);
        })
        .catch((err) => console.log(err));
    }
  };

  const handleCapture = () => {
    const width = videoRef.current.clientWidth;
    const height = videoRef.current.clientHeight;

    refCanvas.current.setAttribute("width", width);
    refCanvas.current.setAttribute("height", height);

    const ctx = refCanvas.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    let URL = refCanvas.current.toDataURL();
    setImages([...images, { camera: URL }]);
  };

  const handleStopStream = () => {
    tracks.stop();
    setStream(false);
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
    
    const files = [...e.dataTransfer.files];
    let err = "";
    let newImages = [];

    files.forEach((file) => {
      if (!file) {
        return (err = "File does not exist.");
      }
      if (file.size > 1024 * 1024 * 5) {
        return (err = "Image size must be less than 5 mb.");
      }
      if (!file.type.match(/image|video/)) {
        return (err = "Only images and videos are allowed.");
      }
      return newImages.push(file);
    });

    if (err) {
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err } });
    } else {
      setImages([...images, ...newImages]);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: "Geolocation is not supported by this browser." } });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          name: "Current Location",
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates: { latitude, longitude }
        });
        setShowLocationModal(false);
        setIsLoadingLocation(false);
        dispatch({ type: GLOBALTYPES.ALERT, payload: { success: "Location added successfully!" } });
      },
      (error) => {
        let errorMessage = "Unable to get location.";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        dispatch({ type: GLOBALTYPES.ALERT, payload: { error: errorMessage } });
        setIsLoadingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search for users to tag
  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);

    try {
      // Real API call to search users
      const response = await getDataAPI(`search?username=${searchTerm}&type=users&limit=10`, auth.token);
      
      if (response.data && response.data.users) {
        setSearchResults(response.data.users);
      } else {
        setSearchResults([]);
      }
      setIsSearchingUsers(false);
      
    } catch (error) {
      console.error("Error searching users:", error);
      
      // Fallback to mock data if API fails (for development)
      const mockUsers = [
        { _id: "1", username: "john_doe", fullname: "John Doe", avatar: "https://via.placeholder.com/40/4F46E5/FFFFFF?text=JD" },
        { _id: "2", username: "jane_smith", fullname: "Jane Smith", avatar: "https://via.placeholder.com/40/EC4899/FFFFFF?text=JS" },
        { _id: "3", username: "mike_wilson", fullname: "Mike Wilson", avatar: "https://via.placeholder.com/40/10B981/FFFFFF?text=MW" },
        { _id: "4", username: "sarah_jones", fullname: "Sarah Jones", avatar: "https://via.placeholder.com/40/F59E0B/FFFFFF?text=SJ" },
        { _id: "5", username: "david_brown", fullname: "David Brown", avatar: "https://via.placeholder.com/40/EF4444/FFFFFF?text=DB" },
        { _id: "6", username: "alex_martin", fullname: "Alex Martin", avatar: "https://via.placeholder.com/40/06B6D4/FFFFFF?text=AM" },
      ];
      
      const filtered = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filtered);
      setIsSearchingUsers(false);
    }
  };

  // Add user to tagged list
  const addTaggedUser = (user) => {
    if (!taggedUsers.find(taggedUser => taggedUser._id === user._id)) {
      setTaggedUsers([...taggedUsers, user]);
      setUserSearch("");
      setSearchResults([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that user has either content or images
    if (images.length === 0 && !content.trim()) {
      return dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: "Please add some content or images to your post." },
      });
    }

    setIsSubmitting(true);

    try {
      const postData = {
        content,
        images,
        auth,
        socket,
        location: location?.name || '',
        taggedUsers: taggedUsers.map(user => user._id),
        feeling: feeling || '',
        activity: activity || '',
        privacy: privacy || 'public'
      };

      if (status.onEdit) {
        await dispatch(updatePost({ ...postData, status }));
      } else {
        await dispatch(createPost({
          content: postData.content,
          images: postData.images,
          auth: postData.auth,
          socket: postData.socket,
          location: postData.location,
          taggedUsers: postData.taggedUsers,
          feeling: postData.feeling,
          activity: postData.activity,
          privacy: postData.privacy
        }));
      }

      // Clear form and close modal on success
      setContent("");
      setImages([]);
      setLocation(null);
      setTaggedUsers([]);
      setFeeling("");
      setActivity("");
      setPrivacy("public");
      setLocationSearch("");
      setUserSearch("");
      setSearchResults([]);
      if (tracks) {
        tracks.stop();
      }
      dispatch({
        type: GLOBALTYPES.STATUS,
        payload: false,
      });
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (status.onEdit) {
      setContent(status.content);
      setImages(status.images);
    }
  }, [status]);

  

  return (
    <div className="modern-post-modal-overlay">
      <div className="modern-post-modal">
        <form onSubmit={handleSubmit} className="post-form">
          {/* Header */}
          <div className="post-modal-header">
            <div className="header-left">
              <div className="post-icon">
                <i className="fas fa-plus"></i>
              </div>
              <div className="header-text">
                <h2 className="modal-title">Create New Post</h2>
                <p className="modal-subtitle">Share your moment with the world</p>
              </div>
            </div>
            <button
              type="button"
              className="close-btn"
              onClick={() => dispatch({ type: GLOBALTYPES.STATUS, payload: false })}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Body */}
          <div className="post-modal-body">
            {/* User Info */}
            <div className="user-info-section">
              <div className="user-avatar">
                <img src={auth.user.avatar} alt={auth.user.username} />
                <div className="user-status-dot"></div>
              </div>
              <div className="user-details">
                <h4 className="user-name">{auth.user.fullname || auth.user.username}</h4>
                <div className="privacy-selector">
                  <i className="fas fa-globe-americas"></i>
                  <span>Public</span>
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>

            {/* Content Input */}
            <div className="content-input-section">
              <textarea
                className="post-textarea"
                onChange={(e) => setContent(e.target.value)}
                value={content}
                name="content"
                placeholder={`What's on your mind, ${auth.user.fullname || auth.user.username}?`}
                rows="4"
              />
              <div className="emoji-section">
                <Icons setContent={setContent} content={content} theme={theme} />
              </div>
            </div>

            {/* Media Upload Section */}
            <div 
              className={`media-upload-section ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-area">
                {images.length === 0 && !stream ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <h3>Add photos and videos</h3>
                    <p>Drag and drop or click to browse</p>
                    <div className="upload-actions">
                      <label className="upload-btn" htmlFor="file">
                        <i className="fas fa-image"></i>
                        <span>Choose Files</span>
                        <input
                          onChange={handleChangeImages}
                          type="file"
                          name="file"
                          id="file"
                          multiple
                          accept="image/*,video/*"
                          hidden
                        />
                      </label>
                      <button type="button" className="camera-btn" onClick={handleStream}>
                        <i className="fas fa-camera"></i>
                        <span>Camera</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="media-preview-grid">
                    {images.map((img, index) => (
                      <div key={index} className="media-preview-item">
                        <div className="media-container">
                          {img.camera ? (
                            <img src={img.camera} alt="Camera capture" />
                          ) : img.url ? (
                            <>
                              {img.url.match(/video/i) ? (
                                <video src={img.url} controls />
                              ) : (
                                <img src={img.url} alt="Upload preview" />
                              )}
                            </>
                          ) : (
                            <>
                              {img.type.match(/video/i) ? (
                                <video src={URL.createObjectURL(img)} controls />
                              ) : (
                                <img src={URL.createObjectURL(img)} alt="Upload preview" />
                              )}
                            </>
                          )}
                          <div className="media-overlay">
                            <button
                              type="button"
                              className="remove-media-btn"
                              onClick={() => deleteImages(index)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add More Button */}
                    <div className="add-more-media">
                      <label className="add-more-btn" htmlFor="file-additional">
                        <i className="fas fa-plus"></i>
                        <span>Add More</span>
                        <input
                          onChange={handleChangeImages}
                          type="file"
                          name="file"
                          id="file-additional"
                          multiple
                          accept="image/*,video/*"
                          hidden
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Camera Stream */}
                {stream && (
                  <div className="camera-stream">
                    <div className="camera-container">
                      <video
                        ref={videoRef}
                        className="camera-video"
                        autoPlay
                        muted
                      />
                      <div className="camera-controls">
                        <button
                          type="button"
                          className="capture-btn"
                          onClick={handleCapture}
                        >
                          <i className="fas fa-camera"></i>
                          <span>Capture</span>
                        </button>
                        <button
                          type="button"
                          className="stop-camera-btn"
                          onClick={handleStopStream}
                        >
                          <i className="fas fa-times"></i>
                          <span>Stop</span>
                        </button>
                      </div>
                    </div>
                    <canvas ref={refCanvas} style={{ display: "none" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Options */}
            <div className="post-options">
              <div 
                className={`option-item ${location ? 'active' : ''}`}
                onClick={() => setShowLocationModal(true)}
              >
                <i className="fas fa-map-marker-alt"></i>
                <span>{location ? location.name : 'Add Location'}</span>
                {location && (
                  <button 
                    className="remove-option-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(null);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <div 
                className={`option-item ${taggedUsers.length > 0 ? 'active' : ''}`}
                onClick={() => setShowTagModal(true)}
              >
                <i className="fas fa-tag"></i>
                <span>
                  {taggedUsers.length > 0 
                    ? `Tagged ${taggedUsers.length} people` 
                    : 'Tag People'
                  }
                </span>
                {taggedUsers.length > 0 && (
                  <button 
                    className="remove-option-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaggedUsers([]);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <div 
                className={`option-item ${feeling || activity ? 'active' : ''}`}
                onClick={() => setShowFeelingModal(true)}
              >
                <i className="fas fa-smile"></i>
                <span>
                  {feeling || activity 
                    ? `${feeling ? `Feeling ${feeling}` : ''}${feeling && activity ? ' - ' : ''}${activity ? `${activity}` : ''}`
                    : 'Feeling/Activity'
                  }
                </span>
                {(feeling || activity) && (
                  <button 
                    className="remove-option-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFeeling("");
                      setActivity("");
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="post-modal-footer">
            <div className="post-stats">
              <span className="character-count">{content.length}/2200</span>
              <span className="media-count">{images.length} media files</span>
            </div>
            <div className="post-actions">
              <button
                type="button"
                className="draft-btn"
                onClick={() => dispatch({ type: GLOBALTYPES.STATUS, payload: false })}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="post-btn"
                disabled={isSubmitting || (images.length === 0 && !content.trim())}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    <span>Share Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="feature-modal-overlay" onClick={() => {
          setShowLocationModal(false);
          setLocationSearch("");
        }}>
          <div className="feature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feature-modal-header">
              <h3>Add Location</h3>
              <button onClick={() => {
                setShowLocationModal(false);
                setLocationSearch("");
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="feature-modal-body">
              <input
                type="text"
                placeholder="Search for a location..."
                className="location-input"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setLocation({ 
                      name: e.target.value.trim(), 
                      address: e.target.value.trim(),
                      coordinates: null
                    });
                    setLocationSearch("");
                    setShowLocationModal(false);
                    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: "Location added successfully!" } });
                  }
                }}
              />
              <div className="location-suggestions">
                <div 
                  className="suggestion-item" 
                  onClick={getCurrentLocation}
                  style={{ opacity: isLoadingLocation ? 0.6 : 1 }}
                >
                  <i className={`fas ${isLoadingLocation ? 'fa-spinner fa-spin' : 'fa-location-arrow'}`}></i>
                  <span>{isLoadingLocation ? 'Getting location...' : 'Use Current Location'}</span>
                </div>
                {locationSearch && (
                  <div className="suggestion-item" onClick={() => {
                    setLocation({ 
                      name: locationSearch, 
                      address: locationSearch,
                      coordinates: null
                    });
                    setLocationSearch("");
                    setShowLocationModal(false);
                    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: "Location added successfully!" } });
                  }}>
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Add "{locationSearch}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag People Modal */}
      {showTagModal && (
        <div className="feature-modal-overlay" onClick={() => {
          setShowTagModal(false);
          setUserSearch("");
          setSearchResults([]);
        }}>
          <div className="feature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feature-modal-header">
              <h3>Tag People</h3>
              <button onClick={() => {
                setShowTagModal(false);
                setUserSearch("");
                setSearchResults([]);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="feature-modal-body">
              <input
                type="text"
                placeholder="Search for people to tag..."
                className="tag-input"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
              
              {/* Search Loading */}
              {isSearchingUsers && (
                <div className="search-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Searching users...</span>
                </div>
              )}

              {/* Search Results */}
              {!isSearchingUsers && searchResults.length > 0 && (
                <div className="user-search-results">
                  {searchResults.map((user) => (
                    <div 
                      key={user._id} 
                      className="user-search-item"
                      onClick={() => addTaggedUser(user)}
                    >
                      <img src={user.avatar} alt={user.username} />
                      <div className="user-info">
                        <span className="username">{user.username}</span>
                        <span className="fullname">{user.fullname}</span>
                      </div>
                      <i className="fas fa-plus"></i>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearchingUsers && userSearch && searchResults.length === 0 && (
                <div className="no-results">
                  <i className="fas fa-search"></i>
                  <span>No users found for "{userSearch}"</span>
                </div>
              )}

              {/* Tagged Users */}
              {taggedUsers.length > 0 && (
                <div className="tagged-users-section">
                  <h4>Tagged People</h4>
                  <div className="tagged-users">
                    {taggedUsers.map((user, index) => (
                      <div key={index} className="tagged-user">
                        <img src={user.avatar} alt={user.username} />
                        <span>{user.username}</span>
                        <button onClick={() => {
                          setTaggedUsers(taggedUsers.filter((_, i) => i !== index));
                        }}>
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feeling/Activity Modal */}
      {showFeelingModal && (
        <div className="feature-modal-overlay" onClick={() => setShowFeelingModal(false)}>
          <div className="feature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feature-modal-header">
              <h3>How are you feeling?</h3>
              <button onClick={() => setShowFeelingModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="feature-modal-body">
              <div className="feeling-section">
                <h4>Feelings</h4>
                <div className="feeling-grid">
                  {['happy', 'excited', 'grateful', 'blessed', 'loved', 'proud', 'amazing', 'fantastic', 'sad', 'disappointed', 'frustrated', 'angry'].map((feelingOption) => (
                    <button
                      key={feelingOption}
                      className={`feeling-btn ${feeling === feelingOption ? 'active' : ''}`}
                      onClick={() => {
                        setFeeling(feelingOption);
                        setShowFeelingModal(false);
                      }}
                    >
                      😊 {feelingOption}
                    </button>
                  ))}
                </div>
              </div>
              <div className="activity-section">
                <h4>Activities</h4>
                <div className="activity-grid">
                  {['eating', 'drinking', 'cooking', 'working', 'studying', 'reading', 'traveling', 'exercising', 'watching', 'listening', 'shopping', 'celebrating'].map((activityOption) => (
                    <button
                      key={activityOption}
                      className={`activity-btn ${activity === activityOption ? 'active' : ''}`}
                      onClick={() => {
                        setActivity(activityOption);
                        setShowFeelingModal(false);
                      }}
                    >
                      🎯 {activityOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusModal;
