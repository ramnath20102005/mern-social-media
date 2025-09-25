import React, { useEffect } from "react";
import UserCard from "../UserCard";
import FollowBtn from "../FollowBtn";
import { useDispatch, useSelector } from "react-redux";
import { getDataAPI } from "../../utils/fetchData";
import { PROFILE_TYPES } from "../../redux/actions/profileAction";

const Followers = ({ users, setShowFollowers }) => {
  const { auth, profile } = useSelector((state) => state);
  const dispatch = useDispatch();

  // Ensure we have full user objects for any follower IDs
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
    // If it's an ID string, try to find full user in store; fallback to minimal stub
    if (typeof u === "string") {
      return (
        profile.users.find((x) => String(x._id) === String(u)) ||
        { _id: u, username: `user_${String(u).slice(-4)}`, fullname: "", avatar: "/api/placeholder/48/48" }
      );
    }
    // If object but missing typical fields, enrich from store
    if (u && typeof u === "object" && !u.username) {
      return profile.users.find((x) => String(x._id) === String(u._id)) || u;
    }
    return u;
  });

  return (
    <div className="follow">
      <div className="follow_box">
        <h5 className="text-center follow_box-heading">Followers</h5>
        <hr />
        {normalizedUsers.map((user) => (
          <UserCard
            key={user._id}
            setShowFollowers={setShowFollowers}
            user={user}
          >
            {auth.user._id !== user._id && <FollowBtn user={user} />}
          </UserCard>
        ))}

        <div className="close" onClick={() => setShowFollowers(false)}>
          &times;
        </div>
      </div>
    </div>
  );
};

export default Followers;
