import { GLOBALTYPES, DeleteData } from "./globalTypes";
import { getDataAPI, patchDataAPI } from "../../utils/fetchData";
import { imageUpload } from "../../utils/imageUpload";
import { createNotify, removeNotify } from "./notifyAction";

export const PROFILE_TYPES = {
  LOADING: "LOADING_PROFILE",
  GET_USER: "GET_PROFILE_USER",
  FOLLOW: "FOLLOW",
  UNFOLLOW: "UNFOLLOW",
  GET_ID: "GET_PROFILE_ID",
  GET_POSTS: "GET_PROFILE_POSTS",
  UPDATE_POST: "UPDATE_PROFILE_POSTS",
  UPDATE_USER: "UPDATE_PROFILE_USER",
};

// get user + posts
export const getProfileUsers = ({ id, auth }) => async (dispatch) => {
  dispatch({ type: PROFILE_TYPES.GET_ID, payload: id });

  try {
    dispatch({ type: PROFILE_TYPES.LOADING, payload: true });

    const users = await getDataAPI(`/user/${id}`, auth.token);
    const posts = await getDataAPI(`/user_posts/${id}`, auth.token);

    dispatch({ type: PROFILE_TYPES.GET_USER, payload: users.data });
    dispatch({
      type: PROFILE_TYPES.GET_POSTS,
      payload: { ...posts.data, _id: id, page: 2 },
    });

    dispatch({ type: PROFILE_TYPES.LOADING, payload: false });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || err.message },
    });
  }
};

// update profile
export const updateProfileUser = ({ userData, avatar, auth }) => async (dispatch) => {
  if (!userData.fullname) {
    return dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Please enter full name." },
    });
  }

  if (userData.fullname.length > 25) {
    return dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Full name is too long." },
    });
  }

  if (userData.story.length > 200) {
    return dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: "Story is too long." },
    });
  }

  try {
    let media;
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { loading: true },
    });

    if (avatar) {
      media = await imageUpload([avatar]);
    }

    const res = await patchDataAPI(
      "user",
      {
        ...userData,
        avatar: avatar ? media[0].url : auth.user.avatar,
      },
      auth.token
    );

    dispatch({
      type: GLOBALTYPES.AUTH,
      payload: {
        ...auth,
        user: {
          ...auth.user,
          ...userData,
          avatar: avatar ? media[0].url : auth.user.avatar,
        },
      },
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg },
    });
  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || err.message },
    });
  }
};

// follow user
export const follow = ({ users, user, socket }) => async (dispatch, getState) => {
  const { auth } = getState();
  const newUser = { ...user, followers: [...user.followers, auth.user] };

  // Optimistic updates based on the latest state
  dispatch({ type: PROFILE_TYPES.FOLLOW, payload: newUser });
  dispatch({
    type: GLOBALTYPES.AUTH,
    payload: {
      ...auth,
      user: { ...auth.user, following: [...auth.user.following, newUser] },
    },
  });

  try {
    const res = await patchDataAPI(`/user/${user._id}/follow`, null, auth.token);

    // Final sync from server
    if (res?.data?.authUser) {
      const freshAuth = { ...getState().auth, user: res.data.authUser };
      dispatch({ type: GLOBALTYPES.AUTH, payload: freshAuth });
      dispatch({ type: PROFILE_TYPES.UPDATE_USER, payload: res.data.authUser });
    }
    if (res?.data?.newUser) {
      dispatch({ type: PROFILE_TYPES.FOLLOW, payload: res.data.newUser });
    }

    socket?.emit && socket.emit("follow", res.data.newUser);

    const msg = {
      id: auth.user._id,
      text: "started following you",
      recipients: [user._id],
      url: `/profile/${auth.user._id}`,
    };
    dispatch(createNotify({ msg, auth: getState().auth, socket }));

    // Fetch latest self profile to keep counts and modals in sync (followers/following & posts)
    try {
      const state = getState();
      const selfRes = await getDataAPI(`/user/${state.auth.user._id}`, state.auth.token);
      if (selfRes?.data?.user) {
        dispatch({ type: GLOBALTYPES.AUTH, payload: { ...state.auth, user: selfRes.data.user } });
        dispatch({ type: PROFILE_TYPES.UPDATE_USER, payload: selfRes.data.user });
      }
    } catch (_) {}

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || err.message },
    });
  }
};

// unfollow user
export const unfollow = ({ users, user, socket }) => async (dispatch, getState) => {
  const { auth } = getState();
  const newUser = {
    ...user,
    followers: DeleteData(user.followers, auth.user._id),
  };

  // Optimistic updates based on the latest state
  dispatch({ type: PROFILE_TYPES.UNFOLLOW, payload: newUser });
  dispatch({
    type: GLOBALTYPES.AUTH,
    payload: {
      ...auth,
      user: {
        ...auth.user,
        following: DeleteData(auth.user.following, newUser._id),
      },
    },
  });

  try {
    const res = await patchDataAPI(`/user/${user._id}/unfollow`, null, auth.token);

    // Final sync from server
    if (res?.data?.authUser) {
      const freshAuth = { ...getState().auth, user: res.data.authUser };
      dispatch({ type: GLOBALTYPES.AUTH, payload: freshAuth });
    }
    if (res?.data?.newUser) {
      dispatch({ type: PROFILE_TYPES.UNFOLLOW, payload: res.data.newUser });
    }

    socket?.emit && socket.emit("unFollow", res.data.newUser);

    const msg = {
      id: auth.user._id,
      text: "stopped following you",
      recipients: [user._id],
      url: `/profile/${auth.user._id}`,
    };

    dispatch(removeNotify({ msg, auth: getState().auth, socket }));

    // Fetch latest self profile to keep counts and modals in sync
    try {
      const state = getState();
      const selfRes = await getDataAPI(`/user/${state.auth.user._id}`, state.auth.token);
      if (selfRes?.data?.user) {
        dispatch({ type: GLOBALTYPES.AUTH, payload: { ...state.auth, user: selfRes.data.user } });
        dispatch({ type: PROFILE_TYPES.UPDATE_USER, payload: selfRes.data.user });
      }
    } catch (_) {}

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || err.message },
    });
  }
};
