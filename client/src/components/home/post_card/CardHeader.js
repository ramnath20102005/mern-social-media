import React from "react";
import Avatar from "../../Avatar";
import { Link, useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { BASE_URL } from '../../../utils/config'

import { GLOBALTYPES } from "../../../redux/actions/globalTypes";
import { deletePost, reportPost } from "../../../redux/actions/postAction";

const CardHeader = ({ post }) => {
  const { auth, socket } = useSelector((state) => state);
  const dispatch = useDispatch();
  const history = useHistory();

  const handleEditPost = () => {
    dispatch({ type: GLOBALTYPES.STATUS, payload: { ...post, onEdit: true } });
  };

  const handleDeletePost = () => {
    if(window.confirm('Are you sure you want to delete this post?')){
        dispatch(deletePost({post, auth, socket}))
        return history.push("/")
    }
  }

  const handleReportPost = () => {
    dispatch(reportPost({post, auth}));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${BASE_URL}/post/${post._id}`)
  };

  return (
    <div className="modern-post-header">
      <div className="post-header-left">
        <div className="post-avatar-container">
          <Avatar src={post.user.avatar} size="big-avatar" />
          <div className="avatar-ring"></div>
        </div>
        <div className="post-user-info">
          <Link className="post-username" to={`/profile/${post.user._id}`}>
            {post.user.username}
          </Link>
          <div className="post-timestamp">
            {moment(post.createdAt).fromNow()}
          </div>
        </div>
      </div>

      <div className="post-header-actions">
        {auth.user._id === post.user._id && (
          <button
            className="post-action-btn delete-btn"
            onClick={handleDeletePost}
            title="Delete Post"
          >
            <i className="fas fa-trash"></i>
          </button>
        )}
        <div className="post-dropdown">
          <button className="post-action-btn more-btn" data-bs-toggle="dropdown">
            <i className="fas fa-ellipsis-h"></i>
          </button>

          <div className="dropdown-menu modern-dropdown">
            {auth.user._id === post.user._id && (
              <>
                <div className="dropdown-item" onClick={handleEditPost}>
                  <i className="fas fa-edit"></i>
                  <span>Edit Post</span>
                </div>
                <div className="dropdown-item delete-item" onClick={handleDeletePost}>
                  <i className="fas fa-trash"></i>
                  <span>Delete Post</span>
                </div>
                <div className="dropdown-divider"></div>
              </>
            )}

            <div className="dropdown-item" onClick={handleCopyLink}>
              <i className="fas fa-copy"></i>
              <span>Copy Link</span>
            </div>
            <div className="dropdown-item" onClick={handleReportPost}>
              <i className="fas fa-flag"></i>
              <span>Report Post</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardHeader;
