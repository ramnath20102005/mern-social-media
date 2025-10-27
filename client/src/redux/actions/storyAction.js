import { GLOBALTYPES } from './globalTypes';
import { postDataAPI, getDataAPI, deleteDataAPI } from '../../utils/fetchData';

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
    console.log('Fetching stories feed...');
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: true });

    const res = await getDataAPI('stories', token);
    console.log('Stories feed response:', res.data);
    
    dispatch({
      type: STORY_TYPES.GET_STORIES_FEED,
      payload: res.data.stories || []
    });

  } catch (err) {
    console.error('Error fetching stories:', err);
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
    console.log('Creating story with data:', storyData);
    dispatch({ type: STORY_TYPES.LOADING_STORY, payload: true });

    // Process media array - in a real app, upload to cloud storage
    const uploadedMedia = await Promise.all(
      storyData.media.map(async (mediaItem) => {
        // For now, simulate upload and return the media item
        return {
          url: mediaItem.url,
          public_id: mediaItem.public_id || `story_${Date.now()}_${Math.random()}`,
          type: mediaItem.type
        };
      })
    );
    
    const finalStoryData = {
      ...storyData,
      media: uploadedMedia
    };

    console.log('Sending story data to backend:', finalStoryData);
    const res = await postDataAPI('story', finalStoryData, token);
    console.log('Story creation response:', res.data);
    
    dispatch({
      type: STORY_TYPES.CREATE_STORY,
      payload: res.data.story
    });

    // Wait a moment then refresh stories feed
    setTimeout(() => {
      console.log('Refreshing stories feed after creation...');
      dispatch(getStoriesFeed(token));
    }, 1000);

    return res.data.story;

  } catch (err) {
    console.error('Story creation error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
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
    console.log('Attempting to view story:', storyId);
    const res = await postDataAPI(`stories/${storyId}/view`, {}, token);
    console.log('Story view response:', res.data);
    
    dispatch({
      type: STORY_TYPES.VIEW_STORY,
      payload: {
        storyId,
        view: res.data.view
      }
    });

  } catch (err) {
    // Don't show error for view failures, just log
    console.error('Failed to record story view:', err);
    console.error('Story ID:', storyId);
    console.error('Error details:', err.response?.data);
  }
};

// Reply to a story
export const replyToStory = (storyId, text, token) => async (dispatch) => {
  try {
    console.log('Attempting to reply to story:', storyId, 'with message:', text);
    const res = await postDataAPI(`stories/${storyId}/reply`, { message: text }, token);
    console.log('Story reply response:', res.data);
    
    // Story reply now creates a direct message, so we don't need to update story state
    // Instead, we could dispatch to update the message state if needed
    
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { success: res.data.msg || 'Reply sent as direct message!' }
    });

    // Return the response data for the component to handle
    return res.data;

  } catch (err) {
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to send reply' }
    });
    throw err; // Re-throw so component can handle the error
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

// Helper function removed - media processing now handled in createStory action

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
