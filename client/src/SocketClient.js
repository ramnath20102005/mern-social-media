import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { POST_TYPES } from "./redux/actions/postAction";
import { ADMIN_TYPES } from "./redux/actions/adminAction";
import { GLOBALTYPES } from "./redux/actions/globalTypes";
import { NOTIFY_TYPES } from "./redux/actions/notifyAction";
import { MESSAGE_TYPES } from "./redux/actions/messageAction";

import audioTone from './audio/pristine-609.mp3' 

const spawnNotification = (body, icon, url, title) => {
  let options = {
    body, icon
  }
  let n = new Notification(title, options);
  n.onclick =  e => {
    e.preventDefault();
    window.open(url, '_blank');
  }
}

const SocketClient = () => {
  const { auth, socket, notify } = useSelector((state) => state);
  const dispatch = useDispatch();

  const audioRef = useRef();

  //!connection
  useEffect(() => {
    if (!socket || typeof socket.emit !== 'function') return;
    if (auth.user.role === "user") {
      socket.emit("joinUser", auth.user._id);
    } else if (auth.user.role === "admin") {
      socket.emit("joinAdmin", auth.user._id);
    }
  }, [socket, auth.user.role, auth.user._id]);

  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("getActiveUsersToClient", (totalActiveUsers) => {
      dispatch({
        type: ADMIN_TYPES.GET_TOTAL_ACTIVE_USERS,
        payload: totalActiveUsers,
      });
    });
    return () => socket.off("getActiveUsersToClient");
  }, [socket, dispatch]);

  //!like Post
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("likeToClient", (newPost) => {
      dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
    });
    return () => socket.off("likeToClient");
  }, [socket, dispatch]);

  //!Unlike Post
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("unLikeToClient", (newPost) => {
      dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
    });
    return () => socket.off("unLikeToClient");
  }, [socket, dispatch]);

  //!Comments
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("createCommentToClient", (newPost) => {
      dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
    });
    return () => socket.off("createCommentToClient");
  }, [socket, dispatch]);

  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("deleteCommentToClient", (newPost) => {
      dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
    });
    return () => socket.off("deleteCommentToClient");
  }, [socket, dispatch]);

  //!Follow
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("followToClient", (newUser) => {
      dispatch({ type: GLOBALTYPES.AUTH, payload: { ...auth, user: newUser } });
    });
    return () => socket.off("followToClient");
  }, [socket, dispatch, auth]);

  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("unFollowToClient", (newUser) => {
      dispatch({
        type: GLOBALTYPES.AUTH,
        payload: { ...auth, user: newUser },
      });
    });
    return () => socket.off("unFollowToClient");
  }, [socket, dispatch, auth]);

  //!Notifications
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("createNotifyToClient", (msg) => {
      dispatch({ type: NOTIFY_TYPES.CREATE_NOTIFY, payload: msg });

      if (notify.sound) {
        audioRef.current.play();
      }
      spawnNotification(
        msg.user.username + " " + msg.text,
        msg.user.avatar,
        msg.url,
        "CAMPUS CONNECT"
      );
    });
    return () => socket.off("createNotifyToClient");
  }, [socket, dispatch, notify.sound]);

  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("removeNotifyToClient", (msg) => {
      dispatch({ type: NOTIFY_TYPES.REMOVE_NOTIFY, payload: msg });
    });
    return () => socket.off("removeNotifyToClient");
  }, [socket, dispatch]);

  //!Messages
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on("addMessageToClient", (msg) => {
      dispatch({ type: MESSAGE_TYPES.ADD_MESSAGE, payload: msg });

    });
    return () => socket.off("addMessageToClient");
  }, [dispatch,socket]);

  // typing indicators
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on('typingToClient', ({ from }) => {
      dispatch({ type: MESSAGE_TYPES.TYPING_START, payload: from });
    });
    return () => socket.off('typingToClient');
  }, [socket, dispatch]);

  useEffect(() => {
    if (!socket || typeof socket.on !== 'function' || typeof socket.off !== 'function') return;
    socket.on('stopTypingToClient', ({ from }) => {
      dispatch({ type: MESSAGE_TYPES.TYPING_STOP, payload: from });
    });
    return () => socket.off('stopTypingToClient');
  }, [socket, dispatch]);

  return (
    <>
      <audio controls ref={audioRef} style={{ display: "none" }}>
        <source src={audioTone} type="audio/mp3" />
      </audio>
    </>
  );
};

export default SocketClient;
