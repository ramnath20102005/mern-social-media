import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../redux/actions/authAction';
import { useHistory } from 'react-router-dom';

const Forgot = () => {
    const [form, setForm] = useState({ identifier: '', newPassword: '' });
    const [showPass, setShowPass] = useState(false);
    const dispatch = useDispatch();
    const history = useHistory();

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = form.identifier.includes('@')
            ? { email: form.identifier, newPassword: form.newPassword }
            : { username: form.identifier, newPassword: form.newPassword };
        const res = await dispatch(forgotPassword(payload));
        if (res !== false) history.push('/');
    };

    return (
        <div className="modern-auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="brand-icon"><i className="fas fa-key" /></div>
                        <h1 className="brand-name">Reset Password</h1>
                        <p className="brand-tagline">Use email or username</p>
                    </div>
                    <form onSubmit={onSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label"><i className="fas fa-id-badge" /> Email or Username</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="you@example.com or username"
                                    value={form.identifier}
                                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><i className="fas fa-lock" /> New Password</label>
                            <div className="input-wrapper password-wrapper">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="modern-input"
                                    placeholder="Minimum 6 characters"
                                    value={form.newPassword}
                                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                                    <i className={showPass ? 'fas fa-eye-slash' : 'fas fa-eye'} />
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={!form.identifier || form.newPassword.length < 6}>
                            <span>Update Password</span>
                            <i className="fas fa-arrow-right" />
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

export default Forgot;
