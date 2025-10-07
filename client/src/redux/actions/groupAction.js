import { GLOBALTYPES } from './globalTypes';
import { getDataAPI, postDataAPI, putDataAPI, deleteDataAPI } from '../../utils/fetchData';

export const GROUP_TYPES = {
  CREATE_GROUP: 'CREATE_GROUP',
  GET_GROUPS: 'GET_GROUPS',
  UPDATE_GROUP: 'UPDATE_GROUP',
  DELETE_GROUP: 'DELETE_GROUP',
  ADD_GROUP_IF_NOT_EXISTS: 'ADD_GROUP_IF_NOT_EXISTS',
  UPDATE_GROUP_IMAGE: 'UPDATE_GROUP_IMAGE',
  LOADING_GROUPS: 'LOADING_GROUPS',
  GET_GROUP_INVITES: 'GET_GROUP_INVITES',
  UPDATE_GROUP_INVITE: 'UPDATE_GROUP_INVITE',
  ADD_GROUP_MESSAGE: 'ADD_GROUP_MESSAGE',
  UPDATE_GROUP_MESSAGE: 'UPDATE_GROUP_MESSAGE',
  UPDATE_GROUP_MESSAGE_STATUS: 'UPDATE_GROUP_MESSAGE_STATUS',
  GET_GROUP_MESSAGES: 'GET_GROUP_MESSAGES',
  DELETE_GROUP_MESSAGE: 'DELETE_GROUP_MESSAGE',
  DELETE_MULTIPLE_GROUP_MESSAGES: 'DELETE_MULTIPLE_GROUP_MESSAGES',
  EXTEND_GROUP_EXPIRY: 'EXTEND_GROUP_EXPIRY',
  UPDATE_GROUP_SETTINGS: 'UPDATE_GROUP_SETTINGS',
  GET_GROUP_MEMBERS: 'GET_GROUP_MEMBERS',
  GET_GROUP_MEDIA: 'GET_GROUP_MEDIA',
  UPLOAD_GROUP_AVATAR: 'UPLOAD_GROUP_AVATAR'
};

// Create a new group
export const createGroup = ({ groupData, auth, socket }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI('groups/create', groupData, auth.token);
    
    dispatch({
      type: GROUP_TYPES.CREATE_GROUP,
      payload: res.data.group
    });

    // Join the group socket room
    socket.emit('joinGroup', { 
      groupId: res.data.group._id, 
      userId: auth.user._id 
    });

    dispatch({ 
      type: GLOBALTYPES.ALERT, 
      payload: { success: res.data.msg } 
    });

    return res.data.group;

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to create group' }
    });
  }
};

// Get user's groups
export const getUserGroups = (auth) => async (dispatch) => {
  try {
    dispatch({ type: GROUP_TYPES.LOADING_GROUPS, payload: true });

    const res = await getDataAPI('groups/my-groups', auth.token);
    
    dispatch({
      type: GROUP_TYPES.GET_GROUPS,
      payload: res.data.groups
    });

    dispatch({ type: GROUP_TYPES.LOADING_GROUPS, payload: false });

  } catch (err) {
    dispatch({ type: GROUP_TYPES.LOADING_GROUPS, payload: false });
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to fetch groups' }
    });
  }
};

// Get group details
export const getGroup = ({ groupId, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GROUP_TYPES.LOADING_GROUPS, payload: true });
    
    const res = await getDataAPI(`groups/${groupId}`, auth.token);
    
    // First try to update existing group, if not found, add it
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP,
      payload: res.data.group
    });

    // Also ensure it's in the groups array (for cases where user navigates directly to group)
    dispatch({
      type: 'ADD_GROUP_IF_NOT_EXISTS',
      payload: res.data.group
    });

    dispatch({ type: GROUP_TYPES.LOADING_GROUPS, payload: false });
    return res.data.group;

  } catch (err) {
    dispatch({ type: GROUP_TYPES.LOADING_GROUPS, payload: false });
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to fetch group' }
    });
  }
};

// Invite users to group
export const inviteToGroup = ({ groupId, userIds, message, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI(`groups/${groupId}/invite`, { userIds, message }, auth.token);
    
    dispatch({ 
      type: GLOBALTYPES.ALERT, 
      payload: { success: res.data.msg } 
    });

    return res.data.results;

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to send invites' }
    });
  }
};

