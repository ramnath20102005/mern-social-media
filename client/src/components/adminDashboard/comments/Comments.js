import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCommentsDetail } from '../../../redux/actions/adminAction';
import '../main/Main.css';

const Comments = () => {
    const dispatch = useDispatch();
    const { auth, admin } = useSelector((state) => state);

    useEffect(() => {
        if (auth.token) dispatch(getCommentsDetail(auth.token));
    }, [dispatch, auth.token]);

    return (
        <div className="main_admin">
            <div className="main__container">
                <div className="main__title">
                    <div className="main__greeting">
                        <h1>Comments</h1>
                        <p>Recent comments with context</p>
                    </div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                    {admin.comments.map((c) => (
                        <div key={c._id} className="card_admin" style={{ padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <img src={c.user?.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 8 }} />
                                <div style={{ fontWeight: 600 }}>{c.user?.username} · {new Date(c.createdAt).toLocaleString()}</div>
                            </div>
                            <div style={{ marginTop: 6 }}>{c.content}</div>
                            {c.post && (
                                <div style={{ marginTop: 8, padding: 8, background: '#f7f7f7', borderRadius: 8 }}>
                                    <div style={{ fontSize: 12, color: '#666' }}>Post by {c.post.user?.username}</div>
                                    <div style={{ fontSize: 14 }}>{c.post.content}</div>
                                </div>
                            )}
                        </div>
                    ))}
                    {admin.comments.length === 0 && <div className="card_admin">No comments found.</div>}
                </div>
            </div>
        </div>
    );
};

export default Comments;
