import { GLOBALTYPES } from "../actions/globalTypes";

const initialState = {
  show: false,
  userStories: null,
  initialStoryIndex: 0
};

const storyViewerReducer = (state = initialState, action) => {
  switch (action.type) {
    case GLOBALTYPES.STORY_VIEWER:
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};

export default storyViewerReducer;
