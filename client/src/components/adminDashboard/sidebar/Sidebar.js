import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../redux/actions/authAction";
import "./Sidebar.css";

import Main from "../main/Main";
import AdminManagement from "../adminManagement/AdminManagement";
import Spam from "../spamManagement/Spam";
import UsersManagement from "../usersManagement/UsersManagement";

const menuItems = [
  { id: 1, icon: "fa-th-large", label: "Dashboard" },
  { id: 2, icon: "fa-user-shield", label: "Admin Management" },
  { id: 3, icon: "fa-ban", label: "Spams Management" },
  { id: 4, icon: "fa-users", label: "Users Management" },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const [adminMenu, setAdminMenu] = useState(1);

  const renderContent = () => {
    switch (adminMenu) {
      case 1:
        return <Main />;
      case 2:
        return <AdminManagement />;
      case 3:
        return <Spam />;
      case 4:
        return <UsersManagement />;
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
            <h1>Campus Connect</h1>
          </div>
        </div>
        <nav className="sidebar-attractive__menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-attractive__link${adminMenu === item.id ? " active" : ""}`}
              onClick={() => setAdminMenu(item.id)}
              type="button"
            >
              <i className={`fa ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-attractive__divider" />
          <button className="sidebar-attractive__link" type="button">
            <i className="fa fa-archive"></i>
            <span>Archive</span>
          </button>
          <button className="sidebar-attractive__link" type="button">
            <i className="fa fa-handshake-o"></i>
            <span>Partners</span>
          </button>
        </nav>
        <div className="sidebar-attractive__logout">
          <Link to="/" onClick={() => dispatch(logout())}>
            <i className="fa fa-power-off"></i> Log out
          </Link>
        </div>
      </aside>
      <main className="sidebar-attractive-content">{renderContent()}</main>
    </div>
  );
};

export default Sidebar;