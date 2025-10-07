import { BrowserRouter as Router, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
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
import { getSuggestions } from "./redux/actions/suggestionsAction";
import { getNotifies } from "./redux/actions/notifyAction";

import { GLOBALTYPES } from "./redux/actions/globalTypes";
import SocketClient from "./SocketClient";
import './styles/modern-layout.css';

function App() {
  const { auth, status, modal, socket } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Clear any existing alerts before refresh token
    dispatch({ type: GLOBALTYPES.ALERT, payload: {} });
    
    // Delay refresh token to avoid showing errors on initial load
    setTimeout(() => {
      dispatch(refreshToken()).finally(() => {
        // Set initialization complete after refresh token attempt
        setTimeout(() => setIsInitializing(false), 200);
      });
    }, 100);
  }, [dispatch]);

  // Set initialization complete when auth state changes
  useEffect(() => {
    if (auth.token !== undefined) {
      setIsInitializing(false);
    }
  }, [auth.token]);

  // Create socket connection only when user is authenticated
  useEffect(() => {
    if (auth.token && auth.user && auth.user._id) {
      console.log('🔌 Creating socket connection for authenticated user:', auth.user.username);
      
      // Add a small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        const socket = io(process.env.NODE_ENV === 'production' 
          ? 'https://mysocial-lvsn.onrender.com' 
          : 'http://localhost:8080', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            forceNew: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 3,
            timeout: 10000,
            autoConnect: true
          });
        
        // Add connection event listeners for debugging
        socket.on('connect', () => {
          console.log('✅ Socket connected successfully');
        });
        
        socket.on('disconnect', (reason) => {
          console.log('❌ Socket disconnected:', reason);
        });
        
        socket.on('connect_error', (error) => {
          console.log('❌ Socket connection error:', error.message);
        });
        
        dispatch({type: GLOBALTYPES.SOCKET, payload: socket });
      }, 200);
      
      return () => {
        clearTimeout(timer);
        // Clear socket from Redux when auth changes
        dispatch({type: GLOBALTYPES.SOCKET, payload: null });
      };
    } else {
      // Clear socket when not authenticated
      dispatch({type: GLOBALTYPES.SOCKET, payload: null });
    }
  }, [auth.token, auth.user, dispatch]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket && typeof socket.disconnect === 'function') {
        console.log('🔌 App unmounting - cleaning up socket');
        socket.disconnect();
        if (typeof socket.close === 'function') {
          socket.close();
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (auth.token) {
      dispatch(getPosts(auth.token));
      dispatch(getSuggestions(auth.token));
      dispatch(getNotifies(auth.token));
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
  }, []);

  useEffect(() => {
    document.title = 'Mesme';
  }, []);

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div>Loading MESME...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Alert />
      <input type="checkbox" id="theme" />
      <div className={`App ${(status || modal) && 'mode'}`} id="style-2">
        <div className="main">
          {auth.token && <Header />}
          {status && <StatusModal />}
          {auth.token && <SocketClient />}
          <Route exact path="/" component={auth.token ? Home : Login} />
          <Route exact path="/register" component={Register} />

          <PrivateRouter exact path="/:page" component={PageRender} auth={auth.token} />
          <PrivateRouter exact path="/:page/:id" component={PageRender} auth={auth.token} />
        </div>
      </div>
    </Router>
  );
}

export default App;