// filepath: src/components/PostThumb.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { imageShow, videoShow } from "../utils/mediaShow";

const PostThumb = ({ posts, result }) => {
  const { theme } = useSelector((state) => state);
  const [hoveredPost, setHoveredPost] = useState(null);

  if (result === 0) {
    return (
      <div className="instagram-no-posts">
        <div className="no-posts-content">
          <div className="no-posts-icon">
            <i className="fas fa-camera"></i>
          </div>
          <h3>No Posts Yet</h3>
          <p>When you share photos and videos, they'll appear on your profile.</p>
          <Link to="/" className="share-first-post-btn">
            Share your first post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="instagram-post-grid">
      {posts &&
        posts.map((post, index) => (
          <Link 
            to={`/post/${post._id}`} 
            key={post._id}
            className="instagram-post-item"
            onMouseEnter={() => setHoveredPost(post._id)}
            onMouseLeave={() => setHoveredPost(null)}
          >
            <div className="post-thumbnail-container">
              {/* Post Media */}
              <div className="post-media-wrapper">
                {post.images[0].url.match(/video/i) ? (
                  <div className="video-thumbnail">
                    {videoShow(post.images[0].url, theme)}
                    <div className="video-indicator">
                      <i className="fas fa-play"></i>
                    </div>
                  </div>
                ) : (
                  <div className="image-thumbnail">
                    {imageShow(post.images[0].url, theme)}
                  </div>
                )}
                
                {/* Multiple Images Indicator */}
                {post.images.length > 1 && (
                  <div className="multiple-images-indicator">
                    <i className="fas fa-clone"></i>
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              <div className={`post-hover-overlay ${hoveredPost === post._id ? 'visible' : ''}`}>
                <div className="post-stats">
                  <div className="stat-item">
                    <i className="fas fa-heart"></i>
                    <span>{post.likes.length}</span>
                  </div>
                  <div className="stat-item">
                    <i className="fas fa-comment"></i>
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
};

export default PostThumb;
