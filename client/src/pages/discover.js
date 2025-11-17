import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from "react-redux";
import { getDiscoverPosts, DISCOVER_TYPES } from "../redux/actions/discoverAction";
import LoadIcon from '../images/loading.gif';
import PostThumb from "../components/PostThumb";
import LoadMoreBtn from '../components/LoadMoreBtn';
import { getDataAPI } from '../utils/fetchData';

const Discover = () => {
  const { auth, discover } = useSelector(state => state);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [load, setLoad] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: t('discover.filters.all'), icon: 'fas fa-th' },
    { id: 'photos', label: t('discover.filters.photos'), icon: 'fas fa-image' },
    { id: 'videos', label: t('discover.filters.videos'), icon: 'fas fa-video' },
    { id: 'trending', label: t('discover.filters.trending'), icon: 'fas fa-fire' },
    { id: 'recent', label: t('discover.filters.recent'), icon: 'fas fa-clock' }
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
          <h1 className="discover-title" style={{ color: 'var(--text-primary)' }}>{t('discover.title')}</h1>
          <p className="discover-subtitle" style={{ color: 'var(--text-tertiary)' }}>{t('discover.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="discover-search-container">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder={t('discover.searchPlaceholder')}
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
              <h3 style={{ color: 'var(--text-primary)' }}>{t('discover.loadingTitle')}</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>{t('discover.loadingSubtitle')}</p>
            </div>
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="search-results-header">
                <h3 style={{ color: 'var(--text-primary)' }}>{t('discover.resultsTitle', { query: searchQuery })}</h3>
                <p style={{ color: 'var(--text-tertiary)' }}>{t('discover.resultsCount', { count: filteredPosts.length })}</p>
              </div>
            )}

            <PostThumb posts={filteredPosts} result={filteredPosts.length} />

            {filteredPosts.length === 0 && searchQuery && (
              <div className="no-search-results">
                <div className="no-results-content">
                  <i className="fas fa-search"></i>
                  <h3 style={{ color: 'var(--text-primary)' }}>{t('discover.noResultsTitle')}</h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>{t('discover.noResultsSubtitle')}</p>
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
