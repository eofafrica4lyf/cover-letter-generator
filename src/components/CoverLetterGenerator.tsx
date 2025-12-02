import { useState, useEffect } from 'react';
import type { JobPosting, UserProfile, CoverLetter, GenerationRequest, InformationGap } from '../types';
import { ProfileStorage, CoverLetterStorage } from '../services/storage';
import { analyzeInformationGaps, canProceedWithGeneration } from '../utils/gapAnalysis';

export function CoverLetterGenerator({ jobPosting }: { jobPosting: JobPosting }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [error, setError] = useState<string>('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'formal'>('professional');
  const [gaps, setGaps] = useState<InformationGap[]>([]);
  const [showGaps, setShowGaps] = useState(false);
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>({});

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
      
      // Analyze information gaps
      const detectedGaps = analyzeInformationGaps(jobPosting, userProfile);
      setGaps(detectedGaps);
      
      // Show gaps if there are any required or recommended ones
      if (detectedGaps.some(g => g.category === 'required' || g.category === 'recommended')) {
        setShowGaps(true);
      }
    } catch (err) {
      setError('Failed to load profile');
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
      const request: GenerationRequest = {
        jobPosting,
        userProfile: profile,
        language: jobPosting.language,
        tone,
        additionalInfo: gapAnswers,
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
        jobPostingId: jobPosting.id,
        content: data.content,
        originalContent: data.content,
        language: data.language,
        metadata: {
          jobTitle: jobPosting.jobTitle,
          companyName: jobPosting.companyName,
          positionType: jobPosting.positionType,
          generatedAt: new Date(),
        }
      };

      // Auto-save
      await CoverLetterStorage.create(newCoverLetter);
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

      {/* Job Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">{jobPosting.jobTitle}</h2>
        <p className="text-gray-600 mb-4">{jobPosting.companyName}</p>
        <p className="text-sm text-gray-500">
          {jobPosting.positionType} • {jobPosting.language.toUpperCase()}
        </p>
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
