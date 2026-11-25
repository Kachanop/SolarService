import React from 'react';
import AccountPage from './AccountPage.jsx';
import AdminSubNav from './admin/AdminSubNav.jsx';
import NotificationInbox from '../components/NotificationInbox.jsx';

export default function AdminAccountWorkspace({ route, authUser, role, navigate, setToast, signOut }) {
  return (
    <div className="admin-workspace-shell">
      <AdminSubNav
        currentRoute={route}
        navigate={navigate}
        authUser={authUser}
        notificationInbox={<NotificationInbox user={authUser} navigate={navigate} />}
      />
      <div className="workspace-wrap admin-workspace-main" style={{ maxWidth: '1220px' }}>
        <AccountPage
          authUser={authUser}
          role={role}
          navigate={navigate}
          setToast={setToast}
          signOut={signOut}
        />
      </div>
    </div>
  );
}
