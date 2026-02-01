import { useState, useEffect } from 'react';
import type { JobPosting, UserProfile, CoverLetter, GenerationRequest, InformationGap, PositionType } from '../types';
import { ProfileStorage, CoverLetterStorage, JobPostingStorage } from '../services/storage';
import { analyzeInformationGaps, canProceedWithGeneration } from '../utils/gapAnalysis';

const POSITION_OPTIONS: PositionType[] = ['full-time', 'part-time', 'internship', 'praktikum', 'co-op', 'apprenticeship'];

export function CoverLetterGenerator({ jobPosting }: { jobPosting: JobPosting }) {
  const [editableJob, setEditableJob] = useState<JobPosting>({ ...jobPosting });
  const [editingJob, setEditingJob] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [regeneratingJob, setRegeneratingJob] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [error, setError] = useState<string>('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'formal'>('professional');
  const [gaps, setGaps] = useState<InformationGap[]>([]);
  const [showGaps, setShowGaps] = useState(false);
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>({});
  const [sampleLetter, setSampleLetter] = useState<string>('');
  const [newRequirement, setNewRequirement] = useState('');

  useEffect(() => {
    setEditableJob({ ...jobPosting });
  }, [jobPosting]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await ProfileStorage.read();
      if (!userProfile) {
        setError('Please create your profile first');
        return;
      }
      setProfile(userProfile);
    } catch (err) {
      setError('Failed to load profile');
    }
  };

  useEffect(() => {
    if (profile) {
      const detectedGaps = analyzeInformationGaps(editableJob, profile);
      setGaps(detectedGaps);
      if (detectedGaps.some(g => g.category === 'required' || g.category === 'recommended')) {
        setShowGaps(true);
      }
    }
  }, [editableJob, profile]);

  const handleSaveJobDetails = async () => {
    setSavingJob(true);
    try {
      await JobPostingStorage.update(editableJob.id, editableJob);
      setEditingJob(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save job details');
    } finally {
      setSavingJob(false);
    }
  };

  /** Normalize to short skill label: max 2 words; split on comma/semicolon. */
  const addRequirement = () => {
    const raw = newRequirement.trim();
    if (!raw) return;
    const parts = raw.split(/[,;]|\s+and\s+/i).map(p => p.trim()).filter(Boolean);
    const normalize = (s: string) => {
      const words = s.split(/\s+/).filter(Boolean);
      return words.length > 2 ? words.slice(0, 2).join(' ') : s;
    };
    const toAdd = parts.length > 0 ? parts.map(normalize) : [normalize(raw)];
    const existing = new Set(editableJob.requirements || []);
    const added = toAdd.filter(r => r && !existing.has(r));
    if (added.length > 0) {
      setEditableJob({ ...editableJob, requirements: [...(editableJob.requirements || []), ...added] });
      setNewRequirement('');
    }
  };

  const removeRequirement = (req: string) => {
    setEditableJob({ ...editableJob, requirements: editableJob.requirements?.filter(x => x !== req) || [] });
  };

  const normalizeRequirements = (requirements: string[]): string[] =>
    requirements.map(r => {
      const words = r.trim().split(/\s+/).filter(Boolean);
      return words.length > 2 ? words.slice(0, 2).join(' ') : r.trim();
    }).filter(Boolean);

  const handleRegenerateJobDetails = async () => {
    const url = editableJob.url?.trim();
    const description = editableJob.description?.trim();
    if (url) {
      setRegeneratingJob(true);
      try {
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'url', content: url }),
        });
        if (!response.ok) throw new Error('Parse failed');
        const data = await response.json();
        setEditableJob({
          ...editableJob,
          jobTitle: data.jobTitle || editableJob.jobTitle,
          companyName: data.companyName || editableJob.companyName,
          description: data.description ?? editableJob.description,
          requirements: normalizeRequirements(data.requirements || []),
          language: data.language || editableJob.language,
          positionType: data.positionType || editableJob.positionType,
          hiringManager: data.hiringManager ?? editableJob.hiringManager,
          department: data.department ?? editableJob.department,
          companyAddress: data.companyAddress ?? editableJob.companyAddress,
          salary: data.salary ?? editableJob.salary,
          applicationDeadline: data.applicationDeadline ?? editableJob.applicationDeadline,
          benefits: data.benefits ?? editableJob.benefits,
        });
      } catch (err) {
        console.error(err);
        alert('Failed to regenerate job details. Check the URL or try again.');
      } finally {
        setRegeneratingJob(false);
      }
    } else if (description && description.length > 100) {
      setRegeneratingJob(true);
      try {
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'text', content: description }),
        });
        if (!response.ok) throw new Error('Parse failed');
        const data = await response.json();
        setEditableJob({
          ...editableJob,
          jobTitle: data.jobTitle || editableJob.jobTitle,
          companyName: data.companyName || editableJob.companyName,
          description: data.description ?? editableJob.description,
          requirements: normalizeRequirements(data.requirements || []),
          language: data.language || editableJob.language,
          positionType: data.positionType || editableJob.positionType,
          hiringManager: data.hiringManager ?? editableJob.hiringManager,
          department: data.department ?? editableJob.department,
          companyAddress: data.companyAddress ?? editableJob.companyAddress,
          salary: data.salary ?? editableJob.salary,
          applicationDeadline: data.applicationDeadline ?? editableJob.applicationDeadline,
          benefits: data.benefits ?? editableJob.benefits,
        });
      } catch (err) {
        console.error(err);
        alert('Failed to regenerate job details. Try again.');
      } finally {
        setRegeneratingJob(false);
      }
    } else {
      alert('Add a job URL or a longer description, then try Regenerate job details.');
    }
  };

  const handleGenerate = async () => {
    if (!profile) {
      setError('Profile not found');
      return;
    }

    // Check if we can proceed
    if (!canProceedWithGeneration(gaps)) {
      setError('Please fill in all required information before generating');
      setShowGaps(true);
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // Format gap answers with question context for better AI understanding
      const formattedAdditionalInfo: Record<string, string> = {};
      Object.entries(gapAnswers).forEach(([gapId, answer]) => {
        const gap = gaps.find(g => g.id === gapId);
        if (gap && answer.trim()) {
          formattedAdditionalInfo[gap.question] = answer.trim();
        }
      });

      const request: GenerationRequest = {
        jobPosting: editableJob,
        userProfile: profile,
        language: editableJob.language,
        tone,
        additionalInfo: formattedAdditionalInfo,
        sampleLetter: sampleLetter.trim() || undefined,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();

      const newCoverLetter: CoverLetter = {
        id: crypto.randomUUID(),
        jobPostingId: editableJob.id,
        content: data.content,
        originalContent: data.content,
        language: data.language,
        metadata: {
          jobTitle: editableJob.jobTitle,
          companyName: editableJob.companyName,
          positionType: editableJob.positionType,
          generatedAt: new Date(),
        }
      };

      // Don't auto-save - let user decide when to save
      setCoverLetter(newCoverLetter);
    } catch (err) {
      setError('Failed to generate cover letter. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    // Just clear the cover letter to show the form again
    // User can then change tone and click Generate
    setCoverLetter(null);
  };

  const handleSave = async () => {
    if (!coverLetter) return;

    try {
      // Check if there's already a letter for this job
      const existingLetters = await CoverLetterStorage.list();
      const existingLetter = existingLetters.find(letter => letter.jobPostingId === editableJob.id);

      if (existingLetter) {
        // Update existing letter and move old one to history
        const updatedLetter = {
          ...coverLetter,
          id: existingLetter.id, // Keep the same ID to replace it
          metadata: {
            ...coverLetter.metadata,
            previousVersions: existingLetter.metadata.previousVersions || [],
          }
        };

        // Add current version to history before updating
        const historyEntry = {
          id: crypto.randomUUID(),
          content: existingLetter.content,
          generatedAt: existingLetter.metadata.generatedAt,
        };

        updatedLetter.metadata.previousVersions = [
          historyEntry,
          ...(existingLetter.metadata.previousVersions || [])
        ];

        await CoverLetterStorage.update(updatedLetter.id, updatedLetter);
      } else {
        // Create new letter
        await CoverLetterStorage.create(coverLetter);
      }

      alert('Cover letter saved successfully!');
    } catch (error) {
      console.error('Failed to save cover letter:', error);
      alert('Failed to save cover letter. Please try again.');
    }
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please create your profile before generating a cover letter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Cover Letter</h1>

      {/* Job details: view + edit */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Job details</h2>
          {!editingJob ? (
            <div className="flex items-center gap-2">
              {(editableJob.url?.trim() || (editableJob.description?.trim() && editableJob.description.length > 100)) && (
                <button
                  type="button"
                  onClick={handleRegenerateJobDetails}
                  disabled={regeneratingJob}
                  className="text-sm px-3 py-1.5 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                  {regeneratingJob ? 'Regenerating…' : 'Regenerate job details'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditingJob(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEditableJob({ ...jobPosting }); setEditingJob(false); }}
                className="text-sm px-3 py-1 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJobDetails}
                disabled={savingJob}
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {savingJob ? 'Saving…' : 'Save job details'}
              </button>
            </div>
          )}
        </div>

        {!editingJob ? (
          <>
            <p className="text-lg font-medium text-gray-900">{editableJob.jobTitle}</p>
            <p className="text-gray-600">{editableJob.companyName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {editableJob.positionType} • {editableJob.language.toUpperCase()}
              {editableJob.companyAddress && ` • ${editableJob.companyAddress}`}
            </p>
            {editableJob.url && (
              <p className="text-sm mt-2">
                <a
                  href={editableJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {editableJob.url}
                </a>
              </p>
            )}
            {editableJob.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <div className="text-sm text-gray-600 leading-relaxed max-h-[400px] overflow-y-auto pr-2 space-y-3">
                  {editableJob.description
                    .trim()
                    .split(/\n\n+/)
                    .filter(p => p.trim())
                    .map((paragraph, i) => (
                      <p key={i} className="whitespace-pre-wrap">
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </div>
            )}
            {editableJob.requirements && editableJob.requirements.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {editableJob.requirements.map(req => (
                    <span key={req} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(editableJob.hiringManager || editableJob.department) && (
              <p className="text-sm text-gray-500 mt-2">
                {editableJob.hiringManager && `Hiring manager: ${editableJob.hiringManager}`}
                {editableJob.hiringManager && editableJob.department && ' • '}
                {editableJob.department && `Department: ${editableJob.department}`}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job posting URL</label>
              <input
                type="url"
                value={editableJob.url || ''}
                onChange={e => setEditableJob({ ...editableJob, url: e.target.value || undefined })}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Used for “Regenerate job details” to re-parse the posting.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
              <input
                type="text"
                value={editableJob.jobTitle}
                onChange={e => setEditableJob({ ...editableJob, jobTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={editableJob.companyName}
                onChange={e => setEditableJob({ ...editableJob, companyName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position type</label>
                <select
                  value={editableJob.positionType}
                  onChange={e => setEditableJob({ ...editableJob, positionType: e.target.value as PositionType })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {POSITION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={editableJob.language}
                  onChange={e => setEditableJob({ ...editableJob, language: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="nl">Dutch</option>
                  <option value="pl">Polish</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editableJob.description}
                onChange={e => setEditableJob({ ...editableJob, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requirements (short skill labels only)</label>
              <p className="text-xs text-gray-500 mb-2">One or two words per skill, e.g. C++, Python, teamwork, German. Use comma or “and” to add several.</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editableJob.requirements || []).map(req => (
                  <span
                    key={req}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2 inline-flex"
                  >
                    {req}
                    <button type="button" onClick={() => removeRequirement(req)} className="text-blue-600 hover:text-blue-800" aria-label="Remove">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={e => setNewRequirement(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  placeholder="e.g. C++, Python, teamwork"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button type="button" onClick={addRequirement} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                  Add
                </button>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Optional: hiring manager, address, department</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hiring manager</label>
                  <input
                    type="text"
                    value={editableJob.hiringManager || ''}
                    onChange={e => setEditableJob({ ...editableJob, hiringManager: e.target.value || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Company address</label>
                  <input
                    type="text"
                    value={editableJob.companyAddress || ''}
                    onChange={e => setEditableJob({ ...editableJob, companyAddress: e.target.value || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={editableJob.department || ''}
                    onChange={e => setEditableJob({ ...editableJob, department: e.target.value || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </details>
          </div>
        )}
      </div>

      {!coverLetter && (
        <>
          {/* Information Gaps */}
          {gaps.length > 0 && showGaps && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Additional Information</h2>
                <button
                  onClick={() => setShowGaps(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip Optional
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Providing this information will improve your cover letter quality.
              </p>
              
              {gaps.map(gap => (
                <div key={gap.id} className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {gap.question}
                    {gap.category === 'required' && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {gap.category === 'recommended' && (
                      <span className="text-yellow-600 ml-1">(recommended)</span>
                    )}
                    {gap.category === 'optional' && (
                      <span className="text-gray-400 ml-1">(optional)</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{gap.context}</p>
                  <input
                    type="text"
                    value={gapAnswers[gap.id] || gap.suggestedAnswer || ''}
                    onChange={(e) => setGapAnswers({ ...gapAnswers, [gap.id]: e.target.value })}
                    placeholder={gap.suggestedAnswer || 'Your answer...'}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <label className="block text-sm font-medium mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md mb-4"
            >
              <option value="professional">Professional</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="formal">Formal</option>
            </select>

            <label className="block text-sm font-medium mb-2">
              Sample Letter (Optional)
              <span className="text-xs text-gray-500 ml-2">Paste a cover letter you like as a style reference</span>
            </label>
            <textarea
              value={sampleLetter}
              onChange={(e) => setSampleLetter(e.target.value)}
              placeholder="Paste a sample cover letter here to match its style and tone..."
              className="w-full px-3 py-2 border rounded-md mb-4 font-mono text-sm"
              rows={8}
            />

            {gaps.length > 0 && !showGaps && (
              <button
                onClick={() => setShowGaps(true)}
                className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mb-4"
              >
                Review Information Gaps ({gaps.length})
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {generating ? 'Generating...' : 'Generate Cover Letter'}
            </button>

            {error && (
              <p className="text-red-500 mt-4">{error}</p>
            )}
          </div>
        </>
      )}

      {coverLetter && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Cover Letter</h2>
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Regenerate
            </button>
          </div>

          <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
            {coverLetter.content}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Letter
            </button>
            <button
              onClick={() => window.location.href = `/edit/${coverLetter.id}`}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Edit & Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
