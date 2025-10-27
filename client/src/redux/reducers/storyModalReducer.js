import { GLOBALTYPES } from "../actions/globalTypes";

const storyModalReducer = (state = false, action) => {
  switch (action.type) {
    case GLOBALTYPES.STORY:
      return action.payload;

    default:
      return state;
  }
};

export default storyModalReducer;