// Respond to group invite
export const respondToInvite = ({ inviteId, response, auth, socket }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI(`groups/invites/${inviteId}/respond`, { response }, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP_INVITE,
      payload: { inviteId, response }
    });

    if (response === 'accept' && res.data.group) {
      // Add group to user's groups
      dispatch({
        type: GROUP_TYPES.CREATE_GROUP,
        payload: res.data.group
      });

      // Join the group socket room
      socket.emit('joinGroup', { 
        groupId: res.data.group._id, 
        userId: auth.user._id 
      });

      // Send group notification
      socket.emit('groupNotification', {
        groupId: res.data.group._id,
        notification: {
          type: 'member_joined',
          user: auth.user,
          message: `${auth.user.fullname} joined the group`
        }
      });
    }

    dispatch({ 
      type: GLOBALTYPES.ALERT, 
      payload: { success: res.data.msg } 
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to respond to invite' }
    });
  }
};

// Get pending group invites
export const getPendingInvites = (auth) => async (dispatch) => {
  try {
    const res = await getDataAPI('groups/invites/pending', auth.token);
    
    dispatch({
      type: GROUP_TYPES.GET_GROUP_INVITES,
      payload: res.data.invites
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to fetch invites' }
    });
  }
};

// Leave group
export const leaveGroup = ({ groupId, auth, socket }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI(`groups/${groupId}/leave`, {}, auth.token);
    
    dispatch({
      type: GROUP_TYPES.DELETE_GROUP,
      payload: groupId
    });

    // Leave the group socket room
    socket.emit('leaveGroup', { 
      groupId, 
      userId: auth.user._id 
    });

    // Send group notification
    socket.emit('groupNotification', {
      groupId,
      notification: {
        type: 'member_left',
        user: auth.user,
        message: `${auth.user.fullname} left the group`
      }
    });

    dispatch({ 
      type: GLOBALTYPES.ALERT, 
      payload: { success: res.data.msg } 
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to leave group' }
    });
  }
};

// Delete group (admin only)
export const deleteGroup = ({ groupId, auth, socket }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await deleteDataAPI(`groups/${groupId}`, auth.token);
    
    dispatch({
      type: GROUP_TYPES.DELETE_GROUP,
      payload: groupId
    });

    // Send group notification
    socket.emit('groupNotification', {
      groupId,
      notification: {
        type: 'group_expired',
        user: auth.user,
        message: `Group was ended by ${auth.user.fullname}`
      }
    });

    dispatch({ 
      type: GLOBALTYPES.ALERT, 
      payload: { success: res.data.msg } 
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to delete group' }
    });
  }
};

// Send group message
export const sendGroupMessage = ({ groupId, text, media, auth, socket }) => async (dispatch) => {
  // Generate temporary ID for optimistic UI
  const tempId = `temp_${Date.now()}_${Math.random()}`;
  const optimisticMessage = {
    _id: tempId,
    tempId,
    sender: auth.user,
    group: groupId,
    text,
    media: media || [],
    messageType: media && media.length > 0 ? 'image' : 'text',
    isGroupMessage: true,
    createdAt: new Date().toISOString(),
    messageStatus: 'sending'
  };

  // Add optimistic message to UI
  dispatch({
    type: GROUP_TYPES.ADD_GROUP_MESSAGE,
    payload: { groupId, message: optimisticMessage }
  });

  // Prepare message for socket
  const messageData = {
    tempId,
    sender: auth.user._id,
    group: groupId,
    text,
    media: media || [],
    messageType: media && media.length > 0 ? 'image' : 'text'
  };

  // Send via socket with acknowledgment
  socket.emit('addGroupMessage', messageData, (response) => {
    if (response.success) {
      console.log('✅ Group message saved successfully:', response.message);
      // Replace optimistic message with saved message
      dispatch({
        type: GROUP_TYPES.UPDATE_GROUP_MESSAGE,
        payload: {
          groupId,
          tempId: response.tempId,
          message: {
            ...response.message,
            messageStatus: 'sent'
          }
        }
      });
    } else {
      console.error('❌ Failed to save group message:', response.error);
      // Mark message as failed
      dispatch({
        type: GROUP_TYPES.UPDATE_GROUP_MESSAGE_STATUS,
        payload: {
          groupId,
          tempId: response.tempId,
          status: 'failed',
          error: response.error
        }
      });
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: response.error || 'Failed to send message' }
      });
    }
  });
};

// Get group messages
export const getGroupMessages = ({ groupId, auth, page = 1 }) => async (dispatch) => {
  try {
    const res = await getDataAPI(`group-messages/${groupId}?page=${page}`, auth.token);
    
    dispatch({
      type: GROUP_TYPES.GET_GROUP_MESSAGES,
      payload: { 
        groupId, 
        messages: res.data.messages,
        page 
      }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to fetch messages' }
    });
  }
};

