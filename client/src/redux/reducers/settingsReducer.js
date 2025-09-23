import { SETTINGS_TYPES } from '../actions/settingsAction';

const initialState = {
    theme: 'light',
    language: 'en',
    autoPlayVideos: true,
    profileVisibility: 'public',
    showOnlineStatus: true,
    pushNotifications: true,
    emailNotifications: false,
    soundEffects: true,
    twoFactorAuth: false
};

const settingsReducer = (state = initialState, action) => {
    switch (action.type) {
        case SETTINGS_TYPES.GET_SETTINGS:
            return {
                ...state,
                ...action.payload
            };
        case SETTINGS_TYPES.UPDATE_SETTINGS:
            return {
                ...state,
                theme: action.payload.theme || state.theme,
                language: action.payload.language || state.language,
                autoPlayVideos: action.payload.autoPlayVideos !== undefined ? action.payload.autoPlayVideos : state.autoPlayVideos,
                profileVisibility: action.payload.profileVisibility || state.profileVisibility,
                showOnlineStatus: action.payload.showOnlineStatus !== undefined ? action.payload.showOnlineStatus : state.showOnlineStatus,
                pushNotifications: action.payload.pushNotifications !== undefined ? action.payload.pushNotifications : state.pushNotifications,
                emailNotifications: action.payload.emailNotifications !== undefined ? action.payload.emailNotifications : state.emailNotifications,
                soundEffects: action.payload.soundEffects !== undefined ? action.payload.soundEffects : state.soundEffects,
                twoFactorAuth: action.payload.twoFactorAuth !== undefined ? action.payload.twoFactorAuth : state.twoFactorAuth
            };
        default:
            return state;
    }
};

export default settingsReducer;
