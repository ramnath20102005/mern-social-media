import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { follow, unfollow } from "../redux/actions/profileAction";

const FollowBtn = ({user}) => {
    const [ followed, setFollowed ] = useState(false);

    const { auth, profile, socket } = useSelector(state => state);
    const dispatch = useDispatch();

    const [load, setLoad] = useState(false);

    useEffect(() => {
      // Check if user._id is in the following array (array of ObjectIds)
      if (auth.user.following.includes(user._id)) {
        setFollowed(true);
      } else {
        setFollowed(false);
      }
    }, [auth.user.following, user._id]);

    const handleFollow = async () => {
        if(load) return;

        setFollowed(true);
        setLoad(true);
        await dispatch(follow({ users: profile.users, user, auth, socket }));
        setLoad(false);
    };

    const handleUnFollow = async () => {
      if (load) return;

      setFollowed(false);
      setLoad(true);
      await dispatch(unfollow({ users: profile.users, user, auth, socket }));
      setLoad(false);
    };


    return (
      <>
        {followed ? (
          <button 
            className="modern-follow-btn following-btn" 
            onClick={handleUnFollow}
            disabled={load}
          >
            {load ? (
              <div className="btn-loading">
                <div className="loading-spinner-btn"></div>
              </div>
            ) : (
              <>
                <i className="fas fa-user-check"></i>
                <span className="btn-text">Following</span>
                <span className="btn-hover-text">Unfollow</span>
              </>
            )}
          </button>
        ) : (
          <button 
            className="modern-follow-btn follow-btn" 
            onClick={handleFollow}
            disabled={load}
          >
            {load ? (
              <div className="btn-loading">
                <div className="loading-spinner-btn"></div>
              </div>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                <span className="btn-text">Follow</span>
              </>
            )}
          </button>
        )}
      </>
    );
}

export default FollowBtn
