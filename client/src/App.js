import { BrowserRouter as Router, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";

import io from 'socket.io-client'

import PageRender from "./customRouter/PageRender";
import PrivateRouter from "./customRouter/PrivateRouter";
import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/home";
import Alert from "./components/alert/Alert";
import Header from "./components/header/Header";
import StatusModal from "./components/StatusModal";
import { refreshToken } from "./redux/actions/authAction";
import { getPosts } from "./redux/actions/postAction";
import { getProfileUsers } from "./redux/actions/profileAction";
import { getSuggestions } from "./redux/actions/suggestionsAction";
import { getNotifies } from "./redux/actions/notifyAction";

import { GLOBALTYPES } from "./redux/actions/globalTypes";
import SocketClient from "./SocketClient";
import './styles/modern-layout.css';

function App() {
  const { auth, status, modal } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [bootstrapped, setBootstrapped] = useState(() => {
    // If we have persisted auth, we can render immediately while refreshToken runs
    try { return !!localStorage.getItem('auth_state'); } catch { return false; }
  });

  useEffect(() => {
    (async () => {
      try {
        await dispatch(refreshToken());
      } finally {
        setBootstrapped(true);
      }
    })();

    const socket = io(process.env.NODE_ENV === 'production' 
      ? 'https://mysocial-lvsn.onrender.com' 
      : 'http://localhost:8080', {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });
    dispatch({type: GLOBALTYPES.SOCKET, payload: socket })
    return () => socket.close()
  }, [dispatch]);

  useEffect(() => {
    if (auth.token) {
      dispatch(getPosts(auth.token));
      dispatch(getSuggestions(auth.token));
      dispatch(getNotifies(auth.token));
      // Ensure own profile data & posts are loaded so counts render after refresh
      if (auth.user?._id) {
        dispatch(getProfileUsers({ id: auth.user._id, auth }));
      }
    }
  }, [dispatch, auth.token]);

  useEffect(() => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {

    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
        }
      });
    }
  }, [])

  useEffect(() => {
    document.title = 'Mesme';
  }, []);

  return (
    <Router>
      <Alert />
      <input type="checkbox" id="theme" />
      <div className={`app-container ${(status || modal) && "mode"}`} data-theme={auth.user?.theme || 'light'}>
        {!bootstrapped ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="loading-spinner" />
          </div>
        ) : (
        <>
          {auth.token && <Header />}
          {status && <StatusModal />}
          {auth.token && <SocketClient />}
          
          <Route
            exact
            path="/"
            component={auth.token ? Home : Login}
          />
          
          <Route exact path="/register" component={Register} />
          <div className="wrap_page">
            <PrivateRouter exact path="/:page" component={PageRender} />
            <PrivateRouter exact path="/:page/:id" component={PageRender} />
          </div>
        </>
        )}
      </div>
    </Router>
  );
}

export default App;