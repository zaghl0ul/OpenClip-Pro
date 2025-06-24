import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Settings, Bell, User, Menu, X, Home, Folder, Plus } from 'lucide-react';
import useProjectStore from '../../stores/projectStore';
import ThemeSelector from '../Common/ThemeSelector';
import Win98Menu from '../Common/Win98Menu';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, searchProjects } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: Folder },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Enhanced glass effect styling
  const glassStyle = {
    background: 'rgba(13, 17, 23, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={glassStyle}>
      {/* Reflective top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Menu button for sidebar (hidden in retro theme) */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-subtle hover:text-white hover:bg-white/10 transition-all theme-retro:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo with integrated Win98 Menu */}
            <div className="flex items-center gap-2">
              {/* Windows 98 Menu integrated into logo (only visible in retro theme) */}
              <Win98Menu />

              {/* Regular Logo (hidden in retro theme) */}
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-bold text-white hover:text-primary transition-colors theme-retro:hidden"
              >
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent"></div>
                  <div className="absolute top-0 left-0 right-0 h-px bg-white/20"></div>
                  <div className="absolute top-0 bottom-0 left-0 w-px bg-white/20"></div>
                  <span className="text-primary font-bold text-sm relative z-10">OC</span>
                </div>
                <span className="hidden sm:block">OpenClip</span>
              </Link>
            </div>

            {/* Desktop Navigation (hidden in retro theme) */}
            <nav className="hidden lg:flex items-center gap-1 ml-8 theme-retro:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/20 text-white'
                        : 'text-subtle hover:text-white hover:bg-white/5'
                    } relative overflow-hidden`}
                  >
                    {/* Subtle gradient for active items */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
                    )}

                    {/* Top reflective edge for active items */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-primary/30"></div>
                    )}

                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-lg mx-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
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
              </motion.div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Quick Create Button (hidden in retro theme) */}
            <button
              onClick={() => navigate('/projects?create=true')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-sm font-medium text-white transition-all relative overflow-hidden group theme-retro:hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-white/30"></div>
              <Plus className="w-4 h-4 text-primary" />
              <span className="relative">New Project</span>
            </button>

            {/* Mobile menu toggle (hidden in retro theme) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-subtle hover:text-white hover:bg-white/10 transition-all theme-retro:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </button>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Theme Selector - Compact Mode */}
              <ThemeSelector compact />

              {/* Notifications (hidden in retro theme) */}
              <button className="p-2 rounded-lg text-subtle hover:text-white hover:bg-white/10 transition-all relative theme-retro:hidden">
                <Bell className="w-5 h-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
              </button>

              {/* Settings (hidden in retro theme) */}
              <Link
                to="/settings"
                className="p-2 rounded-lg text-subtle hover:text-white hover:bg-white/10 transition-all theme-retro:hidden"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* User Menu (hidden in retro theme) */}
              <div className="relative theme-retro:hidden">
                <button className="flex items-center gap-2 p-2 rounded-lg text-subtle hover:text-white hover:bg-white/10 transition-all">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/20"></div>
                    <User className="w-4 h-4 text-primary relative z-10" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-white">Creator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden border-t border-white/10"
          style={{
            background: 'rgba(13, 17, 23, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/20 text-white'
                      : 'text-subtle hover:text-white hover:bg-white/5'
                  } relative overflow-hidden`}
                >
                  {/* Subtle gradient for active items */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
                  )}

                  {/* Top reflective edge for active items */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-primary/30"></div>
                  )}

                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Quick Create */}
            <button
              onClick={() => {
                navigate('/projects?create=true');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-subtle hover:text-white hover:bg-white/5 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </nav>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
