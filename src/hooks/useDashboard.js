import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../stores/projectStore';
import toast from 'react-hot-toast';

export const useDashboard = () => {
  const navigate = useNavigate();
  const { projects, getRecentProjects, getProjectStats, createProject } = useProjectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const recentProjects = getRecentProjects(6);
  const stats = getProjectStats();

  // Safety check to ensure projects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];

  const handleCreateProject = async (projectData) => {
    setLoading(true);
    try {
      const project = await createProject(projectData);
      setShowCreateModal(false);
      toast.success('Project created successfully!');
      navigate(`/projects/${project.id}`);
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(`Failed to create project: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Filter projects by search query (case-insensitive)
  const filteredProjects = safeProjects.filter(
    (project) =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);

  const navigateToProject = (projectId) => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      console.error('Invalid project ID for navigation');
    }
  };

  const recentActivity = safeProjects
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5)
    .map((project) => ({
      id: project.id,
      name: project.name,
      action:
        project.status === 'analyzing'
          ? 'is being analyzed'
          : project.status === 'completed'
            ? 'was completed'
            : 'was updated',
      timestamp: project.updated_at || project.created_at,
      type: 'project',
    }));

  return {
    // State
    showCreateModal,
    searchQuery,
    setSearchQuery,
    loading,

    // Data
    recentProjects,
    stats,
    filteredProjects,
    recentActivity,

    // Handlers
    handleCreateProject,
    openCreateModal,
    closeCreateModal,
    navigateToProject,
  };
};
