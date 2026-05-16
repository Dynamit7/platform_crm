import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ChatProvider } from '../../context/ChatContext';

export default function Layout() {
  return (
    <ChatProvider>
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </ChatProvider>
  );
}
