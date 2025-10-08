import React, { useState } from 'react'
import { useSelector } from "react-redux";

const LikeButton = ({ isLike, handleLike, handleUnLike }) => {
    const { theme } = useSelector(state => state);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLikeClick = async () => {
      setIsAnimating(true);
      await handleLike();
      setTimeout(() => setIsAnimating(false), 600);
    };

    const handleUnLikeClick = async () => {
      setIsAnimating(true);
      await handleUnLike();
      setTimeout(() => setIsAnimating(false), 300);
    };

  return (
    <div className={`like-button-container ${isAnimating ? 'animating' : ''}`}>
      {isLike ? (
        <i
          className="fas fa-heart liked"
          onClick={handleUnLikeClick}
        />
      ) : (
        <i className="far fa-heart" onClick={handleLikeClick} />
      )}
      {isAnimating && <div className="like-ripple"></div>}
    </div>
  );
};

export default LikeButton
