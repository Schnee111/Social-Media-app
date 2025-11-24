import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Search, PlusSquare, MessageCircle, User, LogOut, BarChart3 } from 'lucide-react'; // ✅ Added MessageCircle

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: `/profile/${user?._id}`, icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar - Desktop */}
      <aside className="sidebar hidden lg:block fixed left-0 top-0 w-64 p-4">
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
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-dark-800 text-white'
                    : 'text-gray-400 hover:bg-dark-900 hover:text-white'
                }`}
              >
                <item.icon size={24} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t border-dark-800 pt-4 mt-4">
            <div className="flex items-center gap-3 px-3 mb-3">
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
        <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="navbar lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-dark-800">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={24} />
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center justify-center w-12 h-12 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={24} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;