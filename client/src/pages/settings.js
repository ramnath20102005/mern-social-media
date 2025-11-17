import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
    { id: 'general', label: t('settings.tabs.general'), icon: 'fas fa-cog' },
    { id: 'privacy', label: t('settings.tabs.privacy'), icon: 'fas fa-shield-alt' },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: 'fas fa-bell' },
    { id: 'account', label: t('settings.tabs.account'), icon: 'fas fa-user-cog' },
  ];

  // Load settings on component mount
  useEffect(() => {
    if (auth.token) {
      dispatch(getUserSettings(auth));
    }
  }, [dispatch, auth]);

  // Update local state when settings change
  useEffect(() => {
    if (settings.language) {
      i18n.changeLanguage(settings.language);
      document.documentElement.lang = settings.language;
    }
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
    // Update language globally
    if (field === 'language') {
      i18n.changeLanguage(value);
      document.documentElement.lang = value;
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
          <h1 className="settings-title">{t('settings.heading')}</h1>
          <p className="settings-subtitle">{t('settings.subheading')}</p>
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
                <h2 className="section-title">{t('settings.tabs.general')}</h2>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t('settings.general.theme')}</h3>
                    <p>{t('settings.general.chooseTheme')}</p>
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
                    <h3>{t('settings.general.language')}</h3>
                    <p>{t('settings.general.selectLanguage')}</p>
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
                    <h3>{t('settings.general.autoPlayVideos')}</h3>
                    <p>{t('settings.general.autoPlayVideosDesc')}</p>
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
                <h2 className="section-title">{t('settings.tabs.privacy')}</h2>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t('settings.privacy.profileVisibility')}</h3>
                    <p>{t('settings.privacy.whoCanSee')}</p>
                  </div>
                  <div className="setting-control">
                    <select
                      className="setting-select"
                      value={privacySettings.profileVisibility}
                      onChange={(e) => handlePrivacySettingsChange('profileVisibility', e.target.value)}
                    >
                      <option value="public">{t('settings.privacy.everyone')}</option>
                      <option value="friends">{t('settings.privacy.friends')}</option>
                      <option value="private">{t('settings.privacy.onlyMe')}</option>
                    </select>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t('settings.privacy.showOnlineStatus')}</h3>
                    <p>{t('settings.privacy.showOnlineStatusDesc')}</p>
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
                    <h3>{t('settings.privacy.download')}</h3>
                    <p>{t('settings.privacy.downloadDesc')}</p>
                  </div>
                  <div className="setting-control">
                    <button
                      className="setting-button secondary"
                      onClick={handleDownloadData}
                      disabled={alert.loading}
                    >
                      <i className="fas fa-download"></i>
                      {alert.loading ? 'Preparing...' : t('settings.privacy.downloadBtn')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="section-title">{t('settings.notifications.heading')}</h2>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t('settings.notifications.push')}</h3>
                    <p>{t('settings.notifications.pushDesc')}</p>
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
                    <h3>{t('settings.notifications.email')}</h3>
                    <p>{t('settings.notifications.emailDesc')}</p>
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
                    <h3>{t('settings.notifications.sound')}</h3>
                    <p>{t('settings.notifications.soundDesc')}</p>
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
                <h2 className="section-title">{t('settings.account.heading')}</h2>

                <form onSubmit={handlePasswordChange}>
                  <div className="setting-item">
                    <div className="setting-info">
                      <h3>{t('settings.account.changePassword')}</h3>
                      <p>{t('settings.account.changePasswordDesc')}</p>
                    </div>
                    <div className="setting-control">
                      <div className="password-form">
                        <input
                          type="password"
                          placeholder={t('settings.account.currentPassword')}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="setting-input"
                          required
                        />
                        <input
                          type="password"
                          placeholder={t('settings.account.newPassword')}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="setting-input"
                          required
                        />
                        <input
                          type="password"
                          placeholder={t('settings.account.confirmNewPassword')}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="setting-input"
                          required
                        />
                        <button type="submit" className="setting-button primary" disabled={alert.loading}>
                          <i className="fas fa-key"></i>
                          {alert.loading ? 'Changing...' : t('settings.account.changePasswordBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t('settings.account.twoFactor')}</h3>
                    <p>{t('settings.account.twoFactorDesc')}</p>
                  </div>
                  <div className="setting-control">
                    <button
                      className={`setting-button ${settings.twoFactorAuth ? 'danger' : 'secondary'}`}
                      onClick={handleToggle2FA}
                      disabled={alert.loading}
                    >
                      <i className="fas fa-shield-alt"></i>
                      {alert.loading ? 'Processing...' : (settings.twoFactorAuth ? t('settings.account.disable2FA') : t('settings.account.enable2FA'))}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDeleteAccount}>
                  <div className="setting-item danger">
                    <div className="setting-info">
                      <h3>{t('settings.account.deleteAccount')}</h3>
                      <p>{t('settings.account.deleteAccountDesc')}</p>
                    </div>
                    <div className="setting-control">
                      <div className="delete-form">
                        <input
                          type="password"
                          placeholder={t('settings.account.enterPassword')}
                          value={deleteData.password}
                          onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                          className="setting-input"
                          required
                        />
                        <input
                          type="text"
                          placeholder={t('settings.account.typeDELETE')}
                          value={deleteData.confirmDelete}
                          onChange={(e) => setDeleteData({ ...deleteData, confirmDelete: e.target.value })}
                          className="setting-input"
                          required
                        />
                        <button type="submit" className="setting-button danger" disabled={alert.loading}>
                          <i className="fas fa-trash"></i>
                          {alert.loading ? 'Deleting...' : t('settings.account.deleteBtn')}
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
