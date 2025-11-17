import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../../redux/actions/authAction";
import "./Sidebar.css";

import Main from "../main/Main";
import AllPosts from "../posts/AllPosts";
import Comments from "../comments/Comments";
import UsersManagement from "../usersManagement/UsersManagement";
import Spam from "../spamManagement/Spam";
import Likes from "../likes/Likes";

const menuItems = [
  { id: 1, icon: "fa-th-large", label: "Dashboard" },
  { id: 2, icon: "fa-file-text-o", label: "All Posts" },
  { id: 3, icon: "fa-users", label: "Users Management" },
  { id: 4, icon: "fa-comments", label: "Comments" },
  { id: 5, icon: "fa-ban", label: "Reported" },
  { id: 6, icon: "fa-thumbs-up", label: "Likes" },
  { id: 7, icon: "fa-power-off", label: "Log out", action: "logout" },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const [adminMenu, setAdminMenu] = useState(1);

  const renderContent = () => {
    switch (adminMenu) {
      case 2:
        return <AllPosts />;
      case 3:
        return <UsersManagement />;
      case 4:
        return <Comments />;
      case 5:
        return <Spam />;
      case 6:
        return <Likes />;
      default:
        return null;
    }
  };

  return (
    <div className="sidebar-attractive-layout">
      <aside className="sidebar-attractive">
        <div className="sidebar-attractive__header">
          <div className="sidebar-attractive__logo">
            <span role="img" aria-label="logo" className="sidebar-attractive__emoji">🌐</span>
            <h1>Mesme</h1>
          </div>
        </div>
        <nav className="sidebar-attractive__menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-attractive__link${adminMenu === item.id && !item.action ? " active" : ""}${item.action === 'logout' ? ' logout' : ''}`}
              onClick={() => {
                if (item.action === 'logout') {
                  dispatch(logout());
                } else {
                  setAdminMenu(item.id)
                }
              }}
              type="button"
            >
              <i className={`fa ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="sidebar-attractive-content">{adminMenu === 1 ? <Main onNavigate={setAdminMenu} /> : renderContent()}</main>
    </div>
  );
};

export default Sidebar;