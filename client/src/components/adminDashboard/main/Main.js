import "./Main.css";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  getTotalUsers,
  getTotalPosts,
  getTotalComments,
  getTotalLikes,
  getTotalSpamPosts,
} from "../../../redux/actions/adminAction";


const Main = ({ onNavigate }) => {
  const { auth, admin } = useSelector((state) => state);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTotalUsers(auth.token));
    dispatch(getTotalPosts(auth.token));
    dispatch(getTotalComments(auth.token));
    dispatch(getTotalLikes(auth.token));
    dispatch(getTotalSpamPosts(auth.token));
  }, [dispatch, auth.token]);
  return (
    <div className="main_admin">
      <div className="main__container">
        {/* <!-- MAIN TITLE STARTS HERE --> */}

        <div className="main__title">
          <div className="main__greeting">
            <h1>Hello {auth.user.username}</h1>
            <p>Welcome to your Admin Dashboard</p>
          </div>
        </div>

        {/* <!-- MAIN TITLE ENDS HERE --> */}

        {/* <!-- MAIN CARDS STARTS HERE --> */}
        <div className="main__cards">
          <div className="card_admin" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate(3)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onNavigate && onNavigate(3); } }}>
            <i
              className="fa fa-users fa-2x text-lightblue"
              aria-hidden="true"
            ></i>
            <div className="card_inner_admin">
              <p className="text-primary-p">Total Users</p>
              <span className="font-bold text-title">{admin.total_users}</span>
            </div>
          </div>

          <div
            className="card_admin"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate && onNavigate(4)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate && onNavigate(4);
              }
            }}
          >
            <i className="fa fa-comments fa-2x text-red" aria-hidden="true"></i>
            <div className="card_inner_admin">
              <p className="text-primary-p">Total Comments</p>
              <span className="font-bold text-title">
                {admin.total_comments}
              </span>
            </div>
          </div>

          <div
            className="card_admin"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate && onNavigate(2)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate && onNavigate(2);
              }
            }}
          >
            <i
              className="fa fa-camera fa-2x text-yellow"
              aria-hidden="true"
            ></i>
            <div className="card_inner_admin">
              <p className="text-primary-p">Total Posts</p>
              <span className="font-bold text-title">{admin.total_posts}</span>
            </div>
          </div>

          <div
            className="card_admin"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate && onNavigate(5)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate && onNavigate(5);
              }
            }}
          >
            <i className="fa fa-ban fa-2x text-red" aria-hidden="true"></i>
            <div className="card_inner_admin">
              <p className="text-primary-p">Reported Posts</p>
              <span className="font-bold text-title">
                {admin.total_spam_posts}
              </span>
            </div>
          </div>

          <div
            className="card_admin"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate && onNavigate(6)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate && onNavigate(6);
              }
            }}
          >
            <i
              className="fa fa-thumbs-up fa-2x text-green"
              aria-hidden="true"
            ></i>
            <div className="card_inner_admin">
              <p className="text-primary-p">Total Likes</p>
              <span className="font-bold text-title">{admin.total_likes}</span>
            </div>
          </div>

        </div>
        {/* <!-- MAIN CARDS ENDS HERE --> */}

        {/* Visual KPI Bars (pictorial) */}
        <div className="charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {(() => {
            const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
            const postsPerUser = clamp((admin.total_posts / Math.max(1, admin.total_users)) * 100);
            const likesPerPost = clamp((admin.total_likes / Math.max(1, admin.total_posts)) * 100);
            const commentsPerPost = clamp((admin.total_comments / Math.max(1, admin.total_posts)) * 100);
            const spamRate = clamp((admin.total_spam_posts / Math.max(1, admin.total_posts)) * 100);
            const cards = [
              { title: 'Posts per user', value: `${admin.total_posts} / ${Math.max(1, admin.total_users)}`, percent: postsPerUser, icon: 'fa fa-camera', color: 'var(--primary-500)' },
              { title: 'Likes per post', value: `${admin.total_likes} / ${Math.max(1, admin.total_posts)}`, percent: likesPerPost, icon: 'fa fa-thumbs-up', color: 'var(--success-500)' },
              { title: 'Comments per post', value: `${admin.total_comments} / ${Math.max(1, admin.total_posts)}`, percent: commentsPerPost, icon: 'fa fa-comments', color: 'var(--warning-500)' },
              { title: 'Reported rate', value: `${admin.total_spam_posts} / ${Math.max(1, admin.total_posts)}`, percent: spamRate, icon: 'fa fa-ban', color: 'var(--danger-500)' },
            ];
            return cards.map((c, i) => (
              <div key={i} className="stat_card">
                <div className="stat_header">
                  <i className={`${c.icon} stat_icon`} />
                  <div>
                    <div className="stat_title">{c.title}</div>
                    <div className="stat_value">{c.value}</div>
                  </div>
                </div>
                <div className="stat_bar">
                  <div className="stat_fill" style={{ width: `${c.percent}%`, background: c.color }} />
                </div>
                <div className="stat_percent">{c.percent}%</div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default Main;
