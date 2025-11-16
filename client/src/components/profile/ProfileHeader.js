import React from 'react';
import { Link } from 'react-router-dom';

const ProfileHeader = ({ title, showSeeAll = false, seeAllLink = '#' }) => {
  return (
    <div className="profile-section-header">
      <h3 className="profile-section-title">{title}</h3>
      {showSeeAll && (
        <Link to={seeAllLink} className="profile-see-all">
          See All
        </Link>
      )}
    </div>
  );
};

export default ProfileHeader;
