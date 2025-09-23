import { GLOBALTYPES } from './globalTypes';
import { getDataAPI, patchDataAPI, deleteDataAPI } from '../../utils/fetchData';

export const SETTINGS_TYPES = {
    GET_SETTINGS: 'GET_SETTINGS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS'
};

// Get user settings
export const getUserSettings = (auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await getDataAPI('settings', auth.token);
        
        dispatch({
            type: SETTINGS_TYPES.GET_SETTINGS,
            payload: res.data.settings
        });
        
        dispatch({ type: GLOBALTYPES.ALERT, payload: {} });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Update general settings
export const updateGeneralSettings = (settingsData, auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await patchDataAPI('settings/general', settingsData, auth.token);
        
        dispatch({
            type: SETTINGS_TYPES.UPDATE_SETTINGS,
            payload: res.data.user
        });
        
        // Update auth user data with new settings
        dispatch({
            type: GLOBALTYPES.AUTH,
            payload: {
                ...auth,
                user: res.data.user
            }
        });
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Update privacy settings
export const updatePrivacySettings = (settingsData, auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await patchDataAPI('settings/privacy', settingsData, auth.token);
        
        dispatch({
            type: SETTINGS_TYPES.UPDATE_SETTINGS,
            payload: res.data.user
        });
        
        dispatch({
            type: GLOBALTYPES.AUTH,
            payload: {
                ...auth,
                user: res.data.user
            }
        });
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Update notification settings
export const updateNotificationSettings = (settingsData, auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await patchDataAPI('settings/notifications', settingsData, auth.token);
        
        dispatch({
            type: SETTINGS_TYPES.UPDATE_SETTINGS,
            payload: res.data.user
        });
        
        dispatch({
            type: GLOBALTYPES.AUTH,
            payload: {
                ...auth,
                user: res.data.user
            }
        });
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Change password
export const changePassword = (passwordData, auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await patchDataAPI('settings/password', passwordData, auth.token);
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Toggle two-factor authentication
export const toggleTwoFactorAuth = (enable, auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await patchDataAPI('settings/2fa', { enable }, auth.token);
        
        dispatch({
            type: SETTINGS_TYPES.UPDATE_SETTINGS,
            payload: res.data.user
        });
        
        dispatch({
            type: GLOBALTYPES.AUTH,
            payload: {
                ...auth,
                user: res.data.user
            }
        });
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Download user data
export const downloadUserData = (auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await getDataAPI('settings/download', auth.token);
        
        // Create and download file
        const dataStr = JSON.stringify(res.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${auth.user.username}_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};

// Delete account
export const deleteAccount = (deleteData, auth) => async (dispatch) => {
    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } });
        
        const res = await deleteDataAPI('settings/account', deleteData, auth.token);
        
        // Logout user after account deletion
        localStorage.removeItem('firstLogin');
        dispatch({
            type: GLOBALTYPES.AUTH,
            payload: {}
        });
        
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { success: res.data.msg }
        });
    } catch (err) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: err.response.data.msg }
        });
    }
};
