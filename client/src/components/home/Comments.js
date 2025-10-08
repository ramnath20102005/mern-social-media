import React, { useState, useEffect} from 'react'
import CommentDisplay from './comments/CommentDisplay'

const Comments = ({post}) => {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState([]);
  const [next, setNext] = useState(2);
  const [replyComments, setReplyComments] = useState([]);


  useEffect(() => {
    const newCm = post.comments.filter((cm) => !cm.reply);
    setComments(newCm);
    setShowComments(newCm.slice(newCm.length - next));
  }, [post.comments, next]);

  useEffect(() => {
    const newReply = post.comments.filter((cm) => cm.reply);
    setReplyComments(newReply);
  }, [post.comments]);

    return (
      <div className="enhanced-comments">
        {showComments.length > 0 ? (
          <>
            {showComments.map((comment, index) => (
              <CommentDisplay
                key={index}
                comment={comment}
                post={post}
                replyCm={replyComments.filter((item) => item.reply === comment._id)}
              />
            ))}
            {comments.length - next > 0 ? (
              <button
                onClick={() => setNext(next + 10)}
                className="load-more-btn"
              >
                <i className="fas fa-chevron-down"></i>
                Load more comments ({comments.length - next})
              </button>
            ) : (
              comments.length > 2 && (
                <button
                  onClick={() => setNext(2)}
                  className="load-more-btn collapse-btn"
                >
                  <i className="fas fa-chevron-up"></i>
                  Show less
                </button>
              )
            )}
          </>
        ) : (
          <div className="no-comments">
            <i className="far fa-comment-dots"></i>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    );
}

export default Comments
