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
    // Don't show success message for login - just clear any existing alerts
    dispatch({ type: GLOBALTYPES.ALERT, payload: {} });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'An error occurred' },
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
      payload: { error: err.response?.data?.msg || 'An error occurred' },
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
      payload: { error: err.response?.data?.msg || 'An error occurred' },
    });
  }
};

export const refreshToken = () => async (dispatch) => {
  const firstLogin = localStorage.getItem("firstLogin");
  if (firstLogin) {
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
      // Silently handle refresh token failure - don't show persistent error
      console.log('Refresh token failed:', err.response?.data?.msg || 'Authentication failed');
      
      // Clear the firstLogin flag if refresh fails
      localStorage.removeItem("firstLogin");
      
      // Clear any existing auth state
      dispatch({
        type: GLOBALTYPES.AUTH,
        payload: { token: null, user: null },
      });
      
      // Clear user type as well
      dispatch({
        type: GLOBALTYPES.USER_TYPE,
        payload: null,
      });
      
      // Don't show error alerts for authentication failures
      const errorMsg = err.response?.data?.msg || 'Authentication failed';
      if (errorMsg && 
          !errorMsg.includes('login again') && 
          !errorMsg.includes('Authentication failed') &&
          !errorMsg.includes('Please login')) {
        dispatch({
          type: GLOBALTYPES.ALERT,
          payload: { error: errorMsg },
        });
      }
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
      payload: { error: err.response?.data?.msg || 'An error occurred' },
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
      payload: { error: err.response?.data?.msg || 'An error occurred' },
    });
  }
};

export const logout = () => async (dispatch) => {
  try {
    localStorage.removeItem("firstLogin");

    await postDataAPI("logout");
    window.location.href = "/";
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'An error occurred' },
    });
  }
};
