import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDataAPI } from "../../utils/fetchData";
import { GLOBALTYPES } from "../../redux/actions/globalTypes";
import Avatar from "../Avatar";

const MessageSearch = ({ onUserSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ users: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const { auth } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [load, setLoad] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults({ users: [] });
      return;
    }

    try {
      setLoad(true);
      const res = await getDataAPI(`search?username=${searchTerm}&type=users&limit=10`, auth.token);
      setResults({ users: res.data.users || [] });
      setLoad(false);
    } catch (err) {
      setLoad(false);
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: err.response?.data?.msg || "Search failed" },
      });
    }
  }, [auth.token, dispatch]);

  // Handle real-time search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (search) {
        debouncedSearch(search);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, debouncedSearch]);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('messageRecentSearches') || '[]');
    setRecentSearches(recent);
    
    // Popular suggestions for messaging
    setSuggestions([
      { type: 'user', text: 'john_doe', icon: 'fas fa-user' },
      { type: 'user', text: 'sarah_wilson', icon: 'fas fa-user' },
      { type: 'user', text: 'mike_johnson', icon: 'fas fa-user' },
      { type: 'user', text: 'emma_davis', icon: 'fas fa-user' },
    ]);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      addToRecentSearches(search.trim());
      debouncedSearch(search.trim());
    }
  };

  const addToRecentSearches = (searchTerm) => {
    const recent = JSON.parse(localStorage.getItem('messageRecentSearches') || '[]');
    const newRecent = [searchTerm, ...recent.filter(item => item !== searchTerm)].slice(0, 5);
    localStorage.setItem('messageRecentSearches', JSON.stringify(newRecent));
    setRecentSearches(newRecent);
  };

  const handleClose = () => {
    setSearch("");
    setResults({ users: [] });
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion);
    debouncedSearch(suggestion);
    addToRecentSearches(suggestion);
  };

  const handleUserSelect = (user) => {
    addToRecentSearches(user.username);
    if (onUserSelect) {
      onUserSelect(user);
    }
    handleClose();
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <div className="message-search-container" ref={searchRef}>
      <form className="message-search-form" onSubmit={handleSearchSubmit}>
        <div className="message-search-input-container">
          <div className="search-icon-wrapper">
            <i className="fas fa-search search-icon"></i>
          </div>
          
          <input
            type="text"
            placeholder="Search people to message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleFocus}
            className="message-search-input"
            autoComplete="off"
          />
          
          {search && (
            <button
              type="button"
              onClick={handleClose}
              className="search-clear-button"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          
          {load && (
            <div className="search-loading-indicator">
              <div className="loading-spinner-mini"></div>
            </div>
          )}
        </div>
      </form>

      {/* Message Search Dropdown */}
      {isOpen && (
        <div className="message-search-dropdown">
          {!search ? (
            // Show recent searches and suggestions when no search term
            <div className="message-search-suggestions">
              {recentSearches.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <h4>Recent searches</h4>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('messageRecentSearches');
                        setRecentSearches([]);
                      }}
                      className="clear-recent-btn"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="recent-searches-list">
                    {recentSearches.map((recent, index) => (
                      <div 
                        key={index}
                        className="recent-search-item"
                        onClick={() => handleSuggestionClick(recent)}
                      >
                        <i className="fas fa-history"></i>
                        <span>{recent}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newRecent = recentSearches.filter(item => item !== recent);
                            localStorage.setItem('messageRecentSearches', JSON.stringify(newRecent));
                            setRecentSearches(newRecent);
                          }}
                          className="remove-recent-btn"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="search-section">
                <div className="search-section-header">
                  <h4>Suggested people</h4>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion.text)}
                    >
                      <i className={suggestion.icon}></i>
                      <span>{suggestion.text}</span>
                      <i className="fas fa-arrow-up-right suggestion-arrow"></i>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Show search results
            <div className="message-search-results">
              {load ? (
                <div className="search-loading-state">
                  <div className="loading-animation">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <p>Searching for people...</p>
                </div>
              ) : (
                <div className="message-search-content">
                  {results.users?.length > 0 ? (
                    <div className="message-users-results">
                      <div className="results-section-header">
                        <h4>
                          <i className="fas fa-users"></i>
                          People ({results.users.length})
                        </h4>
                      </div>
                      <div className="message-users-list">
                        {results.users.map(user => (
                          <div 
                            key={user._id} 
                            className="message-user-card"
                            onClick={() => handleUserSelect(user)}
                          >
                            <Avatar src={user.avatar} size="medium-avatar" />
                            <div className="message-user-info">
                              <h5>{user.fullname}</h5>
                              <p>@{user.username}</p>
                              <span className="followers-count">
                                {user.followers?.length || 0} followers
                              </span>
                            </div>
                            <div className="message-user-actions">
                              <i className="fas fa-paper-plane"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-results-state">
                      <div className="no-results-icon">
                        <i className="fas fa-user-friends"></i>
                      </div>
                      <h3>No people found</h3>
                      <p>Try searching for a different name or username</p>
                      <div className="search-suggestions">
                        <span>Try searching for:</span>
                        <div className="suggestion-tags">
                          {['john', 'sarah', 'mike', 'emma', 'alex'].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => handleSuggestionClick(tag)}
                              className="suggestion-tag"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
