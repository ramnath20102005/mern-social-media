import React, { useEffect } from 'react'

const Toast = ({ msg, handleShow, bgColor }) => {
  // Auto-dismiss toast after 4 seconds for errors, 2 seconds for success
  useEffect(() => {
    const isError = bgColor.includes('danger');
    const timeout = setTimeout(() => {
      handleShow();
    }, isError ? 4000 : 2000);

    return () => clearTimeout(timeout);
  }, [handleShow, bgColor]);

  return (
    <div
      className={`toast show position-fixed text-light ${bgColor} `}
      style={{ top: "5px", right: "5px", minWidth: "200px", zIndex: 50 }}
    >
      <div className={`toast-header text-light ${bgColor}`}>
        <strong className="mr-auto text-light">{msg.title}</strong>
        <button
          className="ml-auto mb-1 close text-light"
          data-dismiss="toast"
          style={{
            border: "none",
            background: "none",
            fontSize: "30px",
            right: 0,
          }}
          onClick={handleShow}
        >
          &times;
        </button>
      </div>
      <div className="toast-body">{msg.body}</div>
    </div>
  );
};

export default Toast
