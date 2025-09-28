import { GLOBALTYPES } from "./globalTypes";
import { postDataAPI, getDataAPI } from "../../utils/fetchData";

export const MESSAGE_TYPES = {
  ADD_USER: "ADD_USER",
  ADD_MESSAGE: "ADD_MESSAGE",
  GET_CONVERSATIONS: "GET_CONVERSATIONS",
  GET_MESSAGES: "GET_MESSAGES",
  TYPING_START: "TYPING_START",
  TYPING_STOP: "TYPING_STOP",
};

export const addUser = ({ user, message }) => async (dispatch) => {
    // Check if user already exists in conversation list
    const userExists = message.users.some(item => item._id === user._id);
    
    if (!userExists) {
        dispatch({
            type: MESSAGE_TYPES.ADD_USER, 
            payload: {
                ...user, 
                text: '', 
                media: [],
                createdAt: new Date().toISOString() // Add timestamp for sorting
            }
        });
    }
};

export const addMessage = ({ msg, auth, socket }) => async (dispatch) => {
  console.log('addMessage action called with:', msg);
  
  dispatch({type: MESSAGE_TYPES.ADD_MESSAGE, payload: msg});
  
  // Add sender info for notifications
  const messageWithSender = {
    ...msg,
    senderUsername: auth.user.username,
    senderAvatar: auth.user.avatar
  };
  
  socket.emit('addMessage', messageWithSender);

  try {
    console.log('Posting message to API:', msg);
    const response = await postDataAPI('message', msg, auth.token);
    console.log('API response:', response);
  } catch (err) {
    console.error('Error sending message:', err);
    dispatch({ type: GLOBALTYPES.ALERT, payload: {error: err.response?.data?.msg || 'Failed to send message'} });
  }
}

export const getConversations = ({auth, page = 1 }) => async (dispatch) => {
  try {
    console.log('Getting conversations for user:', auth.user._id);
    const res = await getDataAPI(`conversations?limit=${page * 9}`, auth.token);
    console.log('Conversations response:', res.data);
    
    let newArr = [];
    res.data.conversations.forEach(item => {
      item.recipients.forEach(cv => {
        if(cv._id !== auth.user._id){
          newArr.push({...cv, text: item.text, media: item.media, updatedAt: item.updatedAt});
        }
      })
    });

    console.log('Processed conversations:', newArr);
    dispatch({ type: MESSAGE_TYPES.GET_CONVERSATIONS, payload: {newArr, result: res.data.result} });
  } catch (err) {
    console.error('Error getting conversations:', err);
    dispatch({ type: GLOBALTYPES.ALERT, payload: {error: err.response?.data?.msg || 'Failed to get conversations'} });
  }
}

export const getMessages = ({ auth, id, page = 1 }) => async (dispatch) => {
  try {
    console.log('Getting messages for conversation with:', id);
    const res = await getDataAPI(`message/${id}?limit=${page * 9}`, auth.token);
    console.log('Messages response:', res.data);

    dispatch({ type: MESSAGE_TYPES.GET_MESSAGES, payload: res.data });
  } catch (err) {
    console.error('Error getting messages:', err);
    dispatch({
      type: GLOBALTYPES.ALERT,
      payload: { error: err.response?.data?.msg || 'Failed to get messages' },
    });
  }
};