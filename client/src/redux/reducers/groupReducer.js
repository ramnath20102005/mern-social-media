import { GROUP_TYPES } from '../actions/groupAction';

const initialState = {
  groups: [],
  invites: [],
  groupMessages: {},
  loading: false
};

const groupReducer = (state = initialState, action) => {
  switch (action.type) {
    case GROUP_TYPES.LOADING_GROUPS:
      return {
        ...state,
        loading: action.payload
      };

    case GROUP_TYPES.CREATE_GROUP:
      return {
        ...state,
        groups: [action.payload, ...state.groups]
      };

    case GROUP_TYPES.GET_GROUPS:
      return {
        ...state,
        groups: action.payload
      };

    case GROUP_TYPES.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map(group => 
          group._id === action.payload._id ? action.payload : group
        )
      };

    case 'ADD_GROUP_IF_NOT_EXISTS':
      const groupExists = state.groups.some(group => group._id === action.payload._id);
      if (groupExists) {
        return {
          ...state,
          groups: state.groups.map(group => 
            group._id === action.payload._id ? action.payload : group
          )
        };
      } else {
        return {
          ...state,
          groups: [action.payload, ...state.groups]
        };
      }

    case GROUP_TYPES.DELETE_GROUP:
      return {
        ...state,
        groups: state.groups.filter(group => group._id !== action.payload),
        groupMessages: {
          ...state.groupMessages,
          [action.payload]: undefined
        }
      };

    case GROUP_TYPES.GET_GROUP_INVITES:
      return {
        ...state,
        invites: action.payload
      };

    case GROUP_TYPES.UPDATE_GROUP_INVITE:
      return {
        ...state,
        invites: state.invites.filter(invite => invite._id !== action.payload.inviteId)
      };

    case GROUP_TYPES.ADD_GROUP_MESSAGE:
      const { groupId, message } = action.payload;
      const existingMessages = state.groupMessages[groupId] || [];
      
      // Check if message already exists to prevent duplicates
      const messageExists = existingMessages.some(msg => msg._id === message._id);
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [groupId]: messageExists ? existingMessages : [...existingMessages, message]
        }
      };

    case 'ADD_GROUP_MESSAGE':
      const { groupId: gId, message: msg } = action.payload;
      const currentMessages = state.groupMessages[gId] || [];
      
      // Check if message already exists to prevent duplicates
      const msgExists = currentMessages.some(m => m._id === msg._id);
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [gId]: msgExists ? currentMessages : [...currentMessages, msg]
        }
      };

    case GROUP_TYPES.GET_GROUP_MESSAGES:
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [action.payload.groupId]: action.payload.page === 1 
            ? action.payload.messages
            : [...(state.groupMessages[action.payload.groupId] || []), ...action.payload.messages]
        }
      };

    case GROUP_TYPES.EXTEND_GROUP_EXPIRY:
      return {
        ...state,
        groups: state.groups.map(group => 
          group._id === action.payload.groupId
            ? { ...group, expiryDate: action.payload.newExpiryDate, isExpired: false }
            : group
        )
      };

    case GROUP_TYPES.UPLOAD_GROUP_AVATAR:
      return {
        ...state,
        groups: state.groups.map(group => 
          group._id === action.payload.groupId
            ? { ...group, avatar: action.payload.avatar }
            : group
        )
      };

    case GROUP_TYPES.UPDATE_GROUP_SETTINGS:
      return {
        ...state,
        groups: state.groups.map(group => 
          group._id === action.payload.groupId
            ? { ...group, settings: { ...group.settings, ...action.payload.settings } }
            : group
        )
      };

    case GROUP_TYPES.GET_GROUP_MEMBERS:
      return {
        ...state,
        groupMembers: {
          ...state.groupMembers,
          [action.payload.groupId]: action.payload.members
        }
      };

    case GROUP_TYPES.GET_GROUP_MEDIA:
      return {
        ...state,
        groupMedia: {
          ...state.groupMedia,
          [action.payload.groupId]: action.payload.page === 1 
            ? action.payload.media
            : [...(state.groupMedia[action.payload.groupId] || []), ...action.payload.media]
        }
      };

    case GROUP_TYPES.UPDATE_GROUP_MESSAGE:
      const { groupId: ugId, tempId, message: updatedMessage } = action.payload;
      const existingGroupMessages = state.groupMessages[ugId] || [];
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [ugId]: existingGroupMessages.map(msg => 
            msg.tempId === tempId ? { ...updatedMessage } : msg
          )
        }
      };

    case GROUP_TYPES.UPDATE_GROUP_MESSAGE_STATUS:
      const { groupId: ugsId, tempId: ugsTempId, status, error } = action.payload;
      const existingGroupMsgs = state.groupMessages[ugsId] || [];
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [ugsId]: existingGroupMsgs.map(msg => 
            msg.tempId === ugsTempId 
              ? { ...msg, messageStatus: status, error }
              : msg
          )
        }
      };

    case GROUP_TYPES.DELETE_GROUP_MESSAGE:
      const { groupId: dgId, messageId } = action.payload;
      const messagesAfterDelete = state.groupMessages[dgId] || [];
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [dgId]: messagesAfterDelete.filter(msg => msg._id !== messageId)
        }
      };

    case GROUP_TYPES.DELETE_MULTIPLE_GROUP_MESSAGES:
      const { groupId: dmgId, messageIds } = action.payload;
      const messagesAfterMultiDelete = state.groupMessages[dmgId] || [];
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [dmgId]: messagesAfterMultiDelete.filter(msg => !messageIds.includes(msg._id))
        }
      };

    default:
      return state;
  }
};

export default groupReducer;
