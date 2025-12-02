import { useState, useEffect } from 'react';
import type { JobPosting } from '../types';
import { JobPostingStorage } from '../services/storage';

export function JobList({ onSelectJob }: { onSelectJob: (job: JobPosting) => void }) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const allJobs = await JobPostingStorage.list();
      setJobs(allJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this job posting?')) return;

    try {
      await JobPostingStorage.delete(id);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (error) {
      alert('Failed to delete job posting');
    }
  };

  if (loading) {
    return <div className="p-4">Loading jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500 mb-4">No saved jobs yet.</p>
        <p className="text-sm text-gray-400">Add a job posting to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Saved Jobs ({jobs.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map(job => (
          <div
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{job.jobTitle}</h3>
              <button
                onClick={(e) => handleDelete(job.id, e)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
            <p className="text-gray-600 mb-2">{job.companyName}</p>
            <div className="flex gap-2 text-sm text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">{job.positionType}</span>
              <span className="px-2 py-1 bg-gray-100 rounded">{job.language.toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Added {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
