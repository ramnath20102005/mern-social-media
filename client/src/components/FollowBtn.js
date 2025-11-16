import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { follow, unfollow } from "../redux/actions/profileAction";

const FollowBtn = ({ user }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const { auth } = useSelector(state => state);
    const dispatch = useDispatch();

    // Update follow status when auth or user changes
    useEffect(() => {
        if (auth.user?.following?.includes(user._id)) {
            setIsFollowing(true);
        } else {
            setIsFollowing(false);
        }
    }, [auth.user?.following, user._id]);

    // Handle follow/unfollow with proper error handling
    const handleToggleFollow = useCallback(async () => {
        if (isLoading) return;
        
        try {
            setIsLoading(true);
            
            if (isFollowing) {
                // Optimistic update for unfollow
                setIsFollowing(false);
                await dispatch(unfollow({ 
                    users: [user],
                    user, 
                    auth, 
                    socket: null // Add socket if available
                }));
            } else {
                // Optimistic update for follow
                setIsFollowing(true);
                await dispatch(follow({ 
                    users: [user],
                    user, 
                    auth, 
                    socket: null // Add socket if available
                }));
            }
        } catch (err) {
            // Revert on error
            setIsFollowing(!isFollowing);
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isFollowing, isLoading, dispatch, user, auth]);

    return (
        <button 
            className={`modern-follow-btn ${isFollowing ? 'following' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={handleToggleFollow}
            disabled={isLoading}
        >
            {isLoading ? (
                <div className="btn-loading">
                    <div className="loading-spinner-btn"></div>
                </div>
            ) : isFollowing ? (
                <>
                    <i className="fas fa-user-check"></i>
                    <span className="btn-text">Following</span>
                    <span className="btn-hover-text">Unfollow</span>
                </>
            ) : (
                <>
                    <i className="fas fa-user-plus"></i>
                    <span className="btn-text">Follow</span>
                </>
            )}
        </button>
    );
};

export default React.memo(FollowBtn);
