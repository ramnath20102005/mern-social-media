import React, { useState, useEffect} from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getDiscoverPosts, DISCOVER_TYPES } from "../redux/actions/discoverAction";
import LoadIcon from '../images/loading.gif';
import PostThumb from "../components/PostThumb";
import LoadMoreBtn from '../components/LoadMoreBtn';
import { getDataAPI } from '../utils/fetchData';

const Discover = () => {
    const { auth, discover } = useSelector(state => state);
    const dispatch = useDispatch();

    const [load, setLoad] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
      { id: 'all', label: 'All', icon: 'fas fa-th' },
      { id: 'photos', label: 'Photos', icon: 'fas fa-image' },
      { id: 'videos', label: 'Videos', icon: 'fas fa-video' },
      { id: 'trending', label: 'Trending', icon: 'fas fa-fire' },
      { id: 'recent', label: 'Recent', icon: 'fas fa-clock' }
    ];

    useEffect(() => {
      if (!discover.firstLoad) {
        dispatch(getDiscoverPosts(auth.token));
      }
    }, [dispatch, auth.token, discover.firstLoad]);

    const handleLoadMore = async () => {
        setLoad(true);
        const res = await getDataAPI(`post_discover?num=${discover.page * 8}`, auth.token);
        dispatch({ type: DISCOVER_TYPES.UPDATE_POSTS, payload: res.data });
        setLoad(false);
    };

    const handleSearch = (e) => {
      setSearchQuery(e.target.value);
      // Add search functionality here
    };

    const filteredPosts = discover.posts.filter(post => {
      const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeFilter === 'all') return matchesSearch;
      if (activeFilter === 'photos') return matchesSearch && !post.images[0]?.url.match(/video/i);
      if (activeFilter === 'videos') return matchesSearch && post.images[0]?.url.match(/video/i);
      if (activeFilter === 'trending') return matchesSearch && post.likes?.length > 10;
      if (activeFilter === 'recent') return matchesSearch;
      
      return matchesSearch;
    });

    return (
      <div className="instagram-discover-container">
        {/* Discover Header */}
        <div className="discover-header">
          <div className="discover-title-section">
            <h1 className="discover-title">Explore</h1>
            <p className="discover-subtitle">Discover amazing content from the community</p>
          </div>
          
          {/* Search Bar */}
          <div className="discover-search-container">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search posts, users, hashtags..."
                value={searchQuery}
                onChange={handleSearch}
                className="discover-search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="discover-filters">
          <div className="filters-container">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                <i className={filter.icon}></i>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Discover Content */}
        <div className="discover-content">
          {discover.loading ? (
            <div className="discover-loading">
              <div className="loading-container-discover">
                <div className="discover-loading-spinner">
                  <div className="spinner-gradient"></div>
                </div>
                <h3>Discovering Content</h3>
                <p>Finding the best posts for you...</p>
              </div>
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="search-results-header">
                  <h3>Search Results for "{searchQuery}"</h3>
                  <p>{filteredPosts.length} posts found</p>
                </div>
              )}
              
              <PostThumb posts={filteredPosts} result={filteredPosts.length} />
              
              {filteredPosts.length === 0 && searchQuery && (
                <div className="no-search-results">
                  <div className="no-results-content">
                    <i className="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try searching for something else</p>
                  </div>
                </div>
              )}
            </>
          )}

          {load && (
            <div className="discover-load-more">
              <div className="loading-spinner-small">
                <div className="spinner-gradient"></div>
              </div>
            </div>
          )}

          {!discover.loading && !searchQuery && (
            <LoadMoreBtn
              result={discover.result}
              page={discover.page}
              load={load}
              handleLoadMore={handleLoadMore}
            />
          )}
        </div>
      </div>
    );
}

export default Discover;
