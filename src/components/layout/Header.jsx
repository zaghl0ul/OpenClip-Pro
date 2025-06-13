import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  Settings,
  Bell,
  User,
  Menu,
  X,
  Home,
  Folder,
  Plus
} from 'lucide-react'
import useProjectStore from '../../stores/projectStore'

const Header = ({ onMenuClick }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { projects, searchProjects } = useProjectStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = searchProjects ? searchProjects(query) : []
      setSearchResults(results)
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }
  
  const handleSearchResultClick = (projectId) => {
    navigate(`/projects/${projectId}`)
    setShowSearchResults(false)
    setSearchQuery('')
  }
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: Folder },
    { path: '/settings', label: 'Settings', icon: Settings }
  ]
  
  return (
    <header className="glass fixed top-0 left-0 right-0 z-50 border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Menu button for sidebar */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-subtle hover:text-secondary hover:bg-surface transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>
            
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-white hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">OC</span>
              </div>
              <span className="hidden sm:block">OpenClip</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-8">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-background'
                        : 'text-subtle hover:text-secondary hover:bg-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
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
                className="input w-full pl-10"
              />
            </div>
            
            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 glass border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {searchResults.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleSearchResultClick(project.id)}
                    className="w-full px-4 py-3 text-left hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="font-medium text-white">{project.name}</div>
                    <div className="text-sm text-subtle mt-1">
                      {project.clips?.length || 0} clips • {new Date(project.createdAt || project.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Quick Create Button */}
            <button
              onClick={() => navigate('/projects?create=true')}
              className="btn btn-primary btn-sm hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-subtle hover:text-secondary hover:bg-surface transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </button>
            
            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Notifications */}
              <button
                className="p-2 rounded-lg text-subtle hover:text-secondary hover:bg-surface transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
              </button>
              
              {/* Settings */}
              <Link
                to="/settings"
                className="p-2 rounded-lg text-subtle hover:text-secondary hover:bg-surface transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-2 rounded-lg text-subtle hover:text-secondary hover:bg-surface transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-secondary">
                    Creator
                  </span>
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
          className="lg:hidden border-t border-border glass"
        >
          <nav className="px-4 py-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-background'
                      : 'text-subtle hover:text-secondary hover:bg-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            
            {/* Mobile Quick Create */}
            <button
              onClick={() => {
                navigate('/projects?create=true')
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-subtle hover:text-secondary hover:bg-surface transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </nav>
        </motion.div>
      )}
    </header>
  )
}

export default Header