import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ProfileManager } from './components/ProfileManager';
import { JobInput } from './components/JobInput';
import { JobList } from './components/JobList';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { CoverLetterEditor } from './components/CoverLetterEditor';
import { CoverLetterLibrary } from './components/CoverLetterLibrary';
import { useState } from 'react';
import type { JobPosting } from './types';

function App() {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Home
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Profile
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  My Jobs
                </Link>
                <Link
                  to="/job/new"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Add Job
                </Link>
                <Link
                  to="/library"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  My Letters
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<ProfileManager />} />
            <Route
              path="/jobs"
              element={
                <JobList
                  onSelectJob={(job) => {
                    setSelectedJob(job);
                    window.location.href = '/generate';
                  }}
                />
              }
            />
            <Route
              path="/job/new"
              element={
                <JobInput
                  onJobCreated={(job) => {
                    setSelectedJob(job);
                    window.location.href = '/generate';
                  }}
                />
              }
            />
            <Route
              path="/generate"
              element={
                selectedJob ? (
                  <CoverLetterGenerator jobPosting={selectedJob} />
                ) : (
                  <GenerateWrapper setSelectedJob={setSelectedJob} />
                )
              }
            />
            <Route
              path="/edit/:id"
              element={<EditorWrapper />}
            />
            <Route path="/library" element={<CoverLetterLibrary />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cover Letter Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create professional, tailored cover letters in minutes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link
            to="/profile"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-4">👤</div>
            <h3 className="text-lg font-semibold mb-2">1. Create Profile</h3>
            <p className="text-gray-600">
              Add your experience, education, and skills
            </p>
          </Link>

          <Link
            to="/job/new"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-4">💼</div>
            <h3 className="text-lg font-semibold mb-2">2. Add Job</h3>
            <p className="text-gray-600">
              Enter job details via URL, text, or manually
            </p>
          </Link>

          <Link
            to="/library"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2">3. Generate</h3>
            <p className="text-gray-600">
              Get a tailored cover letter instantly
            </p>
          </Link>
        </div>

        <div className="mt-12">
          <Link
            to="/profile"
            className="inline-block px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

function EditorWrapper() {
  const id = window.location.pathname.split('/').pop() || '';
  return <CoverLetterEditor letterId={id} />;
}

function GenerateWrapper({ setSelectedJob }: { setSelectedJob: (job: JobPosting) => void }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Select a Job</h1>
      <JobList onSelectJob={setSelectedJob} />
      <div className="mt-6 text-center">
        <Link
          to="/job/new"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add New Job
        </Link>
      </div>
    </div>
  );
}

export default App;
