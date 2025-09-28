import React, { useState, useEffect } from "react";
import PostThumb from "../PostThumb";
import LoadIcon from "../../images/loading.gif";
import LoadMoreBtn from "../LoadMoreBtn";
import { getDataAPI } from "../../utils/fetchData";
import { PROFILE_TYPES } from "../../redux/actions/profileAction";

const Posts = ({ auth, profile, dispatch, id }) => {
  const [posts, setPosts] = useState([]);
  const [result, setResult] = useState(9);
  const [page, setPage] = useState(0);
  const [load, setLoad] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let found = false;
    profile.posts.forEach((data) => {
      if (data._id === id) {
        setPosts(data.posts);
        setResult(data.result);
        setPage(data.page);
        found = true;
      }
    });
    
    if (found) {
      setIsInitialLoad(false);
    }
  }, [profile.posts, id]);

  const handleLoadMore = async () => {
    setLoad(true);
    try {
      const res = await getDataAPI(
        `user_posts/${id}?limit=${page * 9}`,
        auth.token
      );
      const newData = { ...res.data, page: page + 1, _id: id };
      dispatch({ type: PROFILE_TYPES.UPDATE_POST, payload: newData });
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
    setLoad(false);
  };

  if (isInitialLoad && profile.loading) {
    return (
      <div className="posts-loading-container">
        <div className="posts-loading-grid">
          {[...Array(9)].map((_, index) => (
            <div key={index} className="post-skeleton">
              <div className="skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-posts-container">
      <PostThumb posts={posts} result={result} />

      {load && (
        <div className="posts-load-more-container">
          <div className="posts-loading-spinner">
            <div className="spinner-gradient"></div>
          </div>
          <p>Loading more posts...</p>
        </div>
      )}

      <LoadMoreBtn
        result={result}
        page={page}
        load={load}
        handleLoadMore={handleLoadMore}
      />
    </div>
  );
};

export default Posts;
