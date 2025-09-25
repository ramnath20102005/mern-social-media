import { PROFILE_TYPES } from "../actions/profileAction";
import { EditData } from '../actions/globalTypes';

const initialState = {
  loading: false,
  ids:[],
  users: [],
  posts: []
};

const profileReducer = (state = initialState, action) => {
  switch (action.type) {
    case PROFILE_TYPES.LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case PROFILE_TYPES.GET_USER:
      return {
        ...state,
        users: [...state.users, action.payload.user],
      };

    case PROFILE_TYPES.FOLLOW:
      return {
        ...state,
        users: EditData(state.users, action.payload._id, action.payload),
      };

    case PROFILE_TYPES.UNFOLLOW:
      return {
        ...state,
        users: EditData(state.users, action.payload._id, action.payload),
      };

    case PROFILE_TYPES.GET_ID:
      return {
        ...state,
        ids: [...state.ids, action.payload],
      };

    case PROFILE_TYPES.GET_POSTS:
      return {
        ...state,
        posts: [...state.posts, action.payload],
      };

    case PROFILE_TYPES.UPDATE_POST:
      return {
        ...state,
        posts: EditData(state.posts, action.payload._id, action.payload)
      };

    case PROFILE_TYPES.UPDATE_USER: {
      const exists = state.users.some(u => u._id === action.payload._id);
      return {
        ...state,
        users: exists
          ? EditData(state.users, action.payload._id, action.payload)
          : [...state.users, action.payload]
      };
    }

    default:
      return state;
  }
};


export default profileReducer;