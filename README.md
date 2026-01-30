# Planko

> A modern, collaborative project management tool built with React, TypeScript, and Supabase.

[![Security Score](https://img.shields.io/badge/security-9.8%2F10-brightgreen)](https://github.com/yourusername/planko)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)

Planko is a feature-rich Kanban board application that enables teams to organize tasks, collaborate in real-time, and boost productivity. Built with modern web technologies and best security practices.

---

## Features

### Core Functionality
- **Kanban Boards** - Drag-and-drop task management with customizable columns
- **Real-time Collaboration** - Auto-refresh every 3 seconds for near-instant updates
- **Task Management** - Create, edit, assign, and prioritize tasks
- **AI-Powered Subtasks** - Generate subtasks automatically using Google Gemini AI
- **Team Collaboration** - Invite members via shareable links
- **User Profiles** - Customizable avatars and profile information

### User Experience
- **Dark Mode** - System-aware theme with manual toggle
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Drag & Drop** - Intuitive task reordering and column management
- **Rich UI Components** - Built with Radix UI and Tailwind CSS
- **Toast Notifications** - Real-time feedback for all actions

### Security
- **Row Level Security (RLS)** - Database-level access control
- **Secure Authentication** - Powered by Supabase Auth
- **XSS Protection** - No vulnerabilities, comprehensive security headers
- **SQL Injection Prevention** - Parameterized queries throughout
- **Environment Variables** - Proper secret management

---

## Tech Stack

### Frontend
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vite.dev/)** - Build tool and dev server
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon library

### Backend
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Edge Functions
- **[Google Gemini AI](https://ai.google.dev/)** - AI-powered subtask generation

### Deployment
- **[Vercel](https://vercel.com/)** - Frontend hosting
- **[Supabase Cloud](https://supabase.com/)** - Database and backend

---

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** ([sign up free](https://supabase.com))
- **Google AI API key** ([get one here](https://ai.google.dev/))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/planko.git
cd planko
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Where to find these:**
> 1. Go to [Supabase Dashboard](https://app.supabase.com)
> 2. Select your project
> 3. Go to Settings → API
> 4. Copy the Project URL and anon/public key

### 4. Set Up the Database

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - `supabase/schema.sql`
   - `supabase/migrations/add_collaboration.sql`
   - `supabase/migrations/fix_rls_recursion.sql`
   - `supabase/migrations/remove_email_add_link_generation.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 5. Configure Edge Functions

1. Go to **Supabase Dashboard → Edge Functions → Environment Variables**
2. Add the following secrets:
   - `GEMINI_API_KEY` - Your Google AI API key
   - `SUPABASE_SERVICE_ROLE_KEY` - From Settings → API
   - `SUPABASE_URL` - Your project URL

3. Deploy the Edge Function:

```bash
supabase functions deploy generate-subtasks
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
planko/
├── src/
│   ├── components/        # React components
│   │   ├── common/       # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── ui/           # Radix UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main application component
├── supabase/
│   ├── functions/        # Edge Functions
│   ├── migrations/       # Database migrations
│   └── schema.sql        # Database schema
├── public/               # Static assets
├── .env.example          # Environment variables template
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

---

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Verify Deployment:**
   - Check that the app loads
   - Test authentication
   - Verify database connections

### Deploy Edge Functions

Edge Functions are deployed separately to Supabase:

```bash
supabase functions deploy generate-subtasks
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm audit` | Check for vulnerabilities |

---

## Usage

### Creating a Board

1. Click "New Board" on the dashboard
2. Enter a board name
3. Start adding columns and tasks

### Inviting Team Members

1. Open a board
2. Click the "Share" button
3. Copy the invite link
4. Share with team members

### Using AI Subtasks

1. Open a task detail
2. Click "Generate Subtasks with AI"
3. AI will create 3-5 actionable subtasks
4. Edit or delete as needed

### Drag & Drop

- **Reorder tasks:** Drag tasks within a column
- **Move between columns:** Drag tasks to different columns
- **Reorder columns:** Drag column headers (coming soon)

---

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure `npm run lint` passes

---

## Acknowledgments

- [Supabase](https://supabase.com/) - Amazing backend platform
- [Vercel](https://vercel.com/) - Seamless deployment
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Google Gemini](https://ai.google.dev/) - AI capabilities

