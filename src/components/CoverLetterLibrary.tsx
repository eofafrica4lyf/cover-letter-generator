import { useState, useEffect } from 'react';
import type { CoverLetter, PositionType } from '../types';
import { CoverLetterStorage } from '../services/storage';

export function CoverLetterLibrary() {
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [filteredLetters, setFilteredLetters] = useState<CoverLetter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionType | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLetters();
  }, []);

  useEffect(() => {
    filterLetters();
  }, [searchQuery, positionFilter, letters]);

  const loadLetters = async () => {
    try {
      const allLetters = await CoverLetterStorage.list();
      setLetters(allLetters);
      setFilteredLetters(allLetters);
    } catch (error) {
      console.error('Failed to load cover letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLetters = () => {
    // Group letters by jobPostingId and keep only the latest one per job
    const latestLettersMap = new Map<string, CoverLetter>();
    
    letters.forEach(letter => {
      const existing = latestLettersMap.get(letter.jobPostingId);
      if (!existing || new Date(letter.metadata.generatedAt) > new Date(existing.metadata.generatedAt)) {
        latestLettersMap.set(letter.jobPostingId, letter);
      }
    });

    let filtered = Array.from(latestLettersMap.values());

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(letter =>
        letter.metadata.jobTitle.toLowerCase().includes(query) ||
        letter.metadata.companyName.toLowerCase().includes(query)
      );
    }

    // Position type filter
    if (positionFilter) {
      filtered = filtered.filter(letter =>
        letter.metadata.positionType === positionFilter
      );
    }

    setFilteredLetters(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) {
      return;
    }

    try {
      await CoverLetterStorage.delete(id);
      setLetters(letters.filter(l => l.id !== id));
    } catch (error) {
      alert('Failed to delete cover letter');
    }
  };

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobLetters, setJobLetters] = useState<CoverLetter[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null);

  const handleView = async (jobPostingId: string) => {
    // Get all letters for this job (including history)
    const allLettersForJob = letters.filter(letter => letter.jobPostingId === jobPostingId);
    
    // Also get letters from history
    const allVersions: CoverLetter[] = [...allLettersForJob];
    
    // Add previous versions from metadata
    allLettersForJob.forEach(letter => {
      if (letter.metadata.previousVersions) {
        letter.metadata.previousVersions.forEach(version => {
          allVersions.push({
            id: version.id,
            jobPostingId: letter.jobPostingId,
            content: version.content,
            originalContent: version.content,
            language: letter.language,
            metadata: {
              jobTitle: letter.metadata.jobTitle,
              companyName: letter.metadata.companyName,
              positionType: letter.metadata.positionType,
              generatedAt: version.generatedAt,
            }
          });
        });
      }
    });

    // Sort by generation date (newest first)
    allVersions.sort((a, b) => new Date(b.metadata.generatedAt).getTime() - new Date(a.metadata.generatedAt).getTime());
    
    setJobLetters(allVersions);
    setSelectedJobId(jobPostingId);
    setSelectedVersionIndex(0); // Select the first (newest) version by default
  };

  const handleCloseModal = () => {
    setSelectedJobId(null);
    setJobLetters([]);
    setSelectedVersionIndex(null);
  };

  const handleEditLetter = (letterId: string) => {
    window.location.href = `/edit/${letterId}`;
  };

  if (loading) {
    return <div className="p-8">Loading cover letters...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Cover Letters</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title or company..."
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Position Type</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as PositionType | '')}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="praktikum">Praktikum</option>
              <option value="co-op">Co-op</option>
              <option value="apprenticeship">Apprenticeship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredLetters.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          {letters.length === 0
            ? 'No cover letters yet. Generate your first one!'
            : 'No cover letters match your search criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLetters.map(letter => (
            <div key={letter.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">{letter.metadata.jobTitle}</h3>
              <p className="text-gray-600 mb-2">{letter.metadata.companyName}</p>
              <p className="text-sm text-gray-500 mb-4">
                {letter.metadata.positionType} • {new Date(letter.metadata.generatedAt).toLocaleDateString()}
              </p>
              
              <div className="text-sm text-gray-700 mb-4 line-clamp-3">
                {letter.content.substring(0, 150)}...
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleView(letter.jobPostingId)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  View All
                </button>
                <button
                  onClick={() => handleDelete(letter.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing all letters for a job */}
      {selectedJobId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {jobLetters[0]?.metadata.jobTitle} at {jobLetters[0]?.metadata.companyName}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {jobLetters.length} version{jobLetters.length !== 1 ? 's' : ''} • Click versions to switch
              </p>
            </div>
            
            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar - Version List */}
              <div className="w-80 border-r bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold mb-4 text-gray-700">Versions</h3>
                  <div className="space-y-2">
                    {jobLetters.map((letter, index) => (
                      <VersionTab
                        key={letter.id}
                        letter={letter}
                        index={index}
                        totalVersions={jobLetters.length}
                        isSelected={selectedVersionIndex === index}
                        onClick={() => setSelectedVersionIndex(index)}
                        onEdit={() => handleEditLetter(letter.id)}
                        onDelete={index !== 0 ? () => handleDelete(letter.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Main Content - Selected Letter */}
              <div className="flex-1 overflow-y-auto">
                {selectedVersionIndex !== null && jobLetters[selectedVersionIndex] && (
                  <LetterViewer
                    letter={jobLetters[selectedVersionIndex]}
                    versionIndex={selectedVersionIndex}
                    totalVersions={jobLetters.length}
                    onEdit={() => handleEditLetter(jobLetters[selectedVersionIndex].id)}
                    onDelete={selectedVersionIndex !== 0 ? () => handleDelete(jobLetters[selectedVersionIndex].id) : undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Version Tab Component
function VersionTab({ 
  letter, 
  index, 
  totalVersions, 
  isSelected, 
  onClick, 
  onEdit, 
  onDelete 
}: {
  letter: CoverLetter;
  index: number;
  totalVersions: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const versionLabel = index === 0 ? 'Current' : `v${totalVersions - index}`;
  const date = new Date(letter.metadata.generatedAt);
  
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-blue-100 border-2 border-blue-300 shadow-sm' 
          : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
          {versionLabel}
        </span>
        {index === 0 && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
            Latest
          </span>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mb-2">
        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      
      <p className="text-xs text-gray-600 line-clamp-2">
        {letter.content.substring(0, 80)}...
      </p>
      
      {isSelected && (
        <div className="flex gap-1 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Edit
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Del
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Letter Viewer Component
function LetterViewer({ 
  letter, 
  versionIndex, 
  totalVersions, 
  onEdit, 
  onDelete 
}: {
  letter: CoverLetter;
  versionIndex: number;
  totalVersions: number;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const versionLabel = versionIndex === 0 ? 'Current Version' : `Version ${totalVersions - versionIndex}`;
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h3 className="text-xl font-semibold">{versionLabel}</h3>
          <p className="text-gray-500 text-sm">
            Generated: {new Date(letter.metadata.generatedAt).toLocaleString()}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <span>✏️</span>
            Edit & Export
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <span>🗑️</span>
              Delete
            </button>
          )}
        </div>
      </div>
      
      {/* Letter Content */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
            {letter.content}
          </pre>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-4 text-sm text-gray-500">
          <span>💡 Tip: Click versions in the sidebar to quickly compare</span>
        </div>
      </div>
    </div>
  );
}
