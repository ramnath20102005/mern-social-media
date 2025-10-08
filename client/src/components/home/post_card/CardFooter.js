import React, { useState, useEffect } from 'react'
import { Link } from "react-router-dom";
import LikeButton from '../../LikeButton';
import { useSelector, useDispatch } from "react-redux";
import { likePost, savePost, unLikePost, unSavePost } from "../../../redux/actions/postAction";
import Comments from '../Comments';
import InputComment from '../InputComment';


const CardFooter = ({post}) => {
  const [isLike, setIsLike] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadLike, setLoadLike] = useState(false);
  const [saveLoad, setSaveLoad] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const dispatch = useDispatch();
  const { auth, theme, socket } = useSelector((state) => state);

  useEffect(() => {
    if (post.likes.find((like) => like._id === auth.user._id)) {
      setIsLike(true);
    }else{
      setIsLike(false);
    }
  }, [post.likes, auth.user._id]);

  const handleLike = async () => {
    if(loadLike) return;
    setLoadLike(true);
    await dispatch( likePost({post, auth, socket}) );
    setLoadLike(false);
  };

  const handleUnLike = async () => {
    if(loadLike) return;
    setLoadLike(true);
    await dispatch( unLikePost({post, auth, socket}) );
    setLoadLike(false);
  };

    const handleSavePost = async () => {
      if (saveLoad) return;
      setSaveLoad(true);
      await dispatch(savePost({ post, auth }));
      setSaveLoad(false);
    };

    const handleUnSavePost = async () => {
      if (saveLoad) return;
      setSaveLoad(true);
      await dispatch(unSavePost({ post, auth }));
      setSaveLoad(false);
    };

    useEffect(() => {
      if (auth.user.saved.find(id => id === post._id)) {
        setSaved(true);
      } else {
        setSaved(false);
      }
    }, [post._id, auth.user.saved]);

    return (
      <div className="enhanced-post-footer">
        {/* Action Buttons Row */}
        <div className="action-buttons-container">
          <div className="action-buttons-box">
            <button 
              className={`enhanced-action-btn like-btn ${isLike ? 'liked' : ''}`} 
              disabled={loadLike}
              title={isLike ? 'Unlike' : 'Like'}
            >
              <LikeButton
                isLike={isLike}
                handleLike={handleLike}
                handleUnLike={handleUnLike}
              />
              <span className="btn-label">Like</span>
            </button>

            <button 
              className={`enhanced-action-btn comment-btn ${showComments ? 'active' : ''}`}
              onClick={() => setShowComments(!showComments)}
              title="Comments"
            >
              <i className="far fa-comment"></i>
              <span className="btn-label">Comment</span>
            </button>

            <button 
              className={`enhanced-action-btn bookmark-btn ${saved ? 'saved' : ''}`} 
              disabled={saveLoad}
              onClick={saved ? handleUnSavePost : handleSavePost}
              title={saved ? 'Remove from saved' : 'Save post'}
            >
              {saved ? (
                <i className="fas fa-bookmark"></i>
              ) : (
                <i className="far fa-bookmark"></i>
              )}
              <span className="btn-label">Save</span>
            </button>
          </div>
        </div>

        {/* Post Stats */}
        <div className="post-stats-enhanced">
          {post.likes.length > 0 && (
            <div className="stat-item likes-stat">
              <i className="fas fa-heart"></i>
              <span><strong>{post.likes.length.toLocaleString()}</strong> {post.likes.length === 1 ? 'like' : 'likes'}</span>
            </div>
          )}
          {post.comments.length > 0 && (
            <div 
              className="stat-item comments-stat"
              onClick={() => setShowComments(!showComments)}
            >
              <i className="far fa-comment"></i>
              <span><strong>{post.comments.length}</strong> {post.comments.length === 1 ? 'comment' : 'comments'}</span>
            </div>
          )}
        </div>

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="comments-section-container">
            <div className="comments-header">
              <h6>Comments ({post.comments.length})</h6>
              <button 
                className="close-comments-btn"
                onClick={() => setShowComments(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="comments-content">
              <Comments post={post} />
              <InputComment post={post} />
            </div>
          </div>
        )}
      </div>
    );
}

export default CardFooter
