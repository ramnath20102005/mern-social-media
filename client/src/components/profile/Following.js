import React, { useEffect } from "react";
import UserCard from "../UserCard";
import FollowBtn from "../FollowBtn";
import { useDispatch, useSelector } from "react-redux";
import { getDataAPI } from "../../utils/fetchData";
import { PROFILE_TYPES } from "../../redux/actions/profileAction";

const Following = ({ users, setShowFollowing }) => {
  const { auth, profile } = useSelector((state) => state);
  const dispatch = useDispatch();

  // On mount, fetch any missing user objects by ID so we can render a full list
  useEffect(() => {
    const ids = (users || [])
      .filter((u) => typeof u === "string")
      .filter((id) => !profile.users.some((x) => String(x._id) === String(id)));

    if (ids.length === 0) return;

    (async () => {
      for (const id of ids) {
        try {
          const res = await getDataAPI(`/user/${id}`, auth.token);
          if (res?.data?.user) {
            dispatch({ type: PROFILE_TYPES.GET_USER, payload: res.data });
          }
        } catch (_) {}
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token, users, profile.users.length]);

  const normalizedUsers = (users || []).map((u) => {
    // If it's an ID string, try to find the full user in the profile store
    if (typeof u === 'string') {
      return (
        profile.users.find((x) => String(x._id) === String(u)) ||
        { _id: u, username: `user_${String(u).slice(-4)}`, fullname: '', avatar: '/api/placeholder/48/48' }
      );
    }
    // If it lacks typical user fields, enrich from store when possible
    if (u && typeof u === 'object' && !u.username) {
      return profile.users.find((x) => String(x._id) === String(u._id)) || u;
    }
    return u;
  });
  return (
    <div className="follow">
      <div className="follow_box">
        <h5 className="text-center follow_box-heading">Following</h5>
        <hr />
        {normalizedUsers.map((user) => (
          <UserCard
            key={user._id}
            setShowFollowing={setShowFollowing}
            user={user}
          >
            {auth.user._id !== user._id && <FollowBtn user={user} />}
          </UserCard>
        ))}

        <div className="close" onClick={() => setShowFollowing(false)}>
          &times;
        </div>
      </div>
    </div>
  );
};

export default Following;
