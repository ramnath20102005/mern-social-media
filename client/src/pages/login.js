import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { adminLogin, login } from "../redux/actions/authAction";
import { useDispatch, useSelector } from "react-redux";

const Login = () => {
  const initialState = { email: "", password: "" };
  const [userData, setUserData] = useState(initialState);
  const [userType, setUserType] = useState(false);
  const { email, password } = userData;

  const [typePass, setTypePass] = useState(false);

  const { auth } = useSelector((state) => state);

  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    if (auth.token) history.push("/");
  }, [auth.token, history]);

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userType) {
      dispatch(login(userData));
    } else {
      dispatch(adminLogin(userData));
    }
  };

  return (
    <div className="modern-auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Brand Header */}
          <div className="auth-brand">
            <div className="brand-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h1 className="brand-name">MESME</h1>
            <p className="brand-tagline">Connect, Share, Engage</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account</p>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="modern-input"
                  id="email"
                  placeholder="Enter your email"
                  onChange={handleChangeInput}
                  value={email}
                  name="email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={typePass ? "text" : "password"}
                  className="modern-input"
                  id="password"
                  placeholder="Enter your password"
                  onChange={handleChangeInput}
                  value={password}
                  name="password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setTypePass(!typePass)}
                >
                  <i className={typePass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>

            {/* User Type Selection */}
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-user-tag"></i>
                Account Type
              </label>
              <div className="radio-group">
                <label className={`radio-option ${!userType ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    checked={!userType}
                    onChange={() => setUserType(false)}
                  />
                  <span className="radio-custom"></span>
                  <div className="radio-content">
                    <i className="fas fa-user"></i>
                    <span>User</span>
                  </div>
                </label>

                <label className={`radio-option ${userType ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    checked={userType}
                    onChange={() => setUserType(true)}
                  />
                  <span className="radio-custom"></span>
                  <div className="radio-content">
                    <i className="fas fa-user-shield"></i>
                    <span>Admin</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={!email || !password}
            >
              <span>Sign In</span>
              <i className="fas fa-arrow-right"></i>
            </button>

            {/* Register Link */}
            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Create one now
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Background Elements */}
        <div className="auth-bg-elements">
          <div className="bg-circle bg-circle-1"></div>
          <div className="bg-circle bg-circle-2"></div>
          <div className="bg-circle bg-circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
