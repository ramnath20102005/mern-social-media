import React from 'react'
import Avatar from '../Avatar';
import { useSelector,useDispatch } from "react-redux";
import { GLOBALTYPES } from '../../redux/actions/globalTypes'

const Status = () => {
    const { auth } = useSelector(state => state);
    const dispatch = useDispatch();
    return (
      <div className="modern-status">
        <div className="status-header">
          <h3 className="status-title">Create Post</h3>
          <div className="status-indicator"></div>
        </div>
        <div className="status-content">
          <div className="status-avatar">
            <Avatar src={auth.user.avatar} size="big-avatar" className="" />
          </div>
          <button
            onClick={() => dispatch({ type: GLOBALTYPES.STATUS, payload: true })}
            className="modern-status-btn"
          >
            <span className="status-placeholder">
              What's on your mind, {auth.user.fullname || auth.user.username}?
            </span>
            <div className="status-btn-icon">
              <i className="fas fa-plus"></i>
            </div>
          </button>
        </div>
        <div className="status-actions">
          <div className="status-action-item">
            <i className="fas fa-image"></i>
            <span>Photo</span>
          </div>
          <div className="status-action-item">
            <i className="fas fa-video"></i>
            <span>Video</span>
          </div>
          <div className="status-action-item">
            <i className="fas fa-smile"></i>
            <span>Feeling</span>
          </div>
        </div>
      </div>
    );
}

export default Status
