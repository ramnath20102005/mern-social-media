import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDataAPI } from "../../utils/fetchData";
import { GLOBALTYPES } from "../../redux/actions/globalTypes";
// import { Link } from "react-router-dom";
import UserCard from "../UserCard";
import LoadIcon from "../../images/loading.gif";

const Search = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  const { auth } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [load, setLoad] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!search) return;

    try {
      setLoad(true);
      const res = await getDataAPI(`search?username=${search}`, auth.token);
      setUsers(res.data.users);
      setLoad(false);
    } catch (err) {
      dispatch({
        type: GLOBALTYPES.ALERT,
        payload: { error: err.response.data.msg },
      });
    }
  };

  const handleClose = () => {
    setSearch("");
    setUsers([]);
  };

  return (
    <div className="modern-search-wrapper">
      <form className="modern-search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search people, posts, or topics..."
          name="search"
          value={search}
          className="search-input"
          onChange={(e) =>
            setSearch(e.target.value.toLowerCase().replace(/ /g, " "))
          }
        />
        
        {search && (
          <button
            type="button"
            onClick={handleClose}
            className="search-clear-btn"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        
        <button type="submit" className="search-submit-btn">
          <i className="fas fa-search"></i>
        </button>
      </form>

      {/* Search Results Dropdown */}
      {(search || users.length > 0) && (
        <div className="search-results-dropdown">
          {load ? (
            <div className="search-loading">
              <img src={LoadIcon} alt="Loading" className="loading-spinner" />
              <span>Searching...</span>
            </div>
          ) : (
            <>
              {users.length > 0 ? (
                <>
                  <div className="search-results-header">
                    <span>People</span>
                    <span className="results-count">{users.length} results</span>
                  </div>
                  <div className="search-results-list">
                    {users.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        border="border"
                        handleClose={handleClose}
                      />
                    ))}
                  </div>
                </>
              ) : search ? (
                <div className="no-results">
                  <i className="fas fa-search"></i>
                  <span>No results found for "{search}"</span>
                  <small>Try searching for something else</small>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
