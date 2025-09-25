import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { follow, unfollow } from "../redux/actions/profileAction";

const FollowBtn = ({user}) => {
    const [ followed, setFollowed ] = useState(false);

    const { auth, profile, socket } = useSelector(state => state);
    const dispatch = useDispatch();

    const [load, setLoad] = useState(false);

    useEffect(() => {
      const isFollowing = (auth.user?.following || []).some((item) => {
        const id = item && typeof item === 'object' ? item._id : item;
        return String(id) === String(user._id);
      });
      setFollowed(isFollowing);
      return () => setFollowed(false);
    }, [auth.user.following, user._id]);

    const handleFollow = async () => {
        if (load) return;
        setFollowed(true);
        setLoad(true);
        try {
          await dispatch(follow({ users: profile.users, user, auth, socket }));
        } finally {
          setLoad(false);
        }
    };

    const handleUnFollow = async () => {
      if (load) return;
      setFollowed(false);
      setLoad(true);
      try {
        await dispatch(unfollow({ users: profile.users, user, auth, socket }));
      } finally {
        setLoad(false);
      }
    };


    return (
      <>
        {followed ? (
          <button className="btn-1 follow-button hover-in-shadow outer-shadow" onClick={handleUnFollow} disabled={load} aria-busy={load}>
            Unfollow
          </button>
        ) : (
          <button className="btn-1 follow-button hover-in-shadow outer-shadow" onClick={handleFollow} disabled={load} aria-busy={load}>
            Follow
          </button>
        )}
      </>
    );
}

export default FollowBtn
