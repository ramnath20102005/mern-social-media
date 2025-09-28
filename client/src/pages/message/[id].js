import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getDataAPI } from "../../utils/fetchData";
import { addUser } from "../../redux/actions/messageAction";
import LeftSide from "../../components/message/LeftSide";
import RightSide from "../../components/message/RightSide";

const Conversation = () => {
  const { id } = useParams();
  const { auth, message } = useSelector(state => state);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAndAddUser = async () => {
      if (id && auth.token) {
        try {
          // Check if user is already in conversation list
          const userExists = message.users.some(user => user._id === id);
          
          if (!userExists) {
            // Fetch user data and add to conversation
            const res = await getDataAPI(`user/${id}`, auth.token);
            if (res.data.user) {
              dispatch(addUser({ user: res.data.user, message }));
            }
          }
        } catch (error) {
          console.error('Error fetching user for conversation:', error);
        }
      }
    };

    fetchAndAddUser();
  }, [id, auth.token, message, dispatch]);

  return (
    <div className="whatsapp-messenger">
      <div className="messenger-sidebar">
        <LeftSide />
      </div>

      <div className="messenger-chat-area">
        <RightSide /> 
      </div>
    </div>
  );
};

export default Conversation;
