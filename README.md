# NoteAI - Your Intelligent Second Brain

NoteAI is a high-performance, AI-powered note-taking application designed for productivity. It features real-time saving, intelligent summaries, action item extraction, and a beautiful productivity dashboard.

![NoteAI Preview](https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=2070)

## ✨ Features

- **Authentication**: Secure login/signup via NextAuth.js.
- **Notes CRUD**: Create, edit, archive, and permanently delete notes.
- **AI Insights**: Generate summaries and extract action items using Google Gemini AI.
- **Intelligent Titles**: AI-suggested titles based on your content.
- **Search & Filtering**: Filter by category, tags, or archive status.
- **Productivity Dashboard**: Visualize your note-taking activity with charts (Daily/Weekly/Monthly).
- **Public Sharing**: Share read-only versions of your notes via unique links.
- **Modern UI**: Dark mode, responsive design, and glassmorphism aesthetics.
- **Markdown Support**: Toggle between raw text and rendered markdown preview.
- **Keyboard Shortcuts**: `Ctrl/Cmd + N` for rapid note creation.

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB + Mongoose |
| **AI** | Google Generative AI (Gemini Pro) |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand + React Query |
| **Auth** | NextAuth.js |
| **Icons** | Lucide React |
| **Notifications** | Sonner |

## 🚀 Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/note-ai.git
   cd note-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and copy the contents from `.env.example`:
   ```bash
   MONGODB_URI="your_mongodb_connection_string"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## 📡 API Reference

| Method | Path | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notes` | Fetch all user notes | Yes |
| `POST` | `/api/notes` | Create a new note | Yes |
| `PATCH` | `/api/api/notes/[id]` | Update a note | Yes |
| `DELETE` | `/api/notes/[id]` | Archive or delete a note | Yes |
| `POST` | `/api/notes/[id]/generate-summary` | Generate AI insights | Yes |
| `GET` | `/api/insights` | Get dashboard statistics | Yes |
| `GET` | `/share/[shareId]` | Public note view | No |

## 🏗️ Architecture

```ascii
[Client] <---> [Next.js App Router] <---> [MongoDB]
                   ^          ^
                   |          |
            [Gemini AI]   [NextAuth]
```

### Folder Structure
- `app/`: Next.js routes and API endpoints.
- `components/`: Reusable UI components.
- `lib/`: Shared utilities (DB, Auth, AI helpers).
- `models/`: Mongoose schemas.
- `store/`: Zustand global state.

## 🌐 Deployment to Vercel

1. **GitHub**: Push your local repository to a new GitHub repository.
2. **Vercel**:
   - Create a new project on Vercel.
   - Import your GitHub repository.
   - Add the Environment Variables from your `.env` file.
3. **Database**: Use a free MongoDB cluster (Atlas) or a serverless provider.
4. **Build**: Vercel will automatically detect Next.js and run `npm run build`.

## 📄 License

MIT
