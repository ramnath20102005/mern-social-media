import React from 'react';

const ActivityModal = ({ type, onClose, likes = [], comments = [], recommendedGroups = [], status = '' }) => {
  if (!type) return null;

  const getTitle = () => {
    if (type === 'likes') return 'Likes received';
    if (type === 'comments') return 'Comments';
    return 'Activity';
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-container">
        <div className="modal-header" style={{ textAlign: 'left' }}>
          <h3 className="modal-title">{getTitle()}</h3>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-content" style={{ textAlign: 'left' }}>
          {type === 'likes' && (
            <div className="modal-section">
              {likes.length === 0 ? (
                <div>No likes yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {likes.map((u) => (
                    <div key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.username || u.fullname}</div>
                        {u.email && <div style={{ color: '#666', fontSize: 12 }}>{u.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {type === 'comments' && (
            <div className="modal-section">
              {comments.length === 0 ? (
                <div>No comments yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {comments.map((c) => (
                    <div key={c._id || c.id} style={{ display: 'flex', gap: 10 }}>
                      <img src={c.user?.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.user?.username || c.user?.fullname}</div>
                        <div style={{ color: '#333' }}>{c.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {recommendedGroups.length > 0 && (
            <div className="modal-section" style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Recommended Groups</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {recommendedGroups.map((g) => (
                  <div key={g._id || g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {g.icon && <img src={g.icon} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{g.name}</div>
                      {typeof g.members === 'number' && (
                        <div style={{ color: '#666', fontSize: 12 }}>{g.members} members</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status && (
            <div className="modal-section" style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Your Status</h4>
              <div style={{ padding: 10, border: '1px solid #eee', borderRadius: 8 }}>{status}</div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
