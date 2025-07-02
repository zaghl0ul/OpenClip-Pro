import React from 'react';

const DashboardSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-2xl p-8 glass-card rounded-xl shadow-lg animate-pulse">
      <div className="h-8 bg-white/10 rounded w-1/2 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="h-20 bg-white/10 rounded" />
        <div className="h-20 bg-white/10 rounded" />
        <div className="h-20 bg-white/10 rounded" />
        <div className="h-20 bg-white/10 rounded" />
      </div>
      <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
      <div className="h-12 bg-white/10 rounded mb-2" />
      <div className="h-12 bg-white/10 rounded mb-2" />
      <div className="h-12 bg-white/10 rounded" />
    </div>
  </div>
);

export default DashboardSkeleton; 