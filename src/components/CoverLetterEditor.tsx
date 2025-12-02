import { useState, useEffect } from 'react';
import type { CoverLetter } from '../types';
import { CoverLetterStorage } from '../services/storage';
import { exportToPDF, exportToDOCX, exportToText } from '../utils/export';

export function CoverLetterEditor({ letterId }: { letterId: string }) {
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    loadLetter();
  }, [letterId]);

  const loadLetter = async () => {
    try {
      const coverLetter = await CoverLetterStorage.read(letterId);
      if (coverLetter) {
        setLetter(coverLetter);
        setContent(coverLetter.content);
      }
    } catch (error) {
      console.error('Failed to load cover letter:', error);
    }
  };

  const handleSave = async () => {
    if (!letter) return;

    setSaving(true);
    try {
      await CoverLetterStorage.update(letter.id, { content });
      alert('Changes saved successfully!');
    } catch (error) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    if (letter && confirm('Revert to original content?')) {
      setContent(letter.originalContent);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!letter) return;

    try {
      // Create a temporary letter with current content for export
      const exportLetter = { ...letter, content };

      switch (format) {
        case 'pdf':
          await exportToPDF(exportLetter);
          break;
        case 'docx':
          await exportToDOCX(exportLetter);
          break;
        case 'txt':
          exportToText(exportLetter);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    }
  };

  if (!letter) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Cover Letter</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{letter.metadata.jobTitle}</h2>
            <p className="text-gray-600">{letter.metadata.companyName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {showOriginal ? 'Show Current' : 'Show Original'}
            </button>
            <button
              onClick={handleRevert}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Revert to Original
            </button>
          </div>
        </div>

        <textarea
          value={showOriginal ? letter.originalContent : content}
          onChange={(e) => !showOriginal && setContent(e.target.value)}
          readOnly={showOriginal}
          className="w-full px-4 py-3 border rounded-md font-serif text-gray-800 leading-relaxed"
          rows={20}
        />

        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving || showOriginal}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Export</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('pdf')}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExport('docx')}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Export as DOCX
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Export as TXT
          </button>
        </div>
      </div>
    </div>
  );
}
