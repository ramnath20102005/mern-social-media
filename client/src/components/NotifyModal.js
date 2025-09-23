import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import moment from 'moment';
import { deleteAllNotifies, isReadNotify, NOTIFY_TYPES } from '../redux/actions/notifyAction';
import '../styles/notifications.css';

const NotifyModal = () => {
    const { auth, notify } = useSelector(state => state);
    const dispatch = useDispatch();
    const [activeFilter, setActiveFilter] = useState('all');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [hoveredNotification, setHoveredNotification] = useState(null);

    const handleIsRead = (msg) => {
      dispatch(isReadNotify({msg, auth}));
    };

    const handleDeleteAll = () => {
      const newArr = notify.data.filter(item => item.isRead === false)
      if(newArr.length === 0) return dispatch(deleteAllNotifies(auth.token))

      if(window.confirm(`You have ${newArr.length} unread notifications. Do you want to delete all notifications?`)){
        return dispatch(deleteAllNotifies(auth.token))
      }
    };

    const handleMarkAllRead = () => {
      const unreadNotifications = notify.data.filter(item => !item.isRead);
      unreadNotifications.forEach(msg => {
        dispatch(isReadNotify({msg, auth}));
      });
    };

    const handleSound = () => {
      dispatch({type: NOTIFY_TYPES.UPDATE_SOUND, payload: !notify.sound });
    };

    const getFilteredNotifications = () => {
      switch(activeFilter) {
        case 'unread':
          return notify.data.filter(item => !item.isRead);
        case 'read':
          return notify.data.filter(item => item.isRead);
        default:
          return notify.data;
      }
    };

    const unreadCount = notify.data.filter(item => !item.isRead).length;
    const filteredNotifications = getFilteredNotifications();

    const getNotificationIcon = (type) => {
      switch(type) {
        case 'like': return 'fas fa-heart';
        case 'comment': return 'fas fa-comment';
        case 'follow': return 'fas fa-user-plus';
        case 'message': return 'fas fa-envelope';
        default: return 'fas fa-bell';
      }
    };

    const getNotificationColor = (type) => {
      switch(type) {
        case 'like': return '#ff4757';
        case 'comment': return '#3742fa';
        case 'follow': return '#2ed573';
        case 'message': return '#ffa502';
        default: return '#6c63ff';
      }
    };

    if (isCollapsed) {
      return (
        <div className="notification-bell-container">
          <div 
            className="notification-bell"
            onClick={() => setIsCollapsed(false)}
          >
            <i className="fas fa-bell"></i>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="modern-notification-modal">
        {/* Header */}
        <div className="notification-header">
          <div className="notification-title-section">
            <h3 className="notification-title">Notifications</h3>
            <div className="notification-count-badge">
              {unreadCount > 0 && `${unreadCount} new`}
            </div>
          </div>
          <div className="notification-header-actions">
            <button 
              className="notification-sound-btn"
              onClick={handleSound}
              title={notify.sound ? 'Disable sound' : 'Enable sound'}
            >
              <i className={notify.sound ? 'fas fa-bell' : 'fas fa-bell-slash'}></i>
            </button>
            <button 
              className="notification-collapse-btn"
              onClick={() => setIsCollapsed(true)}
              title="Minimize"
            >
              <i className="fas fa-minus"></i>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="notification-filters">
          <button 
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({notify.data.length})
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'read' ? 'active' : ''}`}
            onClick={() => setActiveFilter('read')}
          >
            Read ({notify.data.length - unreadCount})
          </button>
        </div>

        {/* Bulk Actions */}
        {filteredNotifications.length > 0 && (
          <div className="notification-bulk-actions">
            <button 
              className="bulk-action-btn mark-read"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <i className="fas fa-check-double"></i>
              Mark all read
            </button>
            <button 
              className="bulk-action-btn delete-all"
              onClick={handleDeleteAll}
            >
              <i className="fas fa-trash"></i>
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="notifications-container">
          {filteredNotifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">
                <i className="fas fa-bell-slash"></i>
              </div>
              <h4 className="empty-title">
                {activeFilter === 'all' ? 'No notifications yet' : 
                 activeFilter === 'unread' ? 'All caught up!' : 'No read notifications'}
              </h4>
              <p className="empty-subtitle">
                {activeFilter === 'all' ? 'When you get notifications, they\'ll show up here' :
                 activeFilter === 'unread' ? 'You\'re all up to date' : 'Read notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((msg, index) => (
                <div 
                  key={index}
                  className={`notification-item ${!msg.isRead ? 'unread' : 'read'}`}
                  onMouseEnter={() => setHoveredNotification(index)}
                  onMouseLeave={() => setHoveredNotification(null)}
                >
                  <Link
                    to={`${msg.url}`}
                    className="notification-link"
                    onClick={() => handleIsRead(msg)}
                  >
                    <div className="notification-avatar">
                      <Avatar src={msg.user.avatar} size="big-avatar" />
                      <div 
                        className="notification-type-icon"
                        style={{ backgroundColor: getNotificationColor(msg.type) }}
                      >
                        <i className={getNotificationIcon(msg.type)}></i>
                      </div>
                    </div>

                    <div className="notification-content">
                      <div className="notification-text">
                        <strong className="notification-username">{msg.user.username}</strong>
                        <span className="notification-message">{msg.text}</span>
                      </div>
                      {msg.content && (
                        <div className="notification-preview">
                          {msg.content.slice(0, 50)}{msg.content.length > 50 ? '...' : ''}
                        </div>
                      )}
                      <div className="notification-time">
                        {moment(msg.createdAt).fromNow()}
                      </div>
                    </div>

                    <div className="notification-media">
                      {msg.image && <Avatar src={msg.image} size="medium-avatar" />}
                    </div>
                  </Link>

                  {/* Action buttons on hover */}
                  {hoveredNotification === index && (
                    <div className="notification-actions">
                      {!msg.isRead && (
                        <button 
                          className="action-btn mark-read-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            handleIsRead(msg);
                          }}
                          title="Mark as read"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle individual delete
                        }}
                        title="Delete notification"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}

                  {!msg.isRead && <div className="unread-indicator"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
};

export default NotifyModal;
