import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { GLOBALTYPES } from "../../redux/actions/globalTypes";
import { updateProfileUser } from "../../redux/actions/profileAction";
import { checkImage } from "../../utils/imageUpload";
import { X, Camera, Save } from 'react-feather';
import '../../styles/editProfile.css'; // Import the new CSS file

const EditProfile = ({ setOnEdit }) => {
  const modalRef = useRef(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setOnEdit(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOnEdit]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const initialState = {
    fullname: "",
    mobile: "",
    address: "",
    website: "",
    story: "",
    gender: "",
  };
  const [userData, setUserData] = useState(initialState);
  const { fullname, mobile, address, website, story, gender } = userData;
  const [avatar, SetAvatar] = useState("");
  const { auth, theme } = useSelector((state) => state);
  const dispatch = useDispatch();

  useEffect(() => {
    setUserData(auth.user);
  }, [auth.user]);

  const changeAvatar = (e) => {
    const file = e.target.files[0];
    const err = checkImage(file);
    if (err) {
      return dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err } });
    }
    SetAvatar(file);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfileUser({ userData, avatar, auth }));
      setOnEdit(false); // Close the modal on successful update
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  return (
    <div className="edit-profile-modal-overlay">
      <div className="edit-profile-modal" ref={modalRef}>
        <div className="edit-profile-header">
          <h3>Edit Profile</h3>
          <button 
            className="close-button"
            onClick={() => setOnEdit(false)}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="avatar-upload">
            <div className="avatar-preview">
              <img
                alt="profile"
                src={avatar ? URL.createObjectURL(avatar) : auth.user.avatar}
                className="profile-avatar-large"
              />
              <label htmlFor="file_up" className="change-avatar-button">
                <Camera size={18} />
                <span>Change Photo</span>
                <input
                  type="file"
                  name="file"
                  id="file_up"
                  accept="image/*"
                  onChange={changeAvatar}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fullname">Full Name</label>
            <div className="input-with-counter">
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={fullname}
                onChange={handleInput}
                maxLength="25"
                placeholder="Enter your full name"
              />
              <span className="char-counter">{fullname.length}/25</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mobile">Mobile</label>
              <input
                type="text"
                id="mobile"
                name="mobile"
                value={mobile || ''}
                onChange={handleInput}
                placeholder="+1 (___) ___-____"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={gender || ''}
                onChange={handleInput}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={address || ''}
              onChange={handleInput}
              placeholder="Enter your address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <div className="input-with-prefix">
              <span className="input-prefix">https://</span>
              <input
                type="text"
                id="website"
                name="website"
                value={website?.replace('https://', '') || ''}
                onChange={(e) => handleInput({
                  target: {
                    name: 'website',
                    value: e.target.value ? `https://${e.target.value}` : ''
                  }
                })}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="story">Bio</label>
            <div className="textarea-with-counter">
              <textarea
                id="story"
                name="story"
                value={story || ''}
                onChange={handleInput}
                maxLength="200"
                rows="3"
                placeholder="Tell us about yourself..."
              />
              <div className="textarea-actions">
                <span className="char-counter">{story?.length || 0}/200</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setOnEdit(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
            >
              <Save size={16} className="button-icon" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
