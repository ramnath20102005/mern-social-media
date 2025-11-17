import { GLOBALTYPES } from "./globalTypes";
import { getDataAPI, deleteDataAPI, patchDataAPI, postDataAPI } from "../../utils/fetchData";
import { createNotify } from "./notifyAction";

export const ADMIN_TYPES = {
  GET_TOTAL_USERS: "GET_TOTAL_USERS",
  GET_TOTAL_POSTS: "GET_TOTAL_POSTS",
  GET_TOTAL_COMMENTS: "GET_TOTAL_COMMENTS",
  GET_TOTAL_LIKES: "GET_TOTAL_LIKES",
  GET_TOTAL_SPAM_POSTS: "GET_TOTAL_SPAM_POSTS",
  GET_TOTAL_ACTIVE_USERS: "GET_TOTAL_ACTIVE_USERS",
  GET_SPAM_POSTS: "GET_SPAM_POSTS",
  LOADING_ADMIN: "LOADING_ADMIN",
  DELETE_POST: "DELETE_POST",
  GET_USERS: "GET_USERS",
  GET_ALL_POSTS: "GET_ALL_POSTS",
  GET_COMMENTS_DETAIL: "GET_COMMENTS_DETAIL",
  IMPERSONATE_USER: "IMPERSONATE_USER",
};

export const getTotalUsers = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("get_total_users", token);
    dispatch({ type: ADMIN_TYPES.GET_TOTAL_USERS, payload: res.data });

    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: {
        error: err.response?.data?.msg || 'An error occurred',
      },
    });
  }
};

export const getTotalPosts = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("get_total_posts", token);
    dispatch({ type: ADMIN_TYPES.GET_TOTAL_POSTS, payload: res.data });

    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: {
        error: err.response?.data?.msg || 'An error occurred',
      },
    });
  }
};

export const getTotalComments = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("get_total_comments", token);
    dispatch({ type: ADMIN_TYPES.GET_TOTAL_COMMENTS, payload: res.data });

    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: {
        error: err.response?.data?.msg || 'An error occurred',
      },
    });
  }
};

export const getTotalLikes = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("get_total_likes", token);
    dispatch({ type: ADMIN_TYPES.GET_TOTAL_LIKES, payload: res.data });

    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: {
        error: err.response?.data?.msg || 'An error occurred',
      },
    });
  }
};

export const getTotalSpamPosts = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("get_total_spam_posts", token);
    dispatch({ type: ADMIN_TYPES.GET_TOTAL_SPAM_POSTS, payload: res.data });

    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'An error occurred' },
    });
  }
};

export const getSpamPosts = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("get_spam_posts", token);
    dispatch({ type: ADMIN_TYPES.GET_SPAM_POSTS, payload: res.data?.spamPosts || [] });

    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'An error occurred' },
    });
  }
};

export const deleteSpamPost = ({ post, auth, socket }) => async (dispatch) => {
  dispatch({ type: ADMIN_TYPES.DELETE_POST, payload: post });

  try {
    const res = await deleteDataAPI(
      `delete_spam_posts/${post._id}`,
      auth.token
    );

    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } });

    const msg = {
      id: auth.user._id,
      text: "Your Post is deleted due to too many reports.",
      recipients: [post.user._id],
      url: `/profile/${post.user._id}`,
    };

    dispatch(createNotify({ msg, auth, socket }));
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: {
        error: err?.response?.data?.msg || 'An error occurred',
      },
    });
  }
};

export const getTotalActiveUsers = ({ auth, socket }) => async (dispatch) => {
  try {
    socket.emit('getActiveUsers', auth.user._id);
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: {
        error: err?.response?.data?.msg || 'An error occurred',
      },
    });
  }
};

export const getUsers = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI("/admin/users", token);
    dispatch({ type: ADMIN_TYPES.GET_USERS, payload: res.data.users });
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to load users' },
    });
  }
};

export const blockUser = ({ userId, auth }) => async (dispatch) => {
  try {
    await patchDataAPI(`/admin/users/${userId}/block`, {}, auth.token);
    dispatch(getUsers(auth.token));
    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'User blocked' } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to block user' },
    });
  }
};

export const unblockUser = ({ userId, auth }) => async (dispatch) => {
  try {
    await patchDataAPI(`/admin/users/${userId}/unblock`, {}, auth.token);
    dispatch(getUsers(auth.token));
    dispatch({ type: GLOBALTYPES.ALERT, payload: { success: 'User unblocked' } });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to unblock user' },
    });
  }
};

export const resetUserPassword = ({ userId, auth }) => async (dispatch) => {
  try {
    const res = await postDataAPI(`/admin/users/${userId}/reset_password`, {}, auth.token);
    return res;
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to reset password' },
    });
  }
};

export const getAllPosts = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI('/admin/posts', token);
    dispatch({ type: ADMIN_TYPES.GET_ALL_POSTS, payload: res.data.posts });
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to load posts' },
    });
  }
};

export const getCommentsDetail = (token) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: true });
    const res = await getDataAPI('/admin/comments', token);
    dispatch({ type: ADMIN_TYPES.GET_COMMENTS_DETAIL, payload: res.data.comments });
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
  } catch (err) {
    dispatch({ type: ADMIN_TYPES.LOADING_ADMIN, payload: false });
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to load comments' },
    });
  }
};

// Admin: impersonate a user (login as that user)
export const impersonateUser = ({ userId, auth }) => async (dispatch) => {
  try {
    const res = await postDataAPI(`/admin/users/${userId}/impersonate`, {}, auth.token);
    const { access_token, user } = res.data || {};
    if (access_token && user) {
      dispatch({ type: GLOBALTYPES.AUTH, payload: { token: access_token, user } });
      dispatch({ type: GLOBALTYPES.USER_TYPE, payload: user.role });
      localStorage.setItem("firstLogin", true);
      localStorage.setItem("userLoggedIn", JSON.stringify({ timestamp: Date.now(), userId: user._id }));
    }
    return res;
  } catch (err) {
    dispatch({ type: GLOBALTYPES.ALERT, payload: { error: err.response?.data?.msg || 'Failed to impersonate user' } });
    return false;
  }
};