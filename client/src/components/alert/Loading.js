//!its a component
import React from "react";

const Loading = () => {
  return (
    <div
      style={{
        background: "white",
        top: 0,
        left: 0,
        zIndex: 50,
        opacity: 0.7
      }}
      className="position-fixed vh-100 w-100   d-flex justify-content-center align-items-center"
    >
      <div className="loading">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <span className="loading_text">
        Loading
      </span>
    </div>
  );
};

export default Loading;
