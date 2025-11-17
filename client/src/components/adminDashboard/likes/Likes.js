import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getDataAPI } from '../../../utils/fetchData';

const Likes = () => {
    const { auth } = useSelector((state) => state);
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await getDataAPI('/admin/likes', auth.token);
                setLikes(res.data?.likes || []);
            } catch (err) {
                setError(err?.response?.data?.msg || 'Failed to load likes');
            } finally {
                setLoading(false);
            }
        };
        if (auth?.token) load();
    }, [auth?.token]);

    return (
        <div className="main_admin">
            <div className="main__container">
                <div className="main__title">
                    <div className="main__greeting">
                        <h1>Likes</h1>
                        <p>Which user liked which post (original posts only)</p>
                    </div>
                </div>

                {loading && <div className="card_admin" style={{ padding: 16 }}>Loading...</div>}
                {error && <div className="card_admin" style={{ padding: 16, color: 'var(--danger-500)' }}>{error}</div>}

                {!loading && !error && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div className="card_admin" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Total Likes</strong>
                            <span style={{ color: 'var(--primary-500)', fontWeight: 800 }}>{likes.length}</span>
                        </div>

                        {likes.map((item) => (
                            <div key={`${item.post?._id}-${item.user?._id}`} className="card_admin" style={{ padding: 16, display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12 }}>
                                <img src={item.user?.avatar} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                                <div style={{ display: 'grid', gap: 6 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{item.user?.username}</strong>
                                        <span style={{ color: 'var(--text-muted)' }}>liked</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>a post</span>
                                    </div>
                                    {item.post && (
                                        <div style={{ color: 'var(--text-tertiary)' }}>
                                            {item.post.content?.slice(0, 120) || '—'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                                    {item.post?._id && (
                                        <Link to={`/post/${item.post._id}`} className="btn-1" style={{ textAlign: 'center' }}>View Post</Link>
                                    )}
                                    {item.user?._id && (
                                        <Link to={`/profile/${item.user._id}`} className="btn-1" style={{ textAlign: 'center' }}>Profile</Link>
                                    )}
                                </div>
                            </div>
                        ))}

                        {likes.length === 0 && (
                            <div className="card_admin" style={{ padding: 16 }}>No likes data.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Likes;
