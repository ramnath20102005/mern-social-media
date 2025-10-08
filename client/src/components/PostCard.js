import React from 'react';
import CardBody from "./home/post_card/CardBody";
import CardFooter from "./home/post_card/CardFooter";
import CardHeader from "./home/post_card/CardHeader";
import "../styles/modern_post_card.css";

const PostCard = ({ post, theme }) => {
  return (
    <div className="modern-post-card">
      <div className="post-card-container">
        <CardHeader post={post} />
        <CardBody post={post} theme={theme} />
        <CardFooter post={post} />
      </div>
    </div>
  );
};

export default PostCard;