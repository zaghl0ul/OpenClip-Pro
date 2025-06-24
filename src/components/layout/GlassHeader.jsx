import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, Bell, User, Upload, Plus, Zap, Settings, HelpCircle } from 'lucide-react';

const GlassHeader = ({ onMenuClick }) => {
  return (
    <motion.header
      className="glass-frosted fixed top-4 left-4 right-4 rounded-2xl p-4 z-40 gpu-accelerated"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              onClick={onMenuClick}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5" />
            </motion.button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 glass-frosted rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-300" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">VideoForge</span>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search projects, clips, or keywords..."
                className="w-full glass-frosted rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/40 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
              />
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <button className="glass-frosted px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2 hidden sm:flex">
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Upload</span>
            </button>

            <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-4 py-2 rounded-xl text-white transition-colors flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">New Project</span>
            </button>

            {/* Notification Button */}
            <button className="relative glass-frosted rounded-xl p-2.5 text-white hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* Settings Button */}
            <button className="glass-frosted rounded-xl p-2.5 text-white hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Help Button */}
            <button className="glass-frosted rounded-xl p-2.5 text-white hover:bg-white/10 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <button className="flex items-center gap-3 glass-frosted rounded-xl p-2 hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-sm font-medium text-white">Creator</p>
                <p className="text-xs text-white/60">Professional</p>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4 pt-4 border-t border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full glass-frosted rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/40 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default GlassHeader;
