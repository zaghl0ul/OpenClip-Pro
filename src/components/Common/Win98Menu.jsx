import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Folder,
  Settings,
  TrendingUp,
  Play,
  Scissors,
  Download,
  Zap,
  Clock,
  Star,
  ChevronRight,
  Plus,
} from 'lucide-react';
import useProjectStore from '../../stores/projectStore';

const Win98Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, getRecentProjects } = useProjectStore();

  const recentProjects = getRecentProjects ? getRecentProjects(5) : [];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const mainMenuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
    },
    {
      label: 'Projects',
      icon: Folder,
      path: '/projects',
      submenu: [
        { label: 'All Projects', path: '/projects', icon: Folder },
        { label: 'New Project', path: '/projects?create=true', icon: Plus },
        ...(recentProjects.length > 0
          ? [
              { separator: true },
              { label: 'Recent Projects', isHeader: true },
              ...recentProjects.map((project) => ({
                label: project.name,
                path: `/projects/${project.id}`,
                icon: Play,
              })),
            ]
          : []),
      ],
    },
    {
      label: 'Clips',
      icon: Play,
      path: '/clips',
    },
    {
      label: 'Tools',
      icon: Zap,
      submenu: [
        { label: 'Quick Analyze', icon: Play, action: 'analyze' },
        { label: 'Trim Clips', icon: Scissors, action: 'trim' },
        { label: 'Export', icon: Download, action: 'export' },
      ],
    },
    { separator: true },
    {
      label: 'Analytics',
      icon: TrendingUp,
      path: '/analytics',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  const handleMenuClick = (item) => {
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.label ? null : item.label);
    } else if (item.path) {
      navigate(item.path);
      setIsOpen(false);
      setActiveSubmenu(null);
    } else if (item.action) {
      // Handle tool actions
      handleToolAction(item.action);
    }
  };

  const handleToolAction = (action) => {
    // Simplified tool actions for demo
    switch (action) {
      case 'analyze':
        navigate('/projects?filter=unanalyzed');
        break;
      case 'trim':
        navigate('/clips?mode=trim');
        break;
      case 'export':
        navigate('/projects?filter=completed');
        break;
    }
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const renderMenuItem = (item, index) => {
    if (item.separator) {
      return <div key={`separator-${index}`} className="win98-menu-separator" />;
    }

    if (item.isHeader) {
      return (
        <div key={item.label} className="win98-menu-header">
          {item.label}
        </div>
      );
    }

    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    return (
      <div key={item.label} className="relative">
        <button
          className={`win98-menu-item ${isActive ? 'active' : ''}`}
          onClick={() => handleMenuClick(item)}
          onMouseEnter={() => hasSubmenu && setActiveSubmenu(item.label)}
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span>{item.label}</span>
          {hasSubmenu && <ChevronRight className="w-3 h-3 ml-auto" />}
        </button>

        {/* Submenu */}
        {hasSubmenu && activeSubmenu === item.label && (
          <div className="win98-submenu">
            {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="win98-menu-container" ref={menuRef}>
      <button className="win98-menu-button win98-logo-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="win98-logo-icon">
          <span className="win98-logo-text">OC</span>
        </div>
        <span className="win98-logo-name">OpenClip</span>
      </button>

      {isOpen && (
        <div className="win98-menu-dropdown">
          {mainMenuItems.map((item, index) => renderMenuItem(item, index))}
        </div>
      )}
    </div>
  );
};

export default Win98Menu;
