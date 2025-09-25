import { postDataAPI } from "../../utils/fetchData";
import { GLOBALTYPES } from "./globalTypes";
import valid from "../../utils/valid";

export const TYPES = {
  AUTH: "AUTH",
};

export const login = (data) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
    const res = await postDataAPI("login", data);

    dispatch({
      type: GLOBALTYPES.AUTH,
      payload: { token: res.data.access_token, user: res.data.user },
    });

    dispatch({
      type: GLOBALTYPES.USER_TYPE,
      payload: res.data.user.role,
    });

    localStorage.setItem("firstLogin", true);
    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response.data.msg },
    });
  }
};

export const changePassword = ({oldPassword, newPassword, cnfNewPassword, auth}) => async (dispatch) => {

  if(!oldPassword || oldPassword.length === 0){
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Please enter your old  password." },
    });
  }
  if(!newPassword || newPassword.length === 0){
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Please enter your new  password." },
    });
  }
  if(!cnfNewPassword || cnfNewPassword.length === 0){
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Please confirm your new  password." },
    });
  }
  if(newPassword !==cnfNewPassword){
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Your password does not match" },
    });
  }
  
  try {
    
    

    dispatch({ type: GLOBALTYPES.ALERT, payload: {loading: true} });

    const res = await postDataAPI('changePassword', {oldPassword, newPassword}, auth.token );

    dispatch({ type: GLOBALTYPES.ALERT, payload: {loading: false} });
    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response.data.msg },
    });
  }
};

export const adminLogin = (data) => async (dispatch) => {
  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
    const res = await postDataAPI("admin_login", data);

    dispatch({
      type: GLOBALTYPES.AUTH,
      payload: { token: res.data.access_token, user: res.data.user },
    });

    dispatch({
      type: GLOBALTYPES.USER_TYPE,
      payload: res.data.user.role,
    });

    localStorage.setItem("firstLogin", true);
    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response.data.msg },
    });
  }
};

export const refreshToken = () => async (dispatch) => {
  const firstLogin = localStorage.getItem("firstLogin");
  if (firstLogin) {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
    try {
      const res = await postDataAPI("refresh_token");
      dispatch({
        type: GLOBALTYPES.AUTH,
        payload: { token: res.data.access_token, user: res.data.user },
      });

      dispatch({
        type: GLOBALTYPES.USER_TYPE,
        payload: res.data.user.role,
      });

      dispatch({ type: GLOBALTYPES.ALERT, payload: {} });
    } catch (err) {
      // Clear persisted auth if refresh fails
      try { localStorage.removeItem('auth_state'); } catch (_) {}
      try { localStorage.removeItem('firstLogin'); } catch (_) {}
      dispatch({ type: GLOBALTYPES.AUTH, payload: {} });
      dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Session expired. Please login again.' } });
    }
  }
};

export const register = (data) => async (dispatch) => {
  const check = valid(data);
  if (check.errLength > 0) {
    return dispatch({ type: GLOBALTYPES.ALERT, payload: check.errMsg });
  }

  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI("register", data);

    dispatch({
      type: GLOBALTYPES.AUTH,
      payload: { token: res.data.access_token, user: res.data.user },
    });

    dispatch({
      type: GLOBALTYPES.USER_TYPE,
      payload: res.data.user.role,
    });

    localStorage.setItem("firstLogin", true);
    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response.data.msg },
    });
  }
};

export const registerAdmin = (data) => async (dispatch) => {
  const check = valid(data);
  if (check.errLength > 0) {
    return dispatch({ type: GLOBALTYPES.ALERT, payload: check.errMsg });
  }

  try {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });

    const res = await postDataAPI("register_admin", data);

    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response.data.msg },
    });
  }
};

export const logout = () => async (dispatch, getState) => {
  try {
    // Disconnect socket if present
    const { socket } = getState();
    if (socket && typeof socket.close === 'function') {
      try { socket.close(); } catch (_) {}
    }

    // Clear persisted auth
    try { localStorage.removeItem('auth_state'); } catch (_) {}
    try { localStorage.removeItem('firstLogin'); } catch (_) {}

    // Clear redux auth and socket slices immediately
    dispatch({ type: GLOBALTYPES.AUTH, payload: {} });
    dispatch({ type: GLOBALTYPES.SOCKET, payload: null });

    await postDataAPI("logout");
    window.location.href = "/";
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Logout failed' },
    });
  }
};
