import { GLOBALTYPES } from '../actions/globalTypes';

// Hydrate auth state from localStorage so user/following survive a refresh
let initialState = {};
try {
  const persisted = localStorage.getItem('auth_state');
  if (persisted) {
    initialState = JSON.parse(persisted);
  }
} catch (_) {}

const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case GLOBALTYPES.AUTH:
        try {
          localStorage.setItem('auth_state', JSON.stringify(action.payload));
        } catch (_) {}
        return action.payload;

      default:
        return state;
    }
}

export default authReducer;