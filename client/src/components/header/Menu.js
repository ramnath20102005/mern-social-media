import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/actions/authAction";
import { GLOBALTYPES } from "../../redux/actions/globalTypes";
import Avatar from "../Avatar";
import NotifyModal from "../NotifyModal";

const Menu = () => {
  const navLinks = [
    { label: "Home", icon: "fas fa-home", path: "/" },
    { label: "Explore", icon: "fas fa-compass", path: "/discover" },
    { label: "Messages", icon: "fas fa-envelope", path: "/message" },
  ];

  const { auth, theme, notify } = useSelector((state) => state);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  const isActive = (pn) => {
    if (pn === pathname) return "active";
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsNotificationDropdownOpen(false); // Close notification dropdown
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsProfileDropdownOpen(false); // Close profile dropdown
  };

  return (
    <div className="modern-nav-menu">
      {navLinks.map((link, index) => (
        <Link
          key={index}
          to={link.path}
          className={`nav-item ${isActive(link.path) ? 'active' : ''}`}
          title={link.label}
        >
          <i className={link.icon}></i>
          <span className="nav-label">{link.label}</span>
        </Link>
      ))}

      <div className="nav-item notification-item" ref={notificationDropdownRef}>
        <button
          className="nav-trigger"
          onClick={toggleNotificationDropdown}
          aria-expanded={isNotificationDropdownOpen}
          title="Notifications"
        >
          <i className="fas fa-bell"></i>
          {notify.data.filter(item => !item.isRead).length > 0 && (
            <span className="nav-badge">
              {notify.data.filter(item => !item.isRead).length > 99 ? '99+' : notify.data.filter(item => !item.isRead).length}
            </span>
          )}
        </button>

        <div className={`dropdown-menu modern-dropdown-menu ${isNotificationDropdownOpen ? 'show' : ''}`}>
          <NotifyModal />
        </div>
      </div>

      <div className="nav-item profile-item" ref={profileDropdownRef}>
        <button
          className="profile-trigger"
          onClick={toggleProfileDropdown}
          aria-expanded={isProfileDropdownOpen}
          title="Profile Menu"
        >
          <div className="profile-avatar-wrapper">
            <Avatar src={auth.user.avatar} size="medium-avatar" />
            <div className="profile-status-indicator"></div>
          </div>
        </button>
          <div className={`dropdown-menu modern-profile-menu ${isProfileDropdownOpen ? 'show' : ''}`}>
            {/* User Info Header */}
            <div className="profile-menu-header">
              <div className="profile-info">
                <Avatar src={auth.user.avatar} size="big-avatar" />
                <div className="profile-details">
                  <h4 className="profile-name">{auth.user.fullname || auth.user.username}</h4>
                  <p className="profile-username">@{auth.user.username}</p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="profile-menu-items">
              <Link
                className="modern-dropdown-item"
                to={`/profile/${auth.user._id}`}
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <div className="menu-item-icon">
                  <i className="fas fa-user"></i>
                </div>
                <div className="menu-item-content">
                  <span className="menu-item-title">My Profile</span>
                  <span className="menu-item-subtitle">View and edit profile</span>
                </div>
              </Link>
              
              <div
                className="modern-dropdown-item"
                onClick={() => {
                  dispatch({ type: GLOBALTYPES.THEME, payload: !theme });
                }}
              >
                <div className="menu-item-icon">
                  <i className={theme ? "fas fa-sun" : "fas fa-moon"}></i>
                </div>
                <div className="menu-item-content">
                  <span className="menu-item-title">{theme ? "Light Mode" : "Dark Mode"}</span>
                  <span className="menu-item-subtitle">Switch appearance</span>
                </div>
                <div className="menu-item-toggle">
                  <div className={`toggle-switch ${theme ? 'active' : ''}`}>
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
              
              <Link
                className="modern-dropdown-item"
                to="/settings"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <div className="menu-item-icon">
                  <i className="fas fa-cog"></i>
                </div>
                <div className="menu-item-content">
                  <span className="menu-item-title">Settings</span>
                  <span className="menu-item-subtitle">Privacy and preferences</span>
                </div>
              </Link>
            </div>
            
            <div className="profile-menu-divider"></div>
            
            {/* Logout */}
            <div className="profile-menu-footer">
              <Link
                className="modern-dropdown-item logout-item"
                to="/"
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  dispatch(logout());
                }}
              >
                <div className="menu-item-icon">
                  <i className="fas fa-sign-out-alt"></i>
                </div>
                <div className="menu-item-content">
                  <span className="menu-item-title">Sign Out</span>
                  <span className="menu-item-subtitle">See you later!</span>
                </div>
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Menu;
