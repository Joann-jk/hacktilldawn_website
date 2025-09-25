import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ProjectsGallery() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Use different API URL for development vs production
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/projects' 
        : '/projects.json';
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ProjectCard = ({ project, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 group"
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
            {project.name}
          </h3>
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">
              Team: <span className="text-cyan-400 font-medium">{project.teamName || 'Unknown Team'}</span>
            </p>
            <p className="text-slate-400 text-sm">
              Members: <span className="text-cyan-400 font-medium">{project.teamMembers || 'Unknown'}</span>
            </p>
            <p className="text-slate-500 text-xs">
              Submitted by: <span className="text-slate-400">{project.sender}</span>
            </p>
          </div>
        </div>
        <div className="text-slate-500 text-xs">
          {formatDate(project.timestamp)}
        </div>
      </div>

      {/* Project Description */}
      <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3">
        {project.description}
      </p>

      {/* Project URL */}
      <div className="mb-4">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Project
        </a>
      </div>

      {/* Reactions and Replies */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        {/* Reactions */}
        <div className="flex items-center space-x-2">
          {Object.entries(project.reactionCounts || {}).map(([emoji, count]) => (
            <div
              key={emoji}
              className="flex items-center space-x-1 bg-slate-800/50 px-2 py-1 rounded-full"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-slate-300 text-xs">{count}</span>
            </div>
          ))}
          {project.totalReactions > 0 && (
            <span className="text-slate-500 text-xs">
              {project.totalReactions} reaction{project.totalReactions !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Replies */}
        <div className="flex items-center space-x-2">
          {project.totalReplies > 0 && (
            <div className="flex items-center space-x-1 text-slate-400 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{project.totalReplies} repl{project.totalReplies !== 1 ? 'ies' : 'y'}</span>
            </div>
          )}
        </div>
      </div>

      {/* View Details Button */}
      <button
        onClick={() => setSelectedProject(project)}
        className="w-full mt-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300"
      >
        View Details & Feedback
      </button>
    </motion.div>
  );

  const ProjectModal = ({ project, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-2xl font-bold text-white">{project.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Project Info */}
          <div className="mb-6">
            <p className="text-slate-300 leading-relaxed mb-4">{project.description}</p>
            
            {/* Team Information */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold mb-2">Team Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Team Name:</span>
                  <span className="text-cyan-400 font-medium ml-2">{project.teamName || 'Unknown Team'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Team Members:</span>
                  <span className="text-cyan-400 font-medium ml-2">{project.teamMembers || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Submitted by:</span>
                  <span className="text-slate-300 ml-2">{project.sender}</span>
                </div>
                <div>
                  <span className="text-slate-400">Submitted on:</span>
                  <span className="text-slate-300 ml-2">{formatDate(project.timestamp)}</span>
                </div>
              </div>
            </div>
            
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Project
            </a>
          </div>

          {/* Reactions */}
          {project.reactions && project.reactions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Reactions</h3>
              <div className="space-y-2">
                {project.reactions.map((reaction, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="text-lg">{reaction.emoji}</span>
                    <span className="text-slate-300">{reaction.sender}</span>
                    <span className="text-slate-500 text-xs">{formatDate(reaction.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replies */}
          {project.replies && project.replies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Comments & Feedback</h3>
              <div className="space-y-3">
                {project.replies.map((reply, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-400 font-medium text-sm">{reply.sender}</span>
                      <span className="text-slate-500 text-xs">{formatDate(reply.timestamp)}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{reply.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No feedback message */}
          {(!project.reactions || project.reactions.length === 0) && 
           (!project.replies || project.replies.length === 0) && (
            <div className="text-center py-8">
              <div className="text-slate-500 text-sm">
                No reactions or comments yet. Be the first to react or comment on this project!
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <section className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Failed to load projects</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchProjects}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            style={{ fontFamily: "Orbitron, sans-serif" }} 
            className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent"
          >
            Submitted Projects
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 mx-auto mb-4 rounded-full shadow-lg shadow-blue-500/30"></div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Check out the amazing projects submitted by our participants and show your support with reactions and feedback!
          </p>
          {projects.length > 0 && (
            <div className="mt-4 text-slate-500 text-sm">
              {projects.length} project{projects.length !== 1 ? 's' : ''} submitted
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.messageId || index} project={project} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects submitted yet</h3>
            <p className="text-slate-400">
              Projects will appear here once participants start submitting their work!
            </p>
          </div>
        )}

        {/* Project Modal */}
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </div>
    </section>
  );
}
