import { useState, useEffect } from 'react';
import type { UserProfile, WorkExperience, Education, AcademicContext } from '../types';
import { ProfileStorage } from '../services/storage';
import { validateProfile } from '../utils/validation';

export function ProfileManager() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    phone: '',
    location: '',
    workExperience: [],
    education: [],
    skills: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const existingProfile = await ProfileStorage.read();
      if (existingProfile) {
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const validation = validateProfile(profile);
    
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setSaving(true);
    try {
      const fullProfile: UserProfile = {
        id: profile.id || crypto.randomUUID(),
        name: profile.name!,
        email: profile.email!,
        phone: profile.phone!,
        location: profile.location!,
        workExperience: profile.workExperience || [],
        education: profile.education || [],
        skills: profile.skills || [],
        academicContext: profile.academicContext,
        createdAt: profile.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (profile.id) {
        await ProfileStorage.update(fullProfile);
      } else {
        await ProfileStorage.create(fullProfile);
      }
      
      setProfile(fullProfile);
      setErrors({});
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addWorkExperience = () => {
    setProfile(prev => ({
      ...prev,
      workExperience: [
        ...(prev.workExperience || []),
        {
          id: crypto.randomUUID(),
          title: '',
          company: '',
          startDate: '',
          endDate: null,
          description: '',
          achievements: [],
        }
      ]
    }));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience?.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeWorkExperience = (index: number) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience?.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id: crypto.randomUUID(),
          degree: '',
          institution: '',
          graduationDate: '',
        }
      ]
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education?.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !profile.skills?.includes(skill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill.trim()]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skill)
    }));
  };

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {/* Basic Information */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Work Experience</h2>
          <button
            onClick={addWorkExperience}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Experience
          </button>
        </div>

        {profile.workExperience?.map((exp, index) => (
          <div key={exp.id} className="mb-4 p-4 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <input
                type="text"
                placeholder="Job Title"
                value={exp.title}
                onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                placeholder="Start Date"
                value={exp.startDate}
                onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                placeholder="End Date"
                value={exp.endDate || ''}
                onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value || null)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <textarea
              placeholder="Description"
              value={exp.description}
              onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-2"
              rows={3}
            />
            <button
              onClick={() => removeWorkExperience(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      {/* Education */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Education</h2>
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Education
          </button>
        </div>

        {profile.education?.map((edu, index) => (
          <div key={edu.id} className="mb-4 p-4 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                placeholder="Graduation Date"
                value={edu.graduationDate}
                onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="GPA (optional)"
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <button
              onClick={() => removeEducation(index)}
              className="text-red-500 hover:text-red-700 mt-2"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.skills?.map(skill => (
            <span
              key={skill}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add a skill and press Enter"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addSkill(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="w-full px-3 py-2 border rounded-md"
        />
      </section>

      {errors.experience && (
        <p className="text-red-500 mb-4">{errors.experience}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
