import { useState, useRef, useMemo, useCallback } from 'react';
import { 
  FileText, Link as LinkIcon, Trash2, Download, ExternalLink, 
  Upload, Plus, X, Search, Filter, File, FileSpreadsheet, 
  FileArchive
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { validateFile, validateURL, validateTitle } from '../utils/validation';
import ResourceSummaryBadge from './ResourceSummaryBadge';

/**
 * ResourceHub Component
 * Minimal, clean resource management for groups
 * Supports file uploads and link sharing
 */
export default function ResourceHub({ groupId, isAdmin, currentUserId, resources, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [resourceType, setResourceType] = useState('file'); // 'file' or 'link'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    url: '',
    tags: '',
    description: '',
    file: null
  });

  // Get all unique tags
  const allTags = useMemo(() =>
    [...new Set(resources?.flatMap(r => r.tags || []))],
    [resources]
  );

  // Filter resources
  const filteredResources = useMemo(() =>
    (resources || []).filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !filterTag || r.tags?.includes(filterTag);
      return matchesSearch && matchesTag;
    }),
    [resources, searchQuery, filterTag]
  );

  // Local summary updates (without full re-fetch)
  const [localSummaries, setLocalSummaries] = useState({});
  const handleSummaryGenerated = useCallback((resourceId, newSummary) => {
    setLocalSummaries(prev => ({ ...prev, [resourceId]: newSummary }));
  }, []);

  // Get file icon
  const getFileIcon = useCallback((fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const iconProps = { size: 20, className: 'text-slate-400' };
    switch (ext) {
      case 'pdf': return <FileText {...iconProps} className='text-red-500' />;
      case 'doc': case 'docx': return <FileText {...iconProps} className='text-blue-500' />;
      case 'xls': case 'xlsx': return <FileSpreadsheet {...iconProps} className='text-green-500' />;
      case 'ppt': case 'pptx': return <FileText {...iconProps} className='text-orange-500' />;
      case 'zip': case 'rar': return <FileArchive {...iconProps} className='text-purple-500' />;
      default: return <File {...iconProps} />;
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate title
    const titleValidation = validateTitle(form.title);
    if (!titleValidation.valid) {
      toast.error(titleValidation.error);
      return;
    }

    if (resourceType === 'file') {
      if (!form.file) {
        toast.error('Please select a file');
        return;
      }
      
      // Validate file
      const fileValidation = validateFile(form.file);
      if (!fileValidation.valid) {
        toast.error(fileValidation.error);
        return;
      }
    } else {
      // Validate URL
      if (!form.url.trim()) {
        toast.error('URL is required');
        return;
      }
      
      const urlValidation = validateURL(form.url);
      if (!urlValidation.valid) {
        toast.error(urlValidation.error);
        return;
      }
    }

    try {
      setUploading(true);
      const formData = new FormData();
      
      // Add text fields first for more reliable parsing by Multer
      formData.append('id', groupId); 
      formData.append('type', resourceType);
      formData.append('title', form.title);
      formData.append('tags', form.tags);
      formData.append('description', form.description);
      
      if (resourceType === 'file') {
        formData.append('file', form.file);
      } else {
        formData.append('url', form.url);
      }

      await api.post('/resources/upload', formData);

      toast.success(`Resource ${resourceType === 'file' ? 'uploaded' : 'added'} successfully!`);

      setShowModal(false);
      setForm({ title: '', url: '', tags: '', description: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      onUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save resource');
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/resources/${resourceId}`);
      toast.success('Resource deleted');
      onUpdate?.();
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  // Handle download
  const handleDownload = async (resourceId) => {
    try {
      const { data } = await api.get(`/resources/${resourceId}/download`);
      const { downloadUrl } = data;
      window.location.assign(downloadUrl);
    } catch  {
      toast.error('Download failed');
    }
  };


  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Resources</h2>
        <button
          onClick={() => {
            setResourceType('file');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Upload size={16} /> Upload
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">All Tags</option>
            {allTags.map((tag, i) => (
              <option key={i} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <FileText size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No resources yet</p>
          <p className="text-slate-400 text-sm">Upload files or add links to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource._id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1 flex-shrink-0">
                    {resource.type === 'file' ? (
                      getFileIcon(resource.url)
                    ) : (
                      <LinkIcon size={20} className="text-indigo-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 break-words">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary Badge — below title, above tags */}
              <ResourceSummaryBadge
                groupId={groupId}
                resourceId={resource._id}
                resourceType={resource.type}
                existingSummary={localSummaries[resource._id] ?? resource.aiSummary}
                resourceTitle={resource.title}
                resourceUrl={resource.url}
                onSummaryGenerated={(newSummary) => handleSummaryGenerated(resource._id, newSummary)}
              />

              {/* Tags */}
              {resource.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {resource.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer with Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  {resource.type === 'file' ? 'File' : 'Link'}
                </span>
                <div className="flex items-center gap-1">
                  {resource.type === 'file' ? (
                    <button
                      onClick={() => handleDownload(resource._id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  ) : (

                    <a
                      href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Open Link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {(isAdmin || resource.uploadedBy?._id === currentUserId) && (
                    <button
                      onClick={() => handleDelete(resource._id)}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">
                {resourceType === 'file' ? '📤 Upload File' : '🔗 Add Link'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Selector */}
            <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
              <button
                onClick={() => setResourceType('file')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  resourceType === 'file'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                File
              </button>
              <button
                onClick={() => setResourceType('link')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  resourceType === 'link'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Link
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lecture Notes - Week 5"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* File/URL Input */}
              {resourceType === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    File <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      id="file-input"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })}
                    />
                    <label
                      htmlFor="file-input"
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                    <span className="text-sm text-slate-500">
                      {form.file?.name || 'No file selected'}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., notes, exam, important"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Add any notes or details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {uploading ? 'Saving...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
