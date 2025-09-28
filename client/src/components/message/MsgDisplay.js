import React from 'react';
import { imageShow, videoShow } from '../../utils/mediaShow'; 

const MsgDisplay = ({user, msg, theme}) => {
    return (
      <div className="whatsapp-message-content">
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
