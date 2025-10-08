import React, { useState } from 'react'
import Carousel from '../../Carousel';

const CardBody = ({ post, theme }) => {
  const [readMore, setReadMore] = useState(false);
  
  return (
    <div className="modern-card-body">
      {/* Post Content */}
      {post.content && (
        <div className="post-content-section">
          <div
            className="post-content-text"
            style={{
              filter: theme ? "invert(1)" : "invert(0)",
              color: theme ? "white" : "#1e293b",
            }}
          >
            <p className="content-paragraph">
              {post.content.length < 150
                ? post.content
                : readMore
                ? post.content
                : post.content.slice(0, 150) + "..."}
            </p>
            {post.content.length > 150 && (
              <button 
                className="read-more-btn" 
                onClick={() => setReadMore(!readMore)}
              >
                {readMore ? (
                  <>
                    <i className="fas fa-chevron-up"></i>
                    Show Less
                  </>
                ) : (
                  <>
                    <i className="fas fa-chevron-down"></i>
                    Read More
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post Location */}
      {post.location && (
        <div className="post-location-section">
          <div className="location-info">
            <i className="fas fa-map-marker-alt"></i>
            <span className="location-name">{post.location.name}</span>
          </div>
        </div>
      )}

      {/* Tagged Users */}
      {post.taggedUsers && post.taggedUsers.length > 0 && (
        <div className="tagged-users-section">
          <div className="tagged-users-info">
            <i className="fas fa-user-tag"></i>
            <span className="tagged-text">
              with {post.taggedUsers.map((user, index) => (
                <span key={user._id} className="tagged-user-name">
                  {user.username}
                  {index < post.taggedUsers.length - 1 && ", "}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* Feeling/Activity */}
      {(post.feeling || post.activity) && (
        <div className="feeling-activity-section">
          <div className="feeling-activity-info">
            {post.feeling && (
              <span className="feeling-badge">
                <i className="fas fa-smile"></i>
                feeling {post.feeling}
              </span>
            )}
            {post.activity && (
              <span className="activity-badge">
                <i className="fas fa-running"></i>
                {post.activity}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Post Images/Videos */}
      {post.images && post.images.length > 0 && (
        <div className="post-media-section">
          <Carousel images={post.images} id={post._id} />
        </div>
      )}
    </div>
  );
};

export default CardBody
