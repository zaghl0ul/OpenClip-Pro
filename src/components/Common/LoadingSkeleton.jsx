import React from 'react'
import { motion } from 'framer-motion'

// Base skeleton component
const SkeletonBase = ({ className = '', children, animate = true }) => {
  const baseClasses = "bg-gray-700 rounded animate-pulse"
  
  if (!animate) {
    return <div className={`${baseClasses} ${className}`}>{children}</div>
  }

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

// Text skeleton
export const TextSkeleton = ({ lines = 1, className = "" }) => {
  if (lines === 1) {
    return <SkeletonBase className={`h-4 ${className}`} />
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <SkeletonBase 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  )
}

// Card skeleton
export const CardSkeleton = ({ className = "" }) => (
  <div className={`glass-card p-6 ${className}`}>
    <div className="space-y-4">
      <SkeletonBase className="h-6 w-3/4" />
      <TextSkeleton lines={3} />
      <div className="flex space-x-2">
        <SkeletonBase className="h-8 w-20" />
        <SkeletonBase className="h-8 w-16" />
      </div>
    </div>
  </div>
)

// Project card skeleton
export const ProjectCardSkeleton = ({ className = "" }) => (
  <div className={`glass-card overflow-hidden ${className}`}>
    {/* Thumbnail */}
    <SkeletonBase className="h-48 w-full rounded-none" />
    
    {/* Content */}
    <div className="p-4 space-y-3">
      <SkeletonBase className="h-6 w-4/5" />
      <TextSkeleton lines={2} />
      <div className="flex justify-between items-center">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-4 w-16" />
      </div>
    </div>
  </div>
)

// Stats card skeleton
export const StatsCardSkeleton = ({ className = "" }) => (
  <div className={`glass-card p-6 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-20" />
        <SkeletonBase className="h-8 w-12" />
      </div>
      <SkeletonBase className="h-8 w-8 rounded-full" />
    </div>
  </div>
)

// Video player skeleton
export const VideoPlayerSkeleton = ({ className = "" }) => (
  <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
    <SkeletonBase className="w-full aspect-video rounded-none" />
    
    {/* Controls overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50">
      <div className="flex items-center space-x-4">
        <SkeletonBase className="h-8 w-8 rounded-full" />
        <SkeletonBase className="h-2 flex-1" />
        <SkeletonBase className="h-6 w-12" />
      </div>
    </div>
  </div>
)

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4, className = "" }) => (
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
)

// List skeleton
export const ListSkeleton = ({ items = 5, className = "" }) => (
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
)

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
)

// Projects grid skeleton
export const ProjectsGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
)

// Page skeleton wrapper
export const PageSkeleton = ({ children, loading = true }) => {
  if (!loading) return children
  
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}

// Form skeleton
export const FormSkeleton = ({ fields = 3, className = "" }) => (
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
)

// Modal skeleton
export const ModalSkeleton = ({ className = "" }) => (
  <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 ${className}`}>
    <div className="glass-card p-6 w-full max-w-md">
      <div className="space-y-4">
        <SkeletonBase className="h-6 w-3/4" />
        <FormSkeleton fields={2} />
      </div>
    </div>
  </div>
)

export default {
  TextSkeleton,
  CardSkeleton,
  ProjectCardSkeleton,
  StatsCardSkeleton,
  VideoPlayerSkeleton,
  TableSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  ProjectsGridSkeleton,
  PageSkeleton,
  FormSkeleton,
  ModalSkeleton
} 