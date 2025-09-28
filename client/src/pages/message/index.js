import React from 'react'
import LeftSide from '../../components/message/LeftSide'

const Message = () => {
    return (
      <div className="whatsapp-messenger">
        <div className="messenger-sidebar">
          <LeftSide />
        </div>

        <div className="messenger-main">
          <div className="messenger-welcome">
            <div className="welcome-content">
              <div className="welcome-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h2 className="welcome-title">MESME Chat</h2>
              <p className="welcome-subtitle">
                Connect with your friends and share moments instantly on our social platform.
              </p>
              <div className="welcome-features">
                <div className="feature-item">
                  <i className="fas fa-users"></i>
                  <span>Connect with friends</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-heart"></i>
                  <span>Share your moments</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-comments"></i>
                  <span>Real-time messaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default Message
