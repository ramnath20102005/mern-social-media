import React from 'react';
import { imageShow, videoShow } from '../../utils/mediaShow'; 

const MsgDisplay = ({user, msg, theme}) => {
    // Check if this is a story reply message
    const isStoryReply = msg.messageType === 'story_reply';
    
    return (
      <div className="whatsapp-message-content">
        {/* Story Context Section */}
        {isStoryReply && (
          <div className="story-reply-context">
            <div className="story-reply-header">
              <i className="fas fa-reply story-reply-icon"></i>
              <span className="story-reply-label">
                {msg.storyId ? 'Replied to story' : 'Replied to story (deleted)'}
              </span>
            </div>
            
            {msg.storyMedia && msg.storyId ? (
              <div className="story-preview">
                {msg.storyMedia.url ? (
                  msg.storyMedia.url.match(/video/i) ? (
                    <video 
                      src={msg.storyMedia.url} 
                      className="story-thumbnail"
                      muted
                    />
                  ) : (
                    <img 
                      src={msg.storyMedia.url} 
                      alt="Story" 
                      className="story-thumbnail"
                    />
                  )
                ) : (
                  <div className="story-placeholder">
                    <i className="fas fa-image"></i>
                  </div>
                )}
                <div className="story-overlay">
                  <i className="fas fa-play-circle story-play-icon"></i>
                </div>
              </div>
            ) : (
              <div className="deleted-story-preview">
                <div className="deleted-story-icon">
                  <i className="fas fa-trash-alt"></i>
                </div>
                <span className="deleted-story-text">Story no longer available</span>
              </div>
            )}
          </div>
        )}

        {/* Regular Message Content */}
        {msg.text && (
          <div className="message-text">
            {msg.text}
          </div>
        )}

        {msg.media && msg.media.length > 0 && (
          <div className="message-media">
            {msg.media.map((item, index) => (
              <div key={index} className="media-item">
                {item.url.match(/video/i) ? (
                  <video 
                    src={item.url} 
                    controls 
                    className="message-video"
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt="Shared media" 
                    className="message-image"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
}

export default MsgDisplay
