import React, { useState, useEffect } from 'react';
import Avatar from '../../Avatar';
import { Link } from 'react-router-dom';
import { useSelector , useDispatch } from "react-redux";
import moment from 'moment';
import LikeButton from "../../LikeButton";
import CommentMenu from './CommentMenu';
import { likeComment, unLikeComment, updateComment } from '../../../redux/actions/commentAction';
import InputComment from "../InputComment";

const CommentCard = ({ children, comment, post, commentId }) => {
  const { auth, theme } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [content, setContent] = useState("");
  const [readMore, setReadMore] = useState(false);

  const [isLike, setIsLike] = useState(false);
  const [loadLike, setLoadLike] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  const [onReply, setOnReply] = useState(false);

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
      {children}
    </div>
  );
};

export default CommentCard
