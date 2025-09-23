import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GLOBALTYPES } from '../redux/actions/globalTypes';
import {
  getUserSettings,
  updateGeneralSettings,
  updatePrivacySettings,
  updateNotificationSettings,
  changePassword,
  toggleTwoFactorAuth,
  downloadUserData,
  deleteAccount
} from '../redux/actions/settingsAction';

const Settings = () => {
  const { auth, theme, settings, alert } = useSelector(state => state);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    theme: settings.theme || 'light',
    language: settings.language || 'en',
    autoPlayVideos: settings.autoPlayVideos !== undefined ? settings.autoPlayVideos : true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: settings.profileVisibility || 'public',
    showOnlineStatus: settings.showOnlineStatus !== undefined ? settings.showOnlineStatus : true
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: settings.pushNotifications !== undefined ? settings.pushNotifications : true,
    emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : false,
    soundEffects: settings.soundEffects !== undefined ? settings.soundEffects : true
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmDelete: ''
  });

  const settingsTabs = [
    { id: 'general', label: 'General', icon: 'fas fa-cog' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-shield-alt' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'account', label: 'Account', icon: 'fas fa-user-cog' },
  ];

  // Load settings on component mount
  useEffect(() => {
    if (auth.token) {
      dispatch(getUserSettings(auth));
    }
  }, [dispatch, auth]);
  
  // Update local state when settings change
  useEffect(() => {
    setGeneralSettings({
      theme: settings.theme || auth.user?.theme || 'light',
      language: settings.language || 'en',
      autoPlayVideos: settings.autoPlayVideos !== undefined ? settings.autoPlayVideos : true
    });
    
    setPrivacySettings({
      profileVisibility: settings.profileVisibility || 'public',
      showOnlineStatus: settings.showOnlineStatus !== undefined ? settings.showOnlineStatus : true
    });
    
    setNotificationSettings({
      pushNotifications: settings.pushNotifications !== undefined ? settings.pushNotifications : true,
      emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : false,
      soundEffects: settings.soundEffects !== undefined ? settings.soundEffects : true
    });
  }, [settings, auth.user]);

  const handleGeneralSettingsChange = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
    
    // Auto-save general settings
    const updatedSettings = { ...generalSettings, [field]: value };
    dispatch(updateGeneralSettings(updatedSettings, auth));
    
    // Update theme globally if theme changed
    if (field === 'theme') {
      dispatch({ type: GLOBALTYPES.THEME, payload: value === 'dark' });
    }
  };
  
  const handlePrivacySettingsChange = (field, value) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
    
    // Auto-save privacy settings
    const updatedSettings = { ...privacySettings, [field]: value };
    dispatch(updatePrivacySettings(updatedSettings, auth));
  };
  
  const handleNotificationSettingsChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    
    // Auto-save notification settings
    const updatedSettings = { ...notificationSettings, [field]: value };
    dispatch(updateNotificationSettings(updatedSettings, auth));
  };
  
  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: 'New passwords do not match.' }
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: 'Password must be at least 6 characters long.' }
      });
      return;
    }
    
    dispatch(changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }, auth));
    
    // Clear form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };
  
  const handleToggle2FA = () => {
    dispatch(toggleTwoFactorAuth(!settings.twoFactorAuth, auth));
  };
  
  const handleDownloadData = () => {
    dispatch(downloadUserData(auth));
  };
  
  const handleDeleteAccount = (e) => {
    e.preventDefault();
    
    if (deleteData.confirmDelete !== 'DELETE') {
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: 'Please type DELETE to confirm account deletion.' }
      });
      return;
    }
    
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      dispatch(deleteAccount(deleteData, auth));
    }
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
                      className={`theme-toggle ${generalSettings.theme === 'dark' ? 'dark' : 'light'}`}
                      onClick={() => handleGeneralSettingsChange('theme', generalSettings.theme === 'light' ? 'dark' : 'light')}
                    >
                      <div className="toggle-slider">
                        <i className={generalSettings.theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
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
                    <select 
                      className="setting-select"
                      value={generalSettings.language}
                      onChange={(e) => handleGeneralSettingsChange('language', e.target.value)}
                    >
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
                      <input 
                        type="checkbox" 
                        checked={generalSettings.autoPlayVideos}
                        onChange={(e) => handleGeneralSettingsChange('autoPlayVideos', e.target.checked)}
                      />
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
                    <select 
                      className="setting-select"
                      value={privacySettings.profileVisibility}
                      onChange={(e) => handlePrivacySettingsChange('profileVisibility', e.target.value)}
                    >
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
                      <input 
                        type="checkbox" 
                        checked={privacySettings.showOnlineStatus}
                        onChange={(e) => handlePrivacySettingsChange('showOnlineStatus', e.target.checked)}
                      />
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
                    <button 
                      className="setting-button secondary"
                      onClick={handleDownloadData}
                      disabled={alert.loading}
                    >
                      <i className="fas fa-download"></i>
                      {alert.loading ? 'Preparing...' : 'Download Data'}
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
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleNotificationSettingsChange('pushNotifications', e.target.checked)}
                      />
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
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleNotificationSettingsChange('emailNotifications', e.target.checked)}
                      />
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
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.soundEffects}
                        onChange={(e) => handleNotificationSettingsChange('soundEffects', e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="settings-section">
                <h2 className="section-title">Account Settings</h2>
                
                <form onSubmit={handlePasswordChange}>
                  <div className="setting-item">
                    <div className="setting-info">
                      <h3>Change Password</h3>
                      <p>Update your account password</p>
                    </div>
                    <div className="setting-control">
                      <div className="password-form">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="setting-input"
                          required
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="setting-input"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="setting-input"
                          required
                        />
                        <button type="submit" className="setting-button primary" disabled={alert.loading}>
                          <i className="fas fa-key"></i>
                          {alert.loading ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security</p>
                  </div>
                  <div className="setting-control">
                    <button 
                      className={`setting-button ${settings.twoFactorAuth ? 'danger' : 'secondary'}`}
                      onClick={handleToggle2FA}
                      disabled={alert.loading}
                    >
                      <i className="fas fa-shield-alt"></i>
                      {alert.loading ? 'Processing...' : (settings.twoFactorAuth ? 'Disable 2FA' : 'Enable 2FA')}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDeleteAccount}>
                  <div className="setting-item danger">
                    <div className="setting-info">
                      <h3>Delete Account</h3>
                      <p>Permanently delete your account and data</p>
                    </div>
                    <div className="setting-control">
                      <div className="delete-form">
                        <input
                          type="password"
                          placeholder="Enter your password"
                          value={deleteData.password}
                          onChange={(e) => setDeleteData({...deleteData, password: e.target.value})}
                          className="setting-input"
                          required
                        />
                        <input
                          type="text"
                          placeholder='Type "DELETE" to confirm'
                          value={deleteData.confirmDelete}
                          onChange={(e) => setDeleteData({...deleteData, confirmDelete: e.target.value})}
                          className="setting-input"
                          required
                        />
                        <button type="submit" className="setting-button danger" disabled={alert.loading}>
                          <i className="fas fa-trash"></i>
                          {alert.loading ? 'Deleting...' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
