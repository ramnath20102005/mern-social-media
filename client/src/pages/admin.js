import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin } from "../redux/actions/authAction";
import { useHistory } from "react-router-dom";

const Admin = () => {
    const initialState = { email: "", username: "", password: "" };
    const [form, setForm] = useState(initialState);
    const [showPass, setShowPass] = useState(false);
    const dispatch = useDispatch();
    const { auth } = useSelector((state) => state);
    const history = useHistory();

    useEffect(() => {
        if (auth.token && auth.user?.role === 'admin') history.push('/adminDashboard');
    }, [auth, history]);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const onSubmit = (e) => {
        e.preventDefault();
        const payload = { password: form.password };
        if (form.email) payload.email = form.email; else payload.username = form.username;
        dispatch(adminLogin(payload));
    };

    return (
        <div className="modern-auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="brand-icon"><i className="fas fa-shield-alt"></i></div>
                        <h1 className="brand-name">Admin Sign In</h1>
                        <p className="brand-tagline">Restricted access</p>
                    </div>
                    <form onSubmit={onSubmit} className="auth-form">
                        <h2 className="auth-title">Admin Login</h2>
                        <p className="auth-subtitle">Sign in with email or username</p>

                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-id-card" /> Email or Username
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="you@example.com or username"
                                    name={form.email ? 'email' : 'username'}
                                    value={form.email || form.username}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v.includes('@')) setForm({ ...form, email: v, username: '' });
                                        else setForm({ ...form, username: v, email: '' });
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-lock" /> Password
                            </label>
                            <div className="input-wrapper password-wrapper">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="modern-input"
                                    placeholder="Enter your password"
                                    name="password"
                                    value={form.password}
                                    onChange={onChange}
                                    required
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                                    <i className={showPass ? 'fas fa-eye-slash' : 'fas fa-eye'} />
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={!form.password || (!form.email && !form.username)}>
                            <span>Sign In</span>
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </form>
                </div>
                <div className="auth-bg-elements">
                    <div className="bg-circle bg-circle-1"></div>
                    <div className="bg-circle bg-circle-2"></div>
                    <div className="bg-circle bg-circle-3"></div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
