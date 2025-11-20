import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { adminLogin, login } from "../redux/actions/authAction";
import { useDispatch, useSelector } from "react-redux";

const Login = () => {
  const initialState = { identifier: "", password: "" };
  const [userData, setUserData] = useState(initialState);
  const { identifier, password } = userData;

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
    const payload = identifier.includes('@')
      ? { email: identifier, password }
      : { username: identifier, password };
    dispatch(login(payload));
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

            {/* Email or Username */}
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">
                <i className="fas fa-id-badge"></i>
                Email or Username
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="modern-input"
                  id="identifier"
                  placeholder="Enter email or username"
                  onChange={handleChangeInput}
                  value={identifier}
                  name="identifier"
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


            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={!identifier || !password}
            >
              <span>Sign In</span>
              <i className="fas fa-arrow-right"></i>
            </button>

            {/* Links */}
            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Create one now
                </Link>
              </p>
              <p>
                <Link to="/forgot" className="auth-link">Forgot your password?</Link>
              </p>
              <p>
                <Link to="/admin" className="auth-link"><strong>Admin Login</strong></Link>
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
