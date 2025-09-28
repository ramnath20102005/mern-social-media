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

    default:
      return state;
  }
};

export default groupReducer;
