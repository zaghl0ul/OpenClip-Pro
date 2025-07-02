import React from 'react';

// Base skeleton component with enhanced animations
const SkeletonBase = ({ className = '', children, animate = true, delay = 0 }) => {
  const baseClasses = 'bg-white/10 rounded animate-pulse';

  if (!animate) {
    return <div className={`${baseClasses} ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Enhanced text skeleton with staggered animation
export const TextSkeleton = ({ lines = 1, className = '' }) => {
  if (lines === 1) {
    return <SkeletonBase className={`h-4 ${className}`} />;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <SkeletonBase 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          delay={i * 100}
        />
      ))}
    </div>
  );
};

// Enhanced card skeleton with glassmorphism
export const CardSkeleton = ({ className = '' }) => (
  <div className={`glass-card p-6 ${className}`}>
    <div className="space-y-4">
      <SkeletonBase className="h-6 w-3/4" />
      <TextSkeleton lines={3} />
      <div className="flex space-x-2">
        <SkeletonBase className="h-8 w-20" delay={300} />
        <SkeletonBase className="h-8 w-16" delay={400} />
      </div>
    </div>
  </div>
);

// Enhanced project card skeleton
export const ProjectCardSkeleton = ({ className = '' }) => (
  <div className={`glass-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300 ${className}`}>
    {/* Thumbnail with shimmer effect */}
    <div className="relative h-48 w-full overflow-hidden">
      <SkeletonBase className="h-full w-full rounded-none" />
      <div className="absolute inset-0 loading-shimmer"></div>
    </div>

    {/* Content with staggered animation */}
    <div className="p-4 space-y-3">
      <SkeletonBase className="h-6 w-4/5" delay={100} />
      <TextSkeleton lines={2} />
      <div className="flex justify-between items-center">
        <SkeletonBase className="h-4 w-24" delay={400} />
        <SkeletonBase className="h-4 w-16" delay={500} />
      </div>
    </div>
  </div>
);

// Enhanced stats card skeleton with pulse effect
export const StatsCardSkeleton = ({ className = '' }) => (
  <div className={`glass-card p-6 group hover:scale-105 transition-all duration-300 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-20" delay={100} />
        <SkeletonBase className="h-8 w-12" delay={200} />
      </div>
      <div className="relative">
        <SkeletonBase className="h-8 w-8 rounded-full" delay={300} />
        <div size={32} className="absolute inset-0 w-8 h-8 border-2 border-white/20 border-t-white/40 rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
);

// Enhanced video player skeleton with controls
export const VideoPlayerSkeleton = ({ className = '' }) => (
  <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
    <div className="relative w-full aspect-video">
      <SkeletonBase className="w-full h-full rounded-none" />
      <div className="absolute inset-0 loading-shimmer"></div>
    </div>

    {/* Enhanced controls overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <SkeletonBase className="h-8 w-8 rounded-full" delay={100} />
        <div className="flex-1 relative">
          <SkeletonBase className="h-2 w-full" delay={200} />
          <div className="absolute top-0 left-0 h-2 bg-indigo-500/50 rounded animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <SkeletonBase className="h-6 w-12" delay={300} />
      </div>
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {[...Array(columns)].map((_, i) => (
        <SkeletonBase key={i} className="h-6 flex-1" />
      ))}
    </div>

    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {[...Array(columns)].map((_, colIndex) => (
          <SkeletonBase key={colIndex} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// List skeleton
export const ListSkeleton = ({ items = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-3/4" />
          <SkeletonBase className="h-3 w-1/2" />
        </div>
        <SkeletonBase className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="min-h-screen p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8">
        <SkeletonBase className="h-8 w-64 mb-2" />
        <SkeletonBase className="h-6 w-96" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

// Projects grid skeleton
export const ProjectsGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
);

// Page skeleton wrapper
export const PageSkeleton = ({ children, loading = true }) => {
  if (!loading) return children;

  return <div className="min-h-screen bg-background">{children}</div>;
};

// Form skeleton
export const FormSkeleton = ({ fields = 3, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-4">
      <SkeletonBase className="h-10 w-24" />
      <SkeletonBase className="h-10 w-20" />
    </div>
  </div>
);

// Modal skeleton
export const ModalSkeleton = ({ className = '' }) => (
  <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 ${className}`}>
    <div className="glass-card p-6 w-full max-w-md">
      <div className="space-y-4">
        <SkeletonBase className="h-6 w-3/4" />
        <FormSkeleton fields={2} />
      </div>
    </div>
  </div>
);

const LoadingSkeleton = ({ 
  type = 'card', 
  lines = 3, 
  className = '',
  animate = true 
}) => {
  const baseClasses = `loading-shimmer ${animate ? 'animate-pulse' : ''} ${className}`;

  const renderCard = () => (
    <div className={`glass-card p-6 rounded-xl ${baseClasses}`}>
      <div className="flex items-center gap-4 mb-4">
        <div size={48} className="w-12 h-12 bg-white/10 rounded-lg animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={`h-3 bg-white/10 rounded animate-pulse`}
            style={{ 
              width: `${Math.random() * 40 + 60}%`,
              animationDelay: `${i * 100}ms`
            }}
          ></div>
        ))}
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={`glass-minimal p-4 rounded-lg ${baseClasses}`}
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse"></div>
              <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse"></div>
            </div>
            <div className="w-16 h-6 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={`glass-card p-4 rounded-lg ${baseClasses}`}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="aspect-video bg-white/10 rounded-lg mb-3 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className={`glass-card rounded-xl overflow-hidden ${baseClasses}`}>
      <div className="p-4 border-b border-white/10">
        <div className="h-6 bg-white/10 rounded w-1/3 animate-pulse"></div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className="flex items-center gap-4 py-2"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div size={32} className="w-8 h-8 bg-white/10 rounded animate-pulse"></div>
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse"></div>
              <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="w-20 h-6 bg-white/10 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div size={48} className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
        <div size={48} className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="glass-card p-6 rounded-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-16 animate-pulse"></div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"
            style={{ width: '60%' }}
          ></div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <div size={12} className="w-3 h-3 bg-indigo-500/50 rounded-full animate-pulse"></div>
          <span>Processing...</span>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'list':
      return renderList();
    case 'grid':
      return renderGrid();
    case 'table':
      return renderTable();
    case 'spinner':
      return renderSpinner();
    case 'progress':
      return renderProgress();
    case 'card':
    default:
      return renderCard();
  }
};

export default LoadingSkeleton;
