import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Menu from "./Menu";
import Search from "./Search";
import { useDispatch, useSelector } from "react-redux";
import { getPosts } from '../../redux/actions/postAction';
import { getSuggestions } from '../../redux/actions/suggestionsAction';

const Header = () => {
  const { auth } = useSelector(state => state);
  const dispatch = useDispatch();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRefreshHome = () => {
    window.scrollTo({top: 0, behavior: 'smooth'})
    dispatch(getPosts(auth.token));
    dispatch(getSuggestions(auth.token));
  };

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        {/* Logo Section */}
        <div className="logo-section">
          <Link to="/" className="logo" onClick={handleRefreshHome}>
            MESME
          </Link>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <Search />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="nav-section">
          <Menu />
        </div>
      </div>
    </header>
  );
};

export default Header;