// Update group information
export const updateGroup = ({ groupId, groupData, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await putDataAPI(`groups/${groupId}/update`, groupData, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP,
      payload: res.data.group
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to update group' }
    });
  }
};

// Extend group expiry
export const extendGroupExpiry = ({ groupId, hours, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI(`groups/${groupId}/extend-expiry`, { hours }, auth.token);
    
    dispatch({
      type: GROUP_TYPES.EXTEND_GROUP_EXPIRY,
      payload: { groupId, newExpiryDate: res.data.newExpiryDate }
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to extend expiry' }
    });
  }
};

// Upload group avatar
export const uploadGroupAvatar = ({ groupId, avatar, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI(`groups/${groupId}/avatar/upload`, { avatar }, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPLOAD_GROUP_AVATAR,
      payload: { groupId, avatar: res.data.avatar }
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to upload avatar' }
    });
  }
};

// Update group settings
export const updateGroupSettings = ({ groupId, settings, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await putDataAPI(`groups/${groupId}/settings`, settings, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP_SETTINGS,
      payload: { groupId, settings: res.data.settings }
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to update settings' }
    });
  }
};

// Get group members
export const getGroupMembers = ({ groupId, auth }) => async (dispatch) => {
  try {
    const res = await getDataAPI(`groups/${groupId}/members`, auth.token);
    
    dispatch({
      type: GROUP_TYPES.GET_GROUP_MEMBERS,
      payload: { groupId, members: res.data }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to fetch members' }
    });
  }
};

// Get group media
export const getGroupMedia = ({ groupId, auth, page = 1 }) => async (dispatch) => {
  try {
    const res = await getDataAPI(`groups/${groupId}/media?page=${page}`, auth.token);
    
    dispatch({
      type: GROUP_TYPES.GET_GROUP_MEDIA,
      payload: { groupId, media: res.data.media, page }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to fetch media' }
    });
  }
};

// Remove member from group
export const removeMember = ({ groupId, userId, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await deleteDataAPI(`groups/${groupId}/remove-member/${userId}`, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP,
      payload: { groupId, action: 'remove_member', userId }
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to remove member' }
    });
  }
};

// Promote member to admin
export const promoteMember = ({ groupId, userId, auth }) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await putDataAPI(`groups/${groupId}/promote/${userId}`, {}, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP,
      payload: { groupId, action: 'promote_member', userId }
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to promote member' }
    });
  }
};

// Delete single group message
export const deleteGroupMessage = ({ messageId, groupId, auth, socket }) => async (dispatch) => {
  try {
    console.log('🚀 DELETE API call starting for message:', messageId);
    console.log('📡 API endpoint:', `group-messages/${messageId}`);
    console.log('🔑 Auth token:', auth.token ? 'Present' : 'Missing');
    
    const res = await deleteDataAPI(`group-messages/${messageId}`, auth.token);
    console.log('✅ DELETE API response:', res.data);
    
    dispatch({
      type: GROUP_TYPES.DELETE_GROUP_MESSAGE,
      payload: { groupId, messageId }
    });
    console.log('📤 Redux action dispatched: DELETE_GROUP_MESSAGE');

    // Emit socket event for real-time deletion
    if (socket) {
      console.log('🔌 Emitting socket event: deleteGroupMessage');
      socket.emit('deleteGroupMessage', {
        messageId,
        groupId,
        userId: auth.user._id
      });
    } else {
      console.warn('⚠️ No socket available for real-time update');
    }

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg || 'Message deleted successfully' }
    });

    return { success: true, data: res.data };

  } catch (err) {
    console.error('❌ DELETE API error:', err);
    console.error('📄 Error response:', err.response?.data);
    console.error('🔢 Error status:', err.response?.status);
    
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to delete message' }
    });
    
    throw err; // Re-throw so component can handle it
  }
};

// Delete multiple group messages
export const deleteMultipleGroupMessages = ({ messageIds, groupId, auth, socket }) => async (dispatch) => {
  try {
    const res = await postDataAPI(`group-messages/delete-multiple`, { messageIds, groupId }, auth.token);
    
    dispatch({
      type: GROUP_TYPES.DELETE_MULTIPLE_GROUP_MESSAGES,
      payload: { groupId, messageIds }
    });

    // Emit socket event for real-time deletion
    if (socket) {
      socket.emit('deleteMultipleGroupMessages', {
        messageIds,
        groupId,
        userId: auth.user._id
      });
    }

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg || `${messageIds.length} messages deleted successfully` }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to delete messages' }
    });
  }
};
