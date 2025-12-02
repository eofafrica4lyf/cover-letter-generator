# Cover Letter Generator

A web-based application that uses AI to create personalized cover letters for job applications.

## ✨ Features

### 🎯 Core Features (All Working!)
- ✅ **Profile Management**: Complete profile with work experience, education, skills, and academic context
- ✅ **Job Management**: Save, view, select, and delete job postings
- ✅ **Multi-language Support**: Auto-detect and generate in 12+ languages
- ✅ **Smart Gap Analysis**: Identifies missing information before generation
- ✅ **Template Generation**: High-quality cover letters tailored to position type
- ✅ **Full Editor**: Edit with version control (original + edited versions)
- ✅ **Export**: PDF, DOCX, and TXT with smart filenames
- ✅ **Library**: Search, filter, and organize all your cover letters
- ✅ **Offline Support**: Works completely offline with local storage

### 🌍 Language Support
English • German • French • Spanish • Italian • Portuguese • Dutch • Polish • Russian • Chinese • Japanese • Korean

### 📝 Position Types
Full-time • Part-time • Internship • Praktikum • Co-op • Apprenticeship

## Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Project Structure

```
cover-letter-app/
├── src/
│   ├── components/       # React components
│   │   ├── ProfileManager.tsx
│   │   ├── JobInput.tsx
│   │   ├── CoverLetterGenerator.tsx
│   │   ├── CoverLetterEditor.tsx
│   │   └── CoverLetterLibrary.tsx
│   ├── services/         # Business logic
│   │   └── storage.ts
│   ├── db/              # Database configuration
│   │   └── database.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   └── validation.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── api/                 # Serverless functions
│   ├── generate.ts      # AI generation endpoint
│   └── parse.ts         # Job posting parser
└── public/              # Static assets
```

## Usage

### 1. Create Your Profile

Navigate to the Profile page and add:
- Basic information (name, email, phone, location)
- Work experience
- Education
- Skills
- Academic context (for students)

### 2. Add a Job Posting

Go to the Job Input page and choose your preferred method:
- **URL**: Paste a job posting URL to automatically extract details
- **Text**: Paste the job description text
- **File**: Upload a PDF or DOCX file
- **Manual**: Enter all details manually

### 3. Generate Cover Letter

Once you've added a job posting:
- Select the tone (professional, enthusiastic, or formal)
- Click "Generate Cover Letter"
- The AI will create a tailored letter matching your profile to the job requirements

### 4. Edit & Export

- Edit the generated content as needed
- View the original version anytime
- Export to PDF, DOCX, or plain text

### 5. Manage Your Library

- View all your saved cover letters
- Search by company or job title
- Filter by position type
- Delete old letters

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Storage**: IndexedDB (via Dexie.js)
- **Routing**: React Router
- **Backend**: Vercel Serverless Functions
- **AI**: OpenAI GPT-3.5-turbo
- **Export**: jsPDF, docx library

## Cost Optimization

The application is designed for minimal costs:
- **Hosting**: Free (Vercel free tier)
- **Storage**: Local (IndexedDB - no database costs)
- **AI**: ~$0.003 per cover letter generation
- **Estimated**: $25-40/month for 1000 active users

## Development

### Run Tests

```bash
npm run test
```

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Environment Variables

- `VITE_OPENAI_API_KEY`: Your OpenAI API key for AI generation

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
