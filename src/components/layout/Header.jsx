import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useProjectStore from '../../stores/projectStore';
import ThemeSelector from '../Common/ThemeSelector';
import Win98Menu from '../Common/Win98Menu';
import AnimatedContainer from '../Common/AnimatedContainer';
import ReactDOM from 'react-dom';
import { 
  Icon,
  HomeIcon, 
  FolderIcon, 
  BrainIcon, 
  SearchIcon, 
  BellIcon, 
  SunIcon, 
  UserIcon, 
  SettingsIcon, 
  LogOutIcon, 
  XIcon, 
  MenuIcon 
} from '../Common/icons';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchProjects } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Refs for dropdowns
  const notificationsRef = useRef();
  const userMenuRef = useRef();
  const themeDropdownRef = useRef();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close all dropdowns
  useEffect(() => {
    const handleClick = (e) => {
      if (
        notificationsRef.current && !notificationsRef.current.contains(e.target) &&
        userMenuRef.current && !userMenuRef.current.contains(e.target) &&
        themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowThemeDropdown(false);
      } else {
        // Close each individually if clicked outside
        if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(e.target)) setShowNotifications(false);
        if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
        if (showThemeDropdown && themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) setShowThemeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications, showUserMenu, showThemeDropdown]);

  // Close dropdowns on navigation
  useEffect(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowThemeDropdown(false);
  }, [location.pathname]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchProjects ? searchProjects(query) : [];
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (projectId) => {
    navigate(`/projects/${projectId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/projects', label: 'Projects', icon: FolderIcon },
    { path: '/clips', label: 'Clips', icon: BrainIcon },
    { path: '/analytics', label: 'Analytics', icon: BrainIcon },
  ];

  return (
    <AnimatedContainer
      animation="slideInRight"
      trigger="mount"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-prism shadow-lg' : 'glass-frosted'
      }`}
    >
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Enhanced Logo */}
          <AnimatedContainer animation="bounceIn" delay={100} className="flex items-center gap-3">
            {/* Desktop Menu Toggle */}
            <button
              onClick={onToggleSidebar}
              className="lg:block hidden glass-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center mr-2"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <Icon icon={XIcon} size={20} className="text-white/70 hover:text-white transition-colors" />
              ) : (
                <Icon icon={MenuIcon} size={20} className="text-white/70 hover:text-white transition-colors" />
              )}
            </button>
            
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Icon icon={BrainIcon} size={24} className="text-indigo-300" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                  OpenClip Pro
                </h1>
                <p className="text-xs text-white/60">AI Video Analysis</p>
              </div>
            </Link>
          </AnimatedContainer>

          {/* Enhanced Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <AnimatedContainer
                  key={item.path}
                  animation="fadeIn"
                  delay={200 + index * 100}
                  trigger="mount"
                >
                  <Link
                    to={item.path}
                    className={`glass-button px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon icon={item.icon} size={16} />
                    {item.label}
                  </Link>
                </AnimatedContainer>
              );
            })}
          </nav>

          {/* Enhanced Search Bar */}
          <AnimatedContainer animation="slideInLeft" delay={300} trigger="mount" className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Icon icon={SearchIcon} size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search projects, clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-button w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-200"
              />
            </div>
          </AnimatedContainer>

          {/* Enhanced Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Enhanced Notifications */}
            <AnimatedContainer animation="bounceIn" delay={400} trigger="mount">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="glass-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center relative"
                aria-label="Notifications"
              >
                <Icon icon={BellIcon} size={24} className="text-white/70 hover:text-white transition-colors" />
                <span size={12} className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              {showNotifications &&
                ReactDOM.createPortal(
                  <div ref={notificationsRef} className="absolute top-[70px] right-8 glass-prism rounded-lg p-4 min-w-[300px] z-[60]">
                    <h3 className="text-white font-semibold mb-3">Notifications</h3>
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-white/80 text-sm">Project &quot;Video Analysis&quot; completed</p>
                        <p className="text-white/40 text-xs">2 minutes ago</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-white/80 text-sm">New clip generated</p>
                        <p className="text-white/40 text-xs">5 minutes ago</p>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </AnimatedContainer>

            {/* Enhanced Theme Toggle */}
            <AnimatedContainer animation="bounceIn" delay={500} trigger="mount">
              <button
                onClick={() => setShowThemeDropdown((v) => !v)}
                className="glass-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                aria-label="Theme menu"
              >
                <Icon icon={SunIcon} size={24} className="text-white/70 hover:text-white transition-colors" />
              </button>
              {showThemeDropdown &&
                ReactDOM.createPortal(
                  <div ref={themeDropdownRef} className="absolute top-[70px] right-20 z-[60]">
                    <ThemeSelector compact />
                  </div>,
                  document.body
                )}
            </AnimatedContainer>

            {/* Enhanced User Menu */}
            <AnimatedContainer animation="bounceIn" delay={600} trigger="mount">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="glass-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                aria-label="User menu"
              >
                <Icon icon={UserIcon} size={24} className="text-white/70 hover:text-white transition-colors" />
              </button>
              {showUserMenu &&
                ReactDOM.createPortal(
                  <div ref={userMenuRef} className="absolute top-[70px] right-4 glass-prism rounded-lg p-2 min-w-[200px] z-[60]">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-white font-medium">John Doe</p>
                      <p className="text-white/60 text-sm">john@example.com</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                        onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                      >
                        <Icon icon={SettingsIcon} size={16} />
                        Settings
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300">
                        <Icon icon={LogOutIcon} size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </AnimatedContainer>

            {/* Mobile Menu Toggle */}
            <AnimatedContainer animation="bounceIn" delay={700} trigger="mount" className="lg:hidden">
              <button
                onClick={onToggleSidebar}
                className="glass-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <Icon icon={XIcon} size={24} className="text-white/70 hover:text-white transition-colors" />
                ) : (
                  <Icon icon={MenuIcon} size={24} className="text-white/70 hover:text-white transition-colors" />
                )}
              </button>
            </AnimatedContainer>
          </div>
        </div>
      </header>

      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto animate-slide-in-down"
          style={{
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {searchResults.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSearchResultClick(project.id)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-b-0 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="font-medium text-white">{project.name}</div>
              <div className="text-sm text-subtle mt-1">
                {project.clips?.length || 0} clips •{' '}
                {new Date(project.createdAt || project.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </AnimatedContainer>
  );
};

export default Header;
