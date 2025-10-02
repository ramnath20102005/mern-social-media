import React, { useState, useEffect} from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useHistory, Link } from "react-router-dom";
import { register } from '../redux/actions/authAction';

const Register = () => {
    const {auth, alert} = useSelector(state => state);
    const dispatch = useDispatch();
    const history = useHistory();

     const initialState = { fullname: "", username: "", email: "", password: "", cf_password: "", gender: "male" };
     const [userData, setUserData] = useState(initialState);
     const { fullname, username, email, password, cf_password } = userData;

     const [typePass, setTypePass] = useState(false);
     const [typeCfPass, setTypeCfPass] = useState(false);

    useEffect(() => {
      if (auth.token) history.push("/");
    }, [auth.token, history]);

   

    

    const handleChangeInput = (e) => {
      const { name, value } = e.target;
      setUserData({ ...userData, [name]: value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      dispatch(register(userData));
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

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <h2 className="auth-title">Join MESME</h2>
              <p className="auth-subtitle">Create your account to get started</p>

              {/* Full Name Input */}
              <div className="form-group">
                <label htmlFor="fullname" className="form-label">
                  <i className="fas fa-user"></i>
                  Full Name
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="modern-input"
                    id="fullname"
                    placeholder="Enter your full name"
                    onChange={handleChangeInput}
                    value={fullname}
                    name="fullname"
                    required
                  />
                </div>
                {alert.fullname && (
                  <small className="error-text">{alert.fullname}</small>
                )}
              </div>

              {/* Username Input */}
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  <i className="fas fa-at"></i>
                  Username
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="modern-input"
                    id="username"
                    placeholder="Choose a username"
                    onChange={handleChangeInput}
                    value={username.toLowerCase().replace(/ /g, "")}
                    name="username"
                    required
                  />
                </div>
                {alert.username && (
                  <small className="error-text">{alert.username}</small>
                )}
              </div>

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
                {alert.email && (
                  <small className="error-text">{alert.email}</small>
                )}
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
                    placeholder="Create a password"
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
                {alert.password && (
                  <small className="error-text">{alert.password}</small>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="form-group">
                <label htmlFor="cf_password" className="form-label">
                  <i className="fas fa-lock"></i>
                  Confirm Password
                </label>
                <div className="input-wrapper password-wrapper">
                  <input
                    type={typeCfPass ? "text" : "password"}
                    className="modern-input"
                    id="cf_password"
                    placeholder="Confirm your password"
                    onChange={handleChangeInput}
                    value={cf_password}
                    name="cf_password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setTypeCfPass(!typeCfPass)}
                  >
                    <i className={typeCfPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                {alert.cf_password && (
                  <small className="error-text">{alert.cf_password}</small>
                )}
              </div>

              {/* Gender Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-venus-mars"></i>
                  Gender
                </label>
                <div className="radio-group">
                  <label className={`radio-option ${userData.gender === 'male' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={userData.gender === 'male'}
                      onChange={handleChangeInput}
                    />
                    <span className="radio-custom"></span>
                    <div className="radio-content">
                      <i className="fas fa-mars"></i>
                      <span>Male</span>
                    </div>
                  </label>

                  <label className={`radio-option ${userData.gender === 'female' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={userData.gender === 'female'}
                      onChange={handleChangeInput}
                    />
                    <span className="radio-custom"></span>
                    <div className="radio-content">
                      <i className="fas fa-venus"></i>
                      <span>Female</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={!fullname || !username || !email || !password || !cf_password}
              >
                <span>Create Account</span>
                <i className="fas fa-arrow-right"></i>
              </button>

              {/* Login Link */}
              <div className="auth-footer">
                <p>
                  Already have an account?{" "}
                  <Link to="/" className="auth-link">
                    Sign in here
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
}

export default Register;
