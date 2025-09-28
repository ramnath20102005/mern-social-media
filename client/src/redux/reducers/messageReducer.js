import { MESSAGE_TYPES } from "../actions/messageAction";
import { GLOBALTYPES } from "../actions/globalTypes";

const initialState = {
    users: [],
    resultUsers: 0,
    data: [],
    resultData: 0,
    firstLoad: false,
    typingUsers: [] // array of userIds currently typing
};

const messageReducer = (state = initialState, action) => {
  switch (action.type) {
    case MESSAGE_TYPES.ADD_USER:
      // Check if user already exists to prevent duplicates
      const userExists = state.users.some(user => user._id === action.payload._id);
      if (userExists) {
        return state;
      }
      return {
        ...state,
        users: [action.payload, ...state.users],
      };

    case MESSAGE_TYPES.ADD_MESSAGE:
      console.log('ADD_MESSAGE reducer called with:', action.payload);
      return {
        ...state,
        data: [...state.data, action.payload],
        users: state.users.map((user) =>
          user._id === action.payload.recipient ||
          user._id === action.payload.sender
            ? {
                ...user,
                text: action.payload.text,
                media: action.payload.media,
              }
            : user
        ),
      };

    case MESSAGE_TYPES.GET_CONVERSATIONS:
      return {
        ...state,
        users: action.payload.newArr,
        resultUsers: action.payload.result,
        firstLoad: true
      };

    case MESSAGE_TYPES.GET_MESSAGES:
      console.log('GET_MESSAGES reducer called with:', action.payload);
      return {
        ...state,
        data: action.payload.messages ? action.payload.messages.reverse() : [],
        resultData: action.payload.result || 0,
      };

    case MESSAGE_TYPES.TYPING_START:
      return {
        ...state,
        typingUsers: state.typingUsers.includes(action.payload)
          ? state.typingUsers
          : [...state.typingUsers, action.payload]
      };

    case MESSAGE_TYPES.TYPING_STOP:
      return {
        ...state,
        typingUsers: state.typingUsers.filter(id => id !== action.payload)
      };

    // Reset message state when user logs out
    case GLOBALTYPES.AUTH:
      // If user is logging out (token becomes null), reset message state
      if (!action.payload.token) {
        return initialState;
      }
      return state;

    default:
      return state;
  }
};

export default messageReducer;
