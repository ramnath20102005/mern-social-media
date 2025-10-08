import { STORY_TYPES } from '../actions/storyAction';

const initialState = {
  loading: false,
  stories: [], // Stories feed for home page
  userStories: {}, // Stories by user ID
  currentStory: null,
  analytics: {}
};

const storyReducer = (state = initialState, action) => {
  switch (action.type) {
    case STORY_TYPES.LOADING_STORY:
      return {
        ...state,
        loading: action.payload
      };

    case STORY_TYPES.GET_STORIES_FEED:
      return {
        ...state,
        stories: action.payload
      };

    case STORY_TYPES.CREATE_STORY:
      // Add new story to the appropriate user's stories in the feed
      const newStory = action.payload;
      const updatedStories = state.stories.map(userStories => {
        if (userStories.user._id === newStory.user._id) {
          return {
            ...userStories,
            stories: [newStory, ...userStories.stories],
            latestStory: newStory,
            storyCount: userStories.storyCount + 1,
            hasUnviewed: true
          };
        }
        return userStories;
      });

      // If user doesn't exist in stories feed, add them
      const userExists = state.stories.some(userStories => 
        userStories.user._id === newStory.user._id
      );

      if (!userExists) {
        updatedStories.unshift({
          _id: newStory.user._id,
          user: newStory.user,
          latestStory: newStory,
          storyCount: 1,
          stories: [newStory],
          hasUnviewed: true
        });
      }

      return {
        ...state,
        stories: updatedStories
      };

    case STORY_TYPES.GET_USER_STORIES:
      return {
        ...state,
        userStories: {
          ...state.userStories,
          [action.payload.userId]: action.payload.data
        }
      };

    case STORY_TYPES.VIEW_STORY:
      // Update view count for the story
      const { storyId, viewCount } = action.payload;
      
      const storiesWithUpdatedViews = state.stories.map(userStories => ({
        ...userStories,
        stories: userStories.stories.map(story => 
          story._id === storyId 
            ? { ...story, totalViews: viewCount }
            : story
        ),
        latestStory: userStories.latestStory._id === storyId 
          ? { ...userStories.latestStory, totalViews: viewCount }
          : userStories.latestStory
      }));

      return {
        ...state,
        stories: storiesWithUpdatedViews
      };

    case STORY_TYPES.REPLY_STORY:
      // Update reply count for the story
      const { storyId: replyStoryId, totalReplies } = action.payload;
      
      const storiesWithUpdatedReplies = state.stories.map(userStories => ({
        ...userStories,
        stories: userStories.stories.map(story => 
          story._id === replyStoryId 
            ? { ...story, totalReplies }
            : story
        ),
        latestStory: userStories.latestStory._id === replyStoryId 
          ? { ...userStories.latestStory, totalReplies }
          : userStories.latestStory
      }));

      return {
        ...state,
        stories: storiesWithUpdatedReplies
      };

    case STORY_TYPES.DELETE_STORY:
      // Remove story from all relevant places
      const deletedStoryId = action.payload;
      
      const storiesAfterDeletion = state.stories.map(userStories => {
        const filteredStories = userStories.stories.filter(story => 
          story._id !== deletedStoryId
        );
        
        // If no stories left for this user, remove them from feed
        if (filteredStories.length === 0) {
          return null;
        }
        
        // Update latest story if the deleted one was the latest
        const newLatestStory = userStories.latestStory._id === deletedStoryId 
          ? filteredStories[0] 
          : userStories.latestStory;
        
        return {
          ...userStories,
          stories: filteredStories,
          latestStory: newLatestStory,
          storyCount: filteredStories.length
        };
      }).filter(Boolean); // Remove null entries

      return {
        ...state,
        stories: storiesAfterDeletion
      };

    case STORY_TYPES.UPDATE_STORY_ANALYTICS:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          [action.payload.storyId]: action.payload.analytics
        }
      };

    default:
      return state;
  }
};

export default storyReducer;
