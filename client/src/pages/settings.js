import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GLOBALTYPES } from '../redux/actions/globalTypes';

const Settings = () => {
  const { auth, theme } = useSelector(state => state);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');

  const settingsTabs = [
    { id: 'general', label: 'General', icon: 'fas fa-cog' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-shield-alt' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'account', label: 'Account', icon: 'fas fa-user-cog' },
  ];

  const handleThemeToggle = () => {
    dispatch({ type: GLOBALTYPES.THEME, payload: !theme });
  };

  return (
    <div className="main-layout">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account preferences and privacy settings</p>
        </div>

        <div className="settings-content">
          {/* Settings Navigation */}
          <div className="settings-nav">
            {settingsTabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Panel */}
          <div className="settings-panel">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h2 className="section-title">General Settings</h2>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Theme</h3>
                    <p>Choose between light and dark mode</p>
                  </div>
                  <div className="setting-control">
                    <button 
                      className={`theme-toggle ${theme ? 'dark' : 'light'}`}
                      onClick={handleThemeToggle}
                    >
                      <div className="toggle-slider">
                        <i className={theme ? 'fas fa-moon' : 'fas fa-sun'}></i>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Language</h3>
                    <p>Select your preferred language</p>
                  </div>
                  <div className="setting-control">
                    <select className="setting-select">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Auto-play Videos</h3>
                    <p>Automatically play videos in your feed</p>
                  </div>
                  <div className="setting-control">
                    <label className="setting-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2 className="section-title">Privacy Settings</h2>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Profile Visibility</h3>
                    <p>Who can see your profile</p>
                  </div>
                  <div className="setting-control">
                    <select className="setting-select">
                      <option value="public">Everyone</option>
                      <option value="friends">Friends only</option>
                      <option value="private">Only me</option>
                    </select>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Show Online Status</h3>
                    <p>Let others see when you're online</p>
                  </div>
                  <div className="setting-control">
                    <label className="setting-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Data Download</h3>
                    <p>Download a copy of your data</p>
                  </div>
                  <div className="setting-control">
                    <button className="setting-button secondary">
                      <i className="fas fa-download"></i>
                      Download Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="section-title">Notification Settings</h2>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Push Notifications</h3>
                    <p>Receive notifications on your device</p>
                  </div>
                  <div className="setting-control">
                    <label className="setting-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Email Notifications</h3>
                    <p>Receive notifications via email</p>
                  </div>
                  <div className="setting-control">
                    <label className="setting-switch">
                      <input type="checkbox" />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Sound Effects</h3>
                    <p>Play sounds for notifications</p>
                  </div>
                  <div className="setting-control">
                    <label className="setting-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="settings-section">
                <h2 className="section-title">Account Settings</h2>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Change Password</h3>
                    <p>Update your account password</p>
                  </div>
                  <div className="setting-control">
                    <button className="setting-button primary">
                      <i className="fas fa-key"></i>
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security</p>
                  </div>
                  <div className="setting-control">
                    <button className="setting-button secondary">
                      <i className="fas fa-shield-alt"></i>
                      Enable 2FA
                    </button>
                  </div>
                </div>

                <div className="setting-item danger">
                  <div className="setting-info">
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and data</p>
                  </div>
                  <div className="setting-control">
                    <button className="setting-button danger">
                      <i className="fas fa-trash"></i>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
