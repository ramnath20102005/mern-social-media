import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { createComment } from '../../redux/actions/commentAction';
import Avatar from '../Avatar';

const InputComment = ({ children, post, onReply, setOnReply }) => {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { auth, socket, theme } = useSelector((state) => state);
  const dispatch = useDispatch();

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Popular emojis for quick access
  const popularEmojis = ['😀', '😂', '😍', '🥰', '😘', '😊', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏', '🙏', '💪'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting){
      if(setOnReply){return setOnReply(false)}
      return;
    }

    setIsSubmitting(true);
    const commentContent = content;
    setContent("");

    const newComment = {
      content: commentContent,
      likes: [],
      user: auth.user,
      createdAt: new Date().toISOString(),
      reply: onReply && onReply.commentId,
      tag: onReply && onReply.user
    };
    
    try {
      await dispatch(createComment({ post, newComment, auth, socket }));
      if (setOnReply) {
        setOnReply(false);
      }
    } catch (error) {
      setContent(commentContent); // Restore content on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    const newContent = content + emoji;
    setContent(newContent);
    inputRef.current?.focus();
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="enhanced-input-comment">
      {children}
      <div className="comment-input-container">
        <div className="comment-input-left">
          <Avatar src={auth.user.avatar} size="small-avatar" />
        </div>
        
        <div className="comment-input-main">
          <div className="comment-input-wrapper">
            <textarea
              ref={inputRef}
              className="comment-textarea"
              placeholder={onReply ? `Reply to @${onReply.user.username}...` : "Write a comment..."}
              value={content}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={isSubmitting}
            />
            
            <div className="comment-input-actions">
              <div className="emoji-section" ref={emojiPickerRef}>
                <button
                  type="button"
                  className="emoji-trigger-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                >
                  <i className="far fa-smile"></i>
                </button>
                
                {showEmojiPicker && (
                  <div className="emoji-picker-dropdown">
                    <div className="emoji-grid">
                      {popularEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          className="emoji-btn"
                          onClick={() => handleEmojiClick(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                className={`comment-send-btn ${content.trim() ? 'active' : ''}`}
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                title="Send comment"
              >
                {isSubmitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputComment;
