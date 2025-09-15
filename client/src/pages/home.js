import React, { useState } from "react";
import { useSelector } from "react-redux";

import Posts from "../components/home/Posts";
import Status from "../components/home/Status";
import RightSideBar from "../components/home/RightSideBar";

import LoadIcon from "../images/loading.gif";

const Home = () => {
  const { homePosts } = useSelector((state) => state);
  const [showStatus, setShowStatus] = useState(true); // Control modal visibility

  const handleCloseStatus = () => {
    setShowStatus(false); // Hide the status card/modal
  };

  return (
    <div className="home row mx-0 p-3">
      {/* Main Feed */}
      <div className="col-md-8 mb-3" style={{ marginTop: "50px" }}>
        {showStatus && (
          <div className="card shadow-sm rounded-3 p-3 mb-4" style={{ marginTop: "20px" }}>
            <Status onClose={handleCloseStatus} />
          </div>
        )}

        {homePosts.loading ? (
          <div className="text-center my-5">
            <img
              src={LoadIcon}
              alt="loading"
              style={{ width: "60px", height: "60px" }}
            />
            <p className="mt-2 text-muted">Loading posts...</p>
          </div>
        ) : homePosts.result === 0 ? (
          <h4 className="text-center text-muted mt-5">🚀 No posts yet!</h4>
        ) : (
          <div className="card shadow-sm rounded-3 p-3" style={{ marginTop: "40px" }}>
            <Posts />
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="col-md-4">
        <div className="card shadow-sm rounded-3 p-3 sticky-top" style={{ top: "80px" }}>
          <RightSideBar />
        </div>
      </div>
    </div>
  );
};

export default Home;