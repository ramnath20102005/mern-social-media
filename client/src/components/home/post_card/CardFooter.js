import React, { useState, useEffect } from 'react'
import { Link } from "react-router-dom";
import LikeButton from '../../LikeButton';
import { useSelector, useDispatch } from "react-redux";
import { likePost, savePost, unLikePost, unSavePost, repostPost } from "../../../redux/actions/postAction";
import ShareModal from '../../ShareModal';
// import { BASE_URL } from '../../../utils/config';


const CardFooter = ({post}) => {
  const [isLike, setIsLike] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadLike, setLoadLike] = useState(false);
  const [saveLoad, setSaveLoad] = useState(false);
  const [isShare, setIsShare] = useState(false);

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
      <div className="modern-card-footer">
        {/* Post Stats */}
        <div className="post-stats">
          <span className="stat-item">
            <strong>{post.likes.length}</strong> likes
          </span>
          <span className="stat-item">
            <strong>{post.comments.length}</strong> comments
          </span>
        </div>

        {/* Action Buttons */}
        <div className="post-actions">
          <div className="action-buttons">
            <button className={`action-btn like-btn ${isLike ? 'active' : ''}`}>
              <LikeButton
                isLike={isLike}
                handleLike={handleLike}
                handleUnLike={handleUnLike}
              />
            </button>

            <Link to={`/post/${post._id}`} className="action-btn comment-btn">
              <i className="far fa-comment"></i>
            </Link>

            <button 
              className="action-btn share-btn"
              onClick={() => setIsShare(!isShare)}
            >
              <i className="fas fa-share"></i>
            </button>

            <button 
              className="action-btn repost-btn"
              title="Repost"
              onClick={() => dispatch(repostPost({ post, auth }))}
            >
              <i className="fas fa-retweet"></i>
            </button>
          </div>

          <button className={`bookmark-btn ${saved ? 'saved' : ''}`}>
            {saved ? (
              <i className="fas fa-bookmark" onClick={handleUnSavePost} />
            ) : (
              <i className="far fa-bookmark" onClick={handleSavePost} />
            )}
          </button>
        </div>

        {isShare && (
          <ShareModal
            url="http://google.com"
            theme={theme}
            setIsShare={setIsShare}
          />
        )}
      </div>
    );
}

export default CardFooter
