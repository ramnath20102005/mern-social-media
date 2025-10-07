import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getDataAPI } from '../../utils/fetchData'
import { GLOBALTYPES } from '../../redux/actions/globalTypes'
import { useParams, useHistory } from 'react-router-dom'
import { MESS_TYPES, getConversations, addUser } from '../../redux/actions/messageAction'
import { getUserGroups } from '../../redux/actions/groupAction'
import MessageSearch from './MessageSearch'
import CreateGroupModal from '../groups/CreateGroupModal'
import GroupInvites from '../groups/GroupInvites'
import QuickGroupCreate from './QuickGroupCreate';

const LeftSide = () => {
    const { auth, message, theme, online = { users: [] }, groups } = useSelector(state => state);
    const dispatch = useDispatch();
    const history = useHistory();
    const { id } = useParams();
    const pageEnd = useRef();
    const [page, setPage] = useState(0);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'groups', 'invites'
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showQuickGroupCreate, setShowQuickGroupCreate] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showMessagingMenu, setShowMessagingMenu] = useState(false);
    
    const handleAddUser = (user) => {
        dispatch(addUser({user, message}));
        return history.push(`/message/${user._id}`);
    };

    const handleGroupCreated = (newGroup) => {
        // Navigate to the new group chat
        history.push(`/group/${newGroup._id}`);
        
        // Refresh groups list
        dispatch(getUserGroups(auth));
        
        // Switch to groups tab
        setActiveTab('groups');
    };

    const isActive = (user) => {
      if(id === user._id) return 'active';
      return '';
    }

    useEffect(() => {
      console.log('LeftSide useEffect - Loading conversations...');
      // Always load conversations when component mounts and user is authenticated
      if(auth.token && !message.firstLoad){
          dispatch(getConversations({auth}));
      }
      // Load groups when component mounts
      if(auth.token){
          dispatch(getUserGroups(auth));
      }
    },[dispatch, auth.token, message.firstLoad]);

     useEffect(() => {
       const observer = new IntersectionObserver(
         (entries) => {
           if (entries[0].isIntersecting) {
             setPage((p) => p + 1);
           }
         },
         {
           threshold: 0.1,
         }
       );
       observer.observe(pageEnd.current);
     }, [setPage]);

     useEffect(() => {
       if (message.resultUsers >= (page - 1) * 9 && page > 1) {
         dispatch(getConversations({ auth, page }));
       }
     }, [message.resultUsers, page, auth, dispatch]);

    return (
      <div className="whatsapp-sidebar-container">
        {/* Sidebar Header */}
        <div className="whatsapp-sidebar-header">
          <div className="sidebar-header-content">
            <h2 className="sidebar-title">
              {activeTab === 'chats' ? 'Chats' : 
               activeTab === 'groups' ? 'Groups' : 'Invites'}
            </h2>
            <div className="sidebar-header-actions">
              {/* Always show New Group button - more prominent */}
              <button 
                className="sidebar-action-btn new-group-btn"
                onClick={() => setShowCreateGroup(true)}
                title="Create New Group"
              >
                <i className="fas fa-plus"></i>
              </button>
              <button 
                className="sidebar-action-btn"
                onClick={() => setShowSearch(!showSearch)}
                title="Search Conversations"
              >
                <i className="fas fa-search"></i>
              </button>
              <button 
                className="sidebar-action-btn"
                onClick={() => setShowMessagingMenu(!showMessagingMenu)}
                title="Messaging Options"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="sidebar-tabs">
            <button 
              className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              <i className="fas fa-comment"></i>
              <span>Chats</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              <i className="fas fa-users"></i>
              <span>Groups</span>
              {groups.groups && groups.groups.length > 0 && (
                <span className="tab-count">{groups.groups.length}</span>
              )}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'invites' ? 'active' : ''}`}
              onClick={() => setActiveTab('invites')}
            >
              <i className="fas fa-envelope"></i>
              <span>Invites</span>
              {groups.invites && groups.invites.length > 0 && (
                <span className="tab-count">{groups.invites.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Search Bar */}
        <div className="whatsapp-search-container">
          <MessageSearch 
            onUserSelect={handleAddUser}
          />
        </div>

        {/* Content Area */}
        <div className="whatsapp-chat-list">
          {/* Chats Tab */}
          {activeTab === 'chats' && (
            <div className="conversations-list">
              {message.users.length === 0 ? (
                <div className="empty-chats">
                  <div className="empty-chats-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <h3>No conversations yet</h3>
                  <p>Start a conversation by searching for users above</p>
                </div>
              ) : (
                <>
                  {message.users.map((user) => (
                    <div
                      key={user._id}
                      className={`whatsapp-chat-item ${isActive(user)}`}
                      onClick={() => handleAddUser(user)}
                    >
                      <div className="chat-item-avatar">
                        <img src={user.avatar} alt={user.username} className="avatar-image" />
                        <div className={`online-status ${online.users.includes(user._id) ? 'online' : 'offline'}`}></div>
                      </div>
                      <div className="chat-item-content">
                        <div className="chat-item-header">
                          <h4 className="chat-user-name">{user.fullname}</h4>
                          <span className="chat-time">
                            {user.updatedAt ? new Date(user.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'now'}
                          </span>
                        </div>
                        <div className="chat-preview-container">
                          <p className="chat-preview">
                            {user.text || 'Start a conversation...'}
                          </p>
                          {user.unreadCount > 0 && (
                            <span className="unread-count">{user.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <button style={{opacity: 0}} ref={pageEnd}>Load more..</button>
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div className="groups-list">
              {!groups.groups || groups.groups.length === 0 ? (
                <div className="empty-groups">
                  <div className="empty-groups-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3>No groups yet</h3>
                  <p>Create a group to start chatting with multiple people</p>
                  <button 
                    className="create-group-cta"
                    onClick={() => setShowCreateGroup(true)}
                  >
                    <i className="fas fa-plus"></i>
                    Create Group
                  </button>
                </div>
              ) : (
                groups.groups.map((group) => (
                  <div
                    key={group._id}
                    className="whatsapp-chat-item group-item"
                    onClick={() => history.push(`/group/${group._id}`)}
                  >
                    <div className="chat-item-avatar">
                      <img src={group.avatar} alt={group.name} className="avatar-image" />
                      <div className="group-indicator">
                        <i className="fas fa-users"></i>
                      </div>
                    </div>
                    <div className="chat-item-content">
                      <div className="chat-item-header">
                        <h4 className="chat-user-name">{group.name}</h4>
                        <span className="chat-time">
                          {group.conversation?.lastMessage?.timestamp 
                            ? new Date(group.conversation.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : 'now'
                          }
                        </span>
                      </div>
                      <div className="chat-preview-container">
                        <p className="chat-preview">
                          {group.conversation?.lastMessage?.text 
                            ? (group.creator._id === auth.user._id && group.conversation.lastMessage.text.includes('created the group'))
                              ? 'Group created by you'
                              : group.conversation.lastMessage.text
                            : 'No messages yet'
                          }
                        </p>
                        <div className="group-meta">
                          <span className="member-count">{group.memberCount} members</span>
                          {group.isExpired && <span className="expired-badge">Expired</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <div className="invites-container">
              <GroupInvites />
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        <CreateGroupModal 
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />

        {/* Quick Group Create Modal */}
        <QuickGroupCreate
          isOpen={showQuickGroupCreate}
          onClose={() => setShowQuickGroupCreate(false)}
          onGroupCreated={handleGroupCreated}
        />

        {/* Search Overlay */}
        {showSearch && (
          <div className="search-overlay">
            <div className="search-overlay-content">
              <div className="search-header">
                <button 
                  className="close-search-btn"
                  onClick={() => setShowSearch(false)}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3>Search Conversations</h3>
              </div>
              <MessageSearch onClose={() => setShowSearch(false)} />
            </div>
          </div>
        )}

        {/* Messaging Menu */}
        {showMessagingMenu && (
          <div className="messaging-menu-overlay" onClick={() => setShowMessagingMenu(false)}>
            <div className="messaging-menu" onClick={e => e.stopPropagation()}>
              <div className="menu-item" onClick={() => {
                setShowQuickGroupCreate(true);
                setShowMessagingMenu(false);
              }}>
                <i className="fas fa-users-plus"></i>
                <span>New Group</span>
              </div>
              <div className="menu-item" onClick={() => {
                setShowSearch(true);
                setShowMessagingMenu(false);
              }}>
                <i className="fas fa-search"></i>
                <span>Search Messages</span>
              </div>
              <div className="menu-item" onClick={() => {
                setActiveTab('invites');
                setShowMessagingMenu(false);
              }}>
                <i className="fas fa-envelope"></i>
                <span>Group Invites</span>
              </div>
              <div className="menu-item" onClick={() => {
                history.push('/settings');
                setShowMessagingMenu(false);
              }}>
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}

export default LeftSide
