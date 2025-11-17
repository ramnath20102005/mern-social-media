import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAllPosts } from '../../../redux/actions/adminAction';
import '../main/Main.css';

const AllPosts = () => {
    const dispatch = useDispatch();
    const [expandedId, setExpandedId] = useState(null);
    const { auth, admin } = useSelector((state) => state);

    useEffect(() => {
        if (auth.token) dispatch(getAllPosts(auth.token));
    }, [dispatch, auth.token]);

    return (
        <div className="main_admin">
            <div className="main__container">
                <div className="main__title">
                    <div className="main__greeting">
                        <h1>All Posts</h1>
                        <p>Total: {admin.posts.length}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                    {admin.posts.map((p) => (
                        <div key={p._id} className="card_admin" style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12, padding: 16 }}>
                            <img src={p.user?.avatar} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                            <div style={{ display: 'grid', gap: 6, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>{p.user?.username}</strong>
                                    <span style={{ color: 'var(--text-muted)' }}>· {p.user?.email}</span>
                                    <span style={{ color: 'var(--text-tertiary)' }}>· {new Date(p.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={{ color: 'var(--text-primary)' }}>{p.content}</div>

                                {Array.isArray(p.images) && p.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                        {p.images.slice(0, 4).map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img.url}
                                                alt={`post-${idx}`}
                                                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}
                                            />
                                        ))}
                                        {p.images.length > 4 && (
                                            <div style={{ width: 72, height: 72, borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                +{p.images.length - 4}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 16, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    <span><i className="fa fa-thumbs-up" /> {p.likes?.length || 0}</span>
                                    <span><i className="fa fa-comments" /> {p.comments?.length || 0}</span>
                                </div>

                                {expandedId === p._id && (
                                    <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                                        {p.location && <div style={{ color: 'var(--text-muted)' }}><i className="fa fa-map-marker" /> {p.location}</div>}
                                        {p.tags && p.tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {p.tags.map((t, i) => (
                                                    <span key={i} style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', padding: '2px 8px', borderRadius: 999 }}>{typeof t === 'string' ? t : t?.name}</span>
                                                ))}
                                            </div>
                                        )}
                                        {Array.isArray(p.images) && p.images.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                                                {p.images.map((img, idx) => (
                                                    <img key={idx} src={img.url} alt={`post-full-${idx}`} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                                <Link to={`/post/${p._id}`} className="btn-1" style={{ textAlign: 'center' }}>View</Link>
                                <Link to={`/profile/${p.user?._id}`} className="btn-1" style={{ textAlign: 'center' }}>Profile</Link>
                            </div>
                        </div>
                    ))}
                    {admin.posts.length === 0 && <div className="card_admin" style={{ padding: 16 }}>No posts found.</div>}
                </div>
            </div>
        </div>
    );
};

export default AllPosts;
