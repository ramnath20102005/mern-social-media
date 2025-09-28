import { GLOBALTYPES } from './globalTypes';
import { getDataAPI, postDataAPI, patchDataAPI, deleteDataAPI } from '../../utils/fetchData';

export const GROUP_TYPES = {
  CREATE_GROUP: 'CREATE_GROUP',
  GET_GROUPS: 'GET_GROUPS',
  UPDATE_GROUP: 'UPDATE_GROUP',
  DELETE_GROUP: 'DELETE_GROUP',
  GET_GROUP_INVITES: 'GET_GROUP_INVITES',
  UPDATE_GROUP_INVITE: 'UPDATE_GROUP_INVITE',
  ADD_GROUP_MESSAGE: 'ADD_GROUP_MESSAGE',
  GET_GROUP_MESSAGES: 'GET_GROUP_MESSAGES',
  LOADING_GROUPS: 'LOADING_GROUPS'
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
    const res = await getDataAPI(`groups/${groupId}`, auth.token);
    
    dispatch({
      type: GROUP_TYPES.UPDATE_GROUP,
      payload: res.data.group
    });

    return res.data.group;

  } catch (err) {
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
  try {
    const messageData = {
      groupId,
      text,
      media: media || [],
      messageType: media && media.length > 0 ? 'image' : 'text'
    };

    const res = await postDataAPI('group-message', messageData, auth.token);
    
    const newMessage = res.data.newMessage;

    // Add message to local state
    dispatch({
      type: GROUP_TYPES.ADD_GROUP_MESSAGE,
      payload: { groupId, message: newMessage }
    });

    // Send via socket for real-time delivery
    socket.emit('addGroupMessage', {
      ...newMessage,
      sender: auth.user._id,
      group: groupId
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to send message' }
    });
  }
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
