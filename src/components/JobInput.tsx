import { useState, useEffect } from 'react';
import type { JobPosting, PositionType, InputMethod } from '../types';
import { JobPostingStorage } from '../services/storage';
import { validateJobPosting, identifyMissingFields } from '../utils/validation';
import { detectLanguage } from '../utils/language';

type TabType = 'url' | 'manual' | 'paste' | 'file';

export function JobInput({ onJobCreated }: { onJobCreated?: (job: JobPosting) => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProduction, setIsProduction] = useState<boolean | null>(null);
  const [translating, setTranslating] = useState(false);

  const [jobData, setJobData] = useState<Partial<JobPosting>>({
    jobTitle: '',
    companyName: '',
    positionType: 'full-time',
    description: '',
    requirements: [],
    language: 'en',
  });

  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');

  // Check if API is available (production mode)
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'test' })
        });
        
        console.log('API check response:', response.status);
        
        // If we get any HTTP response, the API is deployed
        if (response.status >= 200 && response.status < 600) {
          const data = await response.json();
          console.log('API check data:', data);
          setIsProduction(true);
        } else {
          setIsProduction(false);
        }
      } catch (error) {
        // Network error - API not available (development mode)
        console.error('API check failed:', error);
        setIsProduction(false);
      }
    };
    checkApiAvailability();
  }, []);

  // Auto-detect language when description changes
  useEffect(() => {
    if (jobData.description && jobData.description.length > 50) {
      const result = detectLanguage(jobData.description);
      if (result.confidence > 0.7) {
        setDetectedLanguage(`${result.languageName} (${Math.round(result.confidence * 100)}% confidence)`);
        setJobData(prev => ({ ...prev, language: result.language }));
      }
    }
  }, [jobData.description]);

  const handleScrapeURL = async () => {
    if (!urlInput.trim()) {
      setErrors({ url: 'Please enter a URL' });
      return;
    }

    setLoading(true);
    try {
      // Try API endpoint first
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'url',
          content: urlInput
        })
      });

      if (!response.ok) throw new Error('API not available');

      const data = await response.json();
      
      setJobData({
        ...jobData,
        jobTitle: data.jobTitle || '',
        companyName: data.companyName || '',
        description: data.description || '',
        requirements: data.requirements || [],
        language: data.language || 'en',
        url: urlInput,
        inputMethod: 'url'
      });
      
      setActiveTab('manual');
    } catch (error) {
      // Fallback: Show message and switch to manual entry
      setErrors({ 
        url: 'URL scraping is not available in development mode. Please use manual entry or paste the job description text.' 
      });
      // Pre-fill the URL field
      setJobData({
        ...jobData,
        url: urlInput,
        inputMethod: 'url'
      });
      // Don't switch tabs automatically - let user choose
    } finally {
      setLoading(false);
    }
  };

  const handleParseText = async () => {
    if (!textInput.trim()) {
      setErrors({ text: 'Please paste job posting text' });
      return;
    }

    setLoading(true);
    try {
      // Try API endpoint first
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'text',
          content: textInput
        })
      });

      if (!response.ok) throw new Error('API not available');

      const data = await response.json();
      setJobData({
        ...jobData,
        jobTitle: data.jobTitle || '',
        companyName: data.companyName || '',
        description: data.description || textInput,
        requirements: data.requirements || [],
        language: data.language || 'en',
        inputMethod: 'paste'
      });
      setActiveTab('manual');
    } catch (error) {
      // Fallback: Use the pasted text as description
      setJobData({
        ...jobData,
        description: textInput,
        inputMethod: 'paste'
      });
      setActiveTab('manual');
      // Show info message instead of error
      alert('AI parsing is not available in development mode. The text has been added to the description field. Please fill in the job title and company name manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'file',
            content: base64,
            filename: file.name
          })
        });

        if (!response.ok) throw new Error('Failed to parse file');

        const data = await response.json();
        setJobData({
          ...jobData,
          jobTitle: data.jobTitle || '',
          companyName: data.companyName || '',
          description: data.description || '',
          requirements: data.requirements || [],
          language: data.language || 'en',
          inputMethod: 'file-upload'
        });
        setActiveTab('manual');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErrors({ file: 'Failed to parse file. Please try manual entry.' });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const validation = validateJobPosting(jobData);
    
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    const missingFields = identifyMissingFields(jobData);
    if (missingFields.length > 0) {
      alert(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const fullJob: JobPosting = {
        id: crypto.randomUUID(),
        jobTitle: jobData.jobTitle!,
        companyName: jobData.companyName!,
        positionType: jobData.positionType!,
        description: jobData.description!,
        requirements: jobData.requirements!,
        language: jobData.language!,
        url: jobData.url,
        inputMethod: (jobData.inputMethod || 'manual') as InputMethod,
        createdAt: new Date(),
      };

      await JobPostingStorage.create(fullJob);
      
      if (onJobCreated) {
        onJobCreated(fullJob);
      }

      alert('Job posting saved successfully!');
      
      // Reset form
      setJobData({
        jobTitle: '',
        companyName: '',
        positionType: 'full-time',
        description: '',
        requirements: [],
        language: 'en',
      });
      setErrors({});
    } catch (error) {
      alert('Failed to save job posting. Please try again.');
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    // If description exists and language is changing, offer to translate
    if (jobData.description && jobData.description.length > 0 && newLanguage !== jobData.language) {
      const shouldTranslate = window.confirm(
        `Would you like to translate the job description to ${getLanguageName(newLanguage)}?`
      );
      
      if (shouldTranslate) {
        setTranslating(true);
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: jobData.description,
              sourceLanguage: jobData.language,
              targetLanguage: newLanguage
            })
          });

          if (!response.ok) throw new Error('Translation failed');

          const data = await response.json();
          setJobData({
            ...jobData,
            description: data.translatedText,
            language: newLanguage
          });
        } catch (error) {
          console.error('Translation error:', error);
          alert('Translation failed. Please try again or edit manually.');
          // Still update the language even if translation fails
          setJobData({ ...jobData, language: newLanguage });
        } finally {
          setTranslating(false);
        }
      } else {
        // Just update the language without translating
        setJobData({ ...jobData, language: newLanguage });
      }
    } else {
      // No description to translate, just update language
      setJobData({ ...jobData, language: newLanguage });
    }
  };

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      en: 'English',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      pl: 'Polish',
    };
    return names[code] || code;
  };

  const addRequirement = (req: string) => {
    if (req.trim() && !jobData.requirements?.includes(req.trim())) {
      setJobData({
        ...jobData,
        requirements: [...(jobData.requirements || []), req.trim()]
      });
    }
  };

  const removeRequirement = (req: string) => {
    setJobData({
      ...jobData,
      requirements: jobData.requirements?.filter(r => r !== req)
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Job Posting</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 ${activeTab === 'url' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          URL
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 ${activeTab === 'paste' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Paste Text
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 ${activeTab === 'file' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 ${activeTab === 'manual' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Manual Entry
        </button>
      </div>

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          {isProduction === false && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Development Mode:</strong> URL scraping requires deployment. For now, use the "Paste Text" or "Manual Entry" tabs.
              </p>
            </div>
          )}
          {isProduction === true && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm text-green-800">
                ✅ <strong>Production Mode:</strong> URL scraping is available! Enter a job posting URL below.
              </p>
            </div>
          )}
          <label className="block text-sm font-medium mb-2">Job Posting URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/job-posting"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={handleScrapeURL}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Scraping...' : 'Scrape'}
            </button>
          </div>
          {errors.url && <p className="text-red-500 text-sm mt-2">{errors.url}</p>}
        </div>
      )}

      {/* Paste Text Tab */}
      {activeTab === 'paste' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <label className="block text-sm font-medium mb-2">Paste Job Posting Text</label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste the job posting text here..."
            className="w-full px-3 py-2 border rounded-md"
            rows={10}
          />
          <button
            onClick={handleParseText}
            disabled={loading}
            className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Parsing...' : 'Parse Text'}
          </button>
          {errors.text && <p className="text-red-500 text-sm mt-2">{errors.text}</p>}
        </div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <label className="block text-sm font-medium mb-2">Upload Job Posting File</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="w-full px-3 py-2 border rounded-md"
          />
          {loading && <p className="text-gray-500 mt-2">Processing file...</p>}
          {errors.file && <p className="text-red-500 text-sm mt-2">{errors.file}</p>}
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Title *</label>
              <input
                type="text"
                value={jobData.jobTitle}
                onChange={(e) => setJobData({ ...jobData, jobTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input
                type="text"
                value={jobData.companyName}
                onChange={(e) => setJobData({ ...jobData, companyName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Position Type *</label>
              <select
                value={jobData.positionType}
                onChange={(e) => setJobData({ ...jobData, positionType: e.target.value as PositionType })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="praktikum">Praktikum</option>
                <option value="co-op">Co-op</option>
                <option value="apprenticeship">Apprenticeship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Language
                {detectedLanguage && (
                  <span className="ml-2 text-xs text-green-600">
                    Detected: {detectedLanguage}
                  </span>
                )}
                {translating && (
                  <span className="ml-2 text-xs text-blue-600">
                    Translating...
                  </span>
                )}
              </label>
              <select
                value={jobData.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={translating}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
              >
                <option value="en">English</option>
                <option value="de">German (Deutsch)</option>
                <option value="fr">French (Français)</option>
                <option value="es">Spanish (Español)</option>
                <option value="it">Italian (Italiano)</option>
                <option value="pt">Portuguese (Português)</option>
                <option value="nl">Dutch (Nederlands)</option>
                <option value="pl">Polish (Polski)</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Job Description *</label>
            <textarea
              value={jobData.description}
              onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={6}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Requirements</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {jobData.requirements?.map(req => (
                <span
                  key={req}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
                >
                  {req}
                  <button
                    onClick={() => removeRequirement(req)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a requirement and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addRequirement(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Save Job Posting
          </button>
        </div>
      )}
    </div>
  );
}
