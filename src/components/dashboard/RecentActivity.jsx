import React, { useState, useEffect } from 'react';
import { Clock, FileText, Video, Upload, Edit3, Share2, Sparkles, Download } from 'lucide-react';
import apiClient from '../../utils/apiClient';

const getActivityIcon = (type) => {
  switch (type) {
    case 'upload':
      return Upload;
    case 'edit':
      return Edit3;
    case 'share':
      return Share2;
    case 'video':
      return Video;
    case 'analysis':
      return Sparkles;
    case 'export':
      return Download;
    default:
      return FileText;
  }
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return time.toLocaleDateString();
};

const RecentActivity = ({ limit = 10 }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecentActivity();
  }, [limit]);

  const loadRecentActivity = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get recent projects and derive activities from them
      const projects = await apiClient.getProjects();

      // Convert projects to activity items
      const activityItems = [];

      projects.forEach((project) => {
        // Project creation
        activityItems.push({
          id: `create_${project.id}`,
          type: 'upload',
          title: 'Created new project',
          description: project.name,
          time: project.created_at,
          projectId: project.id,
        });

        // Video upload (if different from creation)
        if (project.video_data && project.updated_at !== project.created_at) {
          activityItems.push({
            id: `video_${project.id}`,
            type: 'video',
            title: 'Uploaded video',
            description: `${project.name} - ${project.video_data.filename || 'video file'}`,
            time: project.updated_at,
            projectId: project.id,
          });
        }

        // Analysis completion
        if (project.status === 'completed' && project.clips && project.clips.length > 0) {
          activityItems.push({
            id: `analysis_${project.id}`,
            type: 'analysis',
            title: 'Analysis completed',
            description: `${project.name} - Generated ${project.clips.length} clip${project.clips.length > 1 ? 's' : ''}`,
            time: project.updated_at,
            projectId: project.id,
          });
        }

        // Clip exports
        if (project.clips) {
          project.clips.forEach((clip) => {
            if (clip.is_exported && clip.exported_at) {
              activityItems.push({
                id: `export_${clip.id}`,
                type: 'export',
                title: 'Exported clip',
                description: `${clip.title} from ${project.name}`,
                time: clip.exported_at,
                projectId: project.id,
                clipId: clip.id,
              });
            }
          });
        }
      });

      // Sort by time (most recent first) and limit
      const sortedActivities = activityItems
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, limit);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-600 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h3>
        <div className="text-center py-4">
          <p className="text-gray-400 mb-2">Failed to load activity</p>
          <button
            onClick={loadRecentActivity}
            className="text-primary hover:text-primary-hover text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Recent Activity</h3>
        <button onClick={loadRecentActivity} className="text-gray-400 hover:text-gray-300 text-sm">
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No recent activity</p>
          <p className="text-gray-500 text-sm">
            Start by creating a new project to see activity here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (activity.projectId) {
                    window.location.href = `/projects/${activity.projectId}`;
                  }
                }}
              >
                <div
                  className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${
                    activity.type === 'upload'
                      ? 'bg-blue-500/20 text-blue-400'
                      : activity.type === 'video'
                        ? 'bg-purple-500/20 text-purple-400'
                        : activity.type === 'analysis'
                          ? 'bg-green-500/20 text-green-400'
                          : activity.type === 'export'
                            ? 'bg-orange-500/20 text-orange-400'
                            : activity.type === 'edit'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                  }
                `}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{activity.title}</p>
                  <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                </div>

                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(activity.time)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
