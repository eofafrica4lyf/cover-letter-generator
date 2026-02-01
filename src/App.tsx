import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { PasswordReset } from './components/Auth/PasswordReset';
import { ProfileManager } from './components/ProfileManager';
import { JobInput } from './components/JobInput';
import { JobList } from './components/JobList';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { CoverLetterEditor } from './components/CoverLetterEditor';
import { CoverLetterLibrary } from './components/CoverLetterLibrary';
import { MigrationHandler } from './components/MigrationHandler';
import { SyncStatus } from './components/SyncStatus';
import { useState } from 'react';
import type { JobPosting } from './types';

function AppContent() {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const { currentUser, logout } = useAuth();

  return (
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
              {currentUser && (
                <>
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
                </>
              )}
            </div>
            <div className="flex items-center">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">{currentUser.email}</span>
                  <button
                    onClick={() => logout()}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-sm bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfileManager />
              </AuthGuard>
            }
          />
          <Route
            path="/jobs"
            element={
              <AuthGuard>
                <JobListWrapper setSelectedJob={setSelectedJob} />
              </AuthGuard>
            }
          />
          <Route
            path="/job/new"
            element={
              <AuthGuard>
                <JobInputWrapper setSelectedJob={setSelectedJob} />
              </AuthGuard>
            }
          />
          <Route
            path="/generate"
            element={
              <AuthGuard>
                {selectedJob ? (
                  <CoverLetterGenerator jobPosting={selectedJob} />
                ) : (
                  <GenerateWrapper setSelectedJob={setSelectedJob} />
                )}
              </AuthGuard>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <AuthGuard>
                <EditorWrapper />
              </AuthGuard>
            }
          />
          <Route
            path="/library"
            element={
              <AuthGuard>
                <CoverLetterLibrary />
              </AuthGuard>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <MigrationHandler>
            <AppContent />
            <SyncStatus />
          </MigrationHandler>
        </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Helper components
function Home() {
  const { currentUser } = useAuth();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cover Letter Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create professional, tailored cover letters in minutes
        </p>

        {!currentUser && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              Please <Link to="/login" className="font-semibold underline">login</Link> or{' '}
              <Link to="/signup" className="font-semibold underline">sign up</Link> to get started
            </p>
          </div>
        )}

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

        {currentUser && (
          <div className="mt-12">
            <Link
              to="/profile"
              className="inline-block px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg font-semibold"
            >
              Get Started
            </Link>
          </div>
        )}
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

function JobListWrapper({ setSelectedJob }: { setSelectedJob: (job: JobPosting) => void }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Jobs</h1>
      <JobList
        onSelectJob={(job) => {
          setSelectedJob(job);
          navigate('/generate');
        }}
      />
    </div>
  );
}

function JobInputWrapper({ setSelectedJob }: { setSelectedJob: (job: JobPosting) => void }) {
  const navigate = useNavigate();
  
  return (
    <JobInput
      onJobCreated={(job) => {
        setSelectedJob(job);
        navigate('/generate');
      }}
    />
  );
}

export default App;