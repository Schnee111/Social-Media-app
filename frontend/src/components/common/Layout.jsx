import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { Home, Search, PlusSquare, MessageCircle, User, LogOut, Flame, TrendingUp } from 'lucide-react';
import { NotificationBell } from '../notification/NotificationBell';
import { useEffect } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessage();
  const location = useLocation();

  // Debug log
  useEffect(() => {
    console.log('📨 Layout - Unread count updated:', unreadCount);
  }, [unreadCount]);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/explore', icon: TrendingUp, label: 'Explore' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/discover', icon: Flame, label: 'Discover' },
    { path: `/profile/${user?._id}`, icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;
  const isMessagesPage = location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar - Desktop */}
      <aside className="sidebar hidden lg:block fixed left-0 top-0 w-64 p-4 h-screen border-r border-dark-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <Link to="/" className="mb-8 px-3">
            <h1 className="text-4xl font-normal bg-gradient-instagram bg-clip-text text-transparent" style={{ fontFamily: 'Pacifico, cursive' }}>
              ProGram
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors relative ${
                  isActive(item.path)
                    ? 'bg-dark-800 text-white'
                    : 'text-gray-400 hover:bg-dark-900 hover:text-white'
                }`}
              >
                <item.icon size={24} />
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {/* Unread Messages Badge */}
                  {item.label === 'Messages' && unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-max">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* User Info & Notifications */}
          <div className="border-t border-dark-800 pt-4 mt-4 space-y-3">
            {/* Notification Bell */}
            <div className="flex items-center justify-between px-3">
              <span className="text-sm text-gray-400">Notifikasi</span>
              <NotificationBell />
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 px-3">
              <div className="avatar w-10 h-10 bg-gradient-instagram">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <span className="font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-dark-900 hover:text-white rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* ✅ Conditional padding - full width for messages, constrained for others */}
        <div className={isMessagesPage ? 'h-screen' : 'max-w-4xl mx-auto p-4 pb-20 lg:pb-4'}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="navbar lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-dark-800 z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors relative ${
                isActive(item.path)
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <item.icon size={24} />
                {/* Unread Messages Badge */}
                {item.label === 'Messages' && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {/* Notification Bell - Mobile */}
          <div className="flex items-center justify-center w-12 h-12 rounded-lg">
            <NotificationBell />
          </div>
          <Link
            to={`/profile/${user?._id}`}
            className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
              isActive(`/profile/${user?._id}`)
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User size={24} />
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;