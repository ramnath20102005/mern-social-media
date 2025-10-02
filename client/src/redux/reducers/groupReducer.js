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
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [groupId]: [...existingMessages, message]
        }
      };

    case GROUP_TYPES.GET_GROUP_MESSAGES:
      const { groupId: gId, messages, page } = action.payload;
      
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [gId]: page === 1 ? messages : [...messages, ...(state.groupMessages[gId] || [])]
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

    default:
      return state;
  }
};

export default groupReducer;
