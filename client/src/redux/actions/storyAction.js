import { GLOBALTYPES } from './globalTypes';
import { postDataAPI, getDataAPI, patchDataAPI, deleteDataAPI } from '../../utils/fetchData';

export const STORY_TYPES = {
  LOADING_STORY: 'LOADING_STORY',
  GET_STORIES_FEED: 'GET_STORIES_FEED',
  CREATE_STORY: 'CREATE_STORY',
  VIEW_STORY: 'VIEW_STORY',
  REPLY_STORY: 'REPLY_STORY',
  DELETE_STORY: 'DELETE_STORY',
  GET_USER_STORIES: 'GET_USER_STORIES',
  UPDATE_STORY_ANALYTICS: 'UPDATE_STORY_ANALYTICS'
};

// Get stories feed for home page
export const getStoriesFeed = (token) => async (dispatch) => {
  try {
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: true });

    const res = await getDataAPI('stories/feed', token);
    
    dispatch({
      type: STORY_TYPES.GET_STORIES_FEED,
      payload: res.data.stories
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to load stories' }
    });
  } finally {
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: false });
  }
};

// Create a new story
export const createStory = (storyData, token) => async (dispatch) => {
  try {
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: true });

    // In a real app, you would upload media to cloud storage first
    // For now, we'll simulate the upload
    const uploadedMedia = await uploadMedia(storyData.media);
    
    const finalStoryData = {
      ...storyData,
      media: uploadedMedia
    };

    const res = await postDataAPI('stories/create', finalStoryData, token);
    
    dispatch({
      type: STORY_TYPES.CREATE_STORY,
      payload: res.data.story
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: 'Story created successfully!' }
    });

    // Refresh stories feed
    dispatch(getStoriesFeed(token));

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to create story' }
    });
  } finally {
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: false });
  }
};

// Get specific user's stories
export const getUserStories = (userId, token) => async (dispatch) => {
  try {
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: true });

    const res = await getDataAPI(`stories/user/${userId}`, token);
    
    dispatch({
      type: STORY_TYPES.GET_USER_STORIES,
      payload: {
        userId,
        data: res.data
      }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to load user stories' }
    });
  } finally {
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: false });
  }
};

// View a story
export const viewStory = (storyId, token) => async (dispatch) => {
  try {
    const res = await postDataAPI(`stories/${storyId}/view`, {}, token);
    
    dispatch({
      type: STORY_TYPES.VIEW_STORY,
      payload: {
        storyId,
        viewCount: res.data.viewCount
      }
    });

  } catch (err) {
    // Don't show error for view failures, just log
    console.error('Failed to record story view:', err);
  }
};

// Reply to a story
export const replyToStory = (storyId, text, token) => async (dispatch) => {
  try {
    const res = await postDataAPI(`stories/${storyId}/reply`, { text }, token);
    
    dispatch({
      type: STORY_TYPES.REPLY_STORY,
      payload: {
        storyId,
        reply: res.data.reply,
        totalReplies: res.data.totalReplies
      }
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: 'Reply sent!' }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to send reply' }
    });
  }
};

// Delete a story
export const deleteStory = (storyId, token) => async (dispatch) => {
  try {
    await deleteDataAPI(`stories/${storyId}`, token);
    
    dispatch({
      type: STORY_TYPES.DELETE_STORY,
      payload: storyId
    });

    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: 'Story deleted successfully!' }
    });

    // Refresh stories feed
    dispatch(getStoriesFeed(token));

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to delete story' }
    });
  }
};

// Get story analytics
export const getStoryAnalytics = (storyId, token) => async (dispatch) => {
  try {
    const res = await getDataAPI(`stories/${storyId}/analytics`, token);
    
    dispatch({
      type: STORY_TYPES.UPDATE_STORY_ANALYTICS,
      payload: {
        storyId,
        analytics: res.data.analytics
      }
    });

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to load analytics' }
    });
  }
};

// Helper function to simulate media upload
// In a real app, this would upload to Cloudinary, AWS S3, etc.
const uploadMedia = async (media) => {
  return new Promise((resolve) => {
    // Simulate upload delay
    setTimeout(() => {
      resolve({
        type: media.type,
        url: media.url, // In production, this would be the cloud URL
        publicId: `story_${Date.now()}` // Simulated public ID
      });
    }, 1000);
  });
};

// Utility functions for story management
export const isStoryExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

export const getTimeRemaining = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const remaining = expiry - now;
  
  if (remaining <= 0) {
    return { expired: true, text: 'Expired' };
  }
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { expired: false, text: `${days}d left` };
  } else if (hours > 0) {
    return { expired: false, text: `${hours}h left` };
  } else {
    return { expired: false, text: `${minutes}m left` };
  }
};

export const isExpiringSoon = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const remaining = expiry - now;
  const hoursRemaining = remaining / (1000 * 60 * 60);
  return hoursRemaining <= 2 && hoursRemaining > 0;
};
