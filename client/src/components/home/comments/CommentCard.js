import React, { useState, useEffect } from 'react';
import Avatar from '../../Avatar';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import moment from 'moment';
import LikeButton from "../../LikeButton";
import CommentMenu from './CommentMenu';
import { likeComment, unLikeComment, updateComment } from '../../../redux/actions/commentAction';
import InputComment from "../InputComment";
import { FaCircleInfo, FaXmark } from 'react-icons/fa6';

const CommentCard = ({ children, comment, post, commentId }) => {
  const { auth, theme } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [content, setContent] = useState("");
  const [readMore, setReadMore] = useState(false);

  const [isLike, setIsLike] = useState(false);
  const [loadLike, setLoadLike] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  const [onReply, setOnReply] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const safetyStatus = (comment.safety && comment.safety.userSafety) || "unknown";
  const safetyCategories = Array.isArray(comment.safety?.categories)
    ? comment.safety.categories.filter(Boolean)
    : [];
    
  const getSafetyDetails = () => {
    switch(safetyStatus) {
      case 'safe':
        return {
          title: 'Safe Content',
          description: 'This comment has been analyzed and appears to be safe.',
          icon: '✅',
          color: 'var(--success-500)'
        };
      case 'unsafe':
        return {
          title: 'Potentially Unsafe Content',
          description: 'This comment was flagged as potentially containing harmful or inappropriate content.',
          icon: '⚠️',
          color: 'var(--danger-500)'
        };
      default:
        return {
          title: 'Analysis Unavailable',
          description: 'The safety analysis for this comment is not available.',
          icon: '❓',
          color: 'var(--text-secondary)'
        };
    }
  };
  
  const safetyDetails = getSafetyDetails();

  useEffect(() => {
    setContent(comment.content);
    setIsLike(false);
    setOnReply(false);
    if (comment.likes.find((like) => like._id === auth.user._id)) {
      setIsLike(true);
    }
  }, [comment, auth.user._id]);

  const handleUpdate = () => {
    if (comment.content !== content) {
      dispatch(updateComment({ comment, post, content, auth }));
      setOnEdit(false);
    } else {
      setOnEdit(false);
    }
  };

  const handleLike = async () => {
    if (loadLike) return;

    setIsLike(true);

    setLoadLike(true);
    await dispatch(likeComment({ comment, post, auth }));
    setLoadLike(false);
  };

  const handleUnLike = async () => {
    if (loadLike) return;

    setIsLike(false);
    setLoadLike(true);
    await dispatch(unLikeComment({ comment, post, auth }));
    setLoadLike(false);
  };

  const handleReply = () => {
    if (onReply) {
      return setOnReply(false);
    }
    setOnReply({...comment, commentId});
  };

  const styleCard = {
    opacity: comment._id ? 1 : 0.5,
    pointerEvents: comment._id ? "inherit" : "none",
  };

  return (
    <div className="enhanced-comment-card" style={styleCard}>
      <div className="comment-header">
        <Link to={`/profile/${comment.user._id}`} className="comment-user">
          <Avatar src={comment.user.avatar} size="small-avatar" />
          <span className="comment-username">{comment.user.username}</span>
        </Link>
        <div className="comment-actions">
          <CommentMenu post={post} comment={comment} setOnEdit={setOnEdit} />
          <div className="comment-like-btn">
            <LikeButton
              isLike={isLike}
              handleLike={handleLike}
              handleUnLike={handleUnLike}
            />
          </div>
        </div>
      </div>

      <div className="comment-content">
        {onEdit ? (
          <div className="comment-edit">
            <textarea
              className="comment-edit-textarea"
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edit your comment..."
            />
            <div className="comment-edit-actions">
              <button onClick={handleUpdate} className="update-btn">
                <i className="fas fa-check"></i> Update
              </button>
              <button onClick={() => setOnEdit(false)} className="cancel-btn">
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-text">
            {comment.tag && comment.tag._id !== comment.user._id && (
              <Link
                to={`/profile/${comment.tag._id}`}
                className="comment-tag"
              >
                @{comment.tag.username}
              </Link>
            )}
            <span className="comment-body">
              {content.length < 100
                ? content
                : readMore
                ? content + " "
                : content.slice(0, 100) + "..."}
            </span>
            {content.length > 100 && (
              <button
                className="read-more-btn"
                onClick={() => setReadMore(!readMore)}
              >
                {readMore ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        <div className="comment-meta">
          <span className="comment-time">
            {moment(comment.createdAt).fromNow()}
          </span>
          <div className="safety-indicator-container">
            <span
              className={`comment-safety-pill ${safetyStatus}`}
              onClick={() => setShowAnalysis(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className="comment-safety-dot" />
              {safetyStatus === "unsafe"
                ? "Flagged"
                : safetyStatus === "safe"
                ? "Safe"
                : "Unknown"}
            </span>
            <button 
              className="analyze-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowAnalysis(true);
              }}
              title="View analysis details"
            >
              <FaCircleInfo />
            </button>
          </div>
          
          {comment.likes.length > 0 && (
            <span className="comment-likes">
              <i className="fas fa-heart"></i>
              {comment.likes.length}
            </span>
          )}
          
          {!onEdit && (
            <button
              className="reply-btn"
              onClick={handleReply}
            >
              <i className="fas fa-reply"></i>
              {onReply ? "Cancel" : "Reply"}
            </button>
          )}
        </div>
      </div>

      {onReply && (
        <InputComment post={post} onReply={onReply} setOnReply={setOnReply}>
          <Link
            style={{ textDecoration: "none" }}
            className="mr-1"
            to={`/profile/${onReply.user._id}`}
          >
            @{onReply.user.username}
          </Link>
        </InputComment>
      )}
      
      {showAnalysis && (
        <div className="analysis-modal-overlay" onClick={() => setShowAnalysis(false)}>
          <div className="analysis-modal" onClick={e => e.stopPropagation()}>
            <div className="analysis-modal-header">
              <h4>Content Safety Analysis</h4>
              <button className="close-btn" onClick={() => setShowAnalysis(false)}>
                <FaXmark />
              </button>
            </div>
            <div className="analysis-modal-content">
              <div className="analysis-status" style={{ color: safetyDetails.color }}>
                <span className="analysis-icon" style={{ fontSize: '24px' }}>{safetyDetails.icon}</span>
                <h3>{safetyDetails.title}</h3>
              </div>
              <p className="analysis-description">{safetyDetails.description}</p>
              
              {safetyCategories.length > 0 && (
                <div className="analysis-categories">
                  <h4>Detected Categories:</h4>
                  <div className="category-tags">
                    {safetyCategories.map((category, index) => (
                      <span key={index} className="category-tag">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="analysis-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Status:</span>
                  <span className="metadata-value">{safetyStatus.charAt(0).toUpperCase() + safetyStatus.slice(1)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Analyzed:</span>
                  <span className="metadata-value">{moment(comment.updatedAt || comment.createdAt).fromNow()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default CommentCard
