import { GLOBALTYPES } from '../actions/globalTypes';

const initialState = {
  users: []
};

const onlineReducer = (state = initialState, action) => {
  switch (action.type) {
    case GLOBALTYPES.ONLINE_USERS:
      return {
        ...state,
        users: action.payload
      };
    default:
      return state;
  }
};

export default onlineReducer;
