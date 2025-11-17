import React from "react";
import "../main/Main.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, blockUser, unblockUser, resetUserPassword, impersonateUser } from "../../../redux/actions/adminAction";

const UsersManagement = () => {
  const dispatch = useDispatch();
  const { auth, admin } = useSelector((state) => state);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (auth.token) dispatch(getUsers(auth.token));
  }, [dispatch, auth.token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admin.users;
    return admin.users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.fullname?.toLowerCase().includes(q)
    );
  }, [query, admin.users]);

  const onBlock = (id) => dispatch(blockUser({ userId: id, auth }));
  const onUnblock = (id) => dispatch(unblockUser({ userId: id, auth }));
  const onReset = async (id) => {
    const res = await dispatch(resetUserPassword({ userId: id, auth }));
    const temp = res?.data?.tempPassword;
    if (temp) alert(`Temporary password: ${temp}`);
  };

  return (
    <div className="main_admin">
      <div className="main__container">
        <div className="main__title">
          <div className="main__greeting">
            <h1>Users Management</h1>
            <p>Total: {admin.users.length}</p>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            className="modern-input"
            placeholder="Search users by name, username or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: 10 }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 8 }}>User</th>
                <th style={{ padding: 8 }}>Email</th>
                <th style={{ padding: 8 }}>Role</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.fullname}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>@{u.username}</div>
                    </div>
                  </td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>{u.role}</td>
                  <td style={{ padding: 8 }}>
                    {u.isBlocked ? <span style={{ color: '#c00' }}>Blocked</span> : <span style={{ color: '#0a0' }}>Active</span>}
                  </td>
                  <td style={{ padding: 8 }}>
                    {u.isBlocked ? (
                      <button className="btn btn-outline" onClick={() => onUnblock(u._id)}>Unblock</button>
                    ) : (
                      <button className="btn btn-outline" onClick={() => onBlock(u._id)}>Block</button>
                    )}
                    <button className="btn" style={{ marginLeft: 8 }} onClick={() => onReset(u._id)}>Reset Password</button>
                    <Link className="btn btn-outline" style={{ marginLeft: 8 }} to={`/profile/${u._id}`}>View Profile</Link>
                    <button className="btn" style={{ marginLeft: 8 }} onClick={() => dispatch(impersonateUser({ userId: u._id, auth }))}>Login As</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16 }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
