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
    let filtered = [...letters];

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

  const handleView = (id: string) => {
    window.location.href = `/edit/${id}`;
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
                  onClick={() => handleView(letter.id)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  View
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
    </div>
  );
}
