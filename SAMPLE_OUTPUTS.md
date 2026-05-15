# NoteAI - Sample Outputs & Schema

This document provides examples of API responses, AI processing outputs, and the database schema for reference.

## 📡 API Response: GET /api/notes

```json
{
  "notes": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "userId": "65f1a2b3c4d5e6f7g8h9i0j0",
      "title": "Project Brainstorming",
      "content": "Building a new AI-powered note app using Next.js 16 and Gemini...",
      "tags": ["productivity", "ai", "nextjs"],
      "category": "Work",
      "isArchived": false,
      "isPublic": true,
      "shareId": "abc-123-xyz",
      "summary": "Ideas for a Next.js 16 note application with AI capabilities.",
      "actionItems": ["Set up MongoDB Atlas", "Define Mongoose schemas", "Integrate Gemini API"],
      "createdAt": "2024-03-15T10:00:00.000Z",
      "updatedAt": "2024-03-15T12:30:00.000Z"
    }
  ]
}
```

## 🤖 AI Insight Output: POST /api/notes/[id]/generate-summary

When the `/api/notes/[id]/generate-summary` endpoint is called, it processes the content via Google Gemini and returns:

```json
{
  "summary": "This note discusses the technical architecture for NoteAI, focusing on the transition to a document-based database for better scalability.",
  "actionItems": [
    "Finalize the Mongoose schema for the AI Usage model",
    "Implement the daily activity aggregation pipeline",
    "Add dark mode support using next-themes"
  ],
  "suggestedTitle": "Technical Architecture & Scalability Plan"
}
```

## 🗄️ Database Schema (Mongoose)

### Note Model (`models/Note.ts`)
```typescript
{
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  tags: [{ type: String }],
  category: { type: String, default: "Personal" },
  isArchived: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  shareId: { type: String, unique: true, sparse: true },
  summary: { type: String },
  actionItems: [{ type: String }],
  suggestedTitle: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### User Model (`models/User.ts`)
```typescript
{
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### AiUsage Model (`models/AiUsage.ts`)
```typescript
{
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  action: { type: String, required: true }, // e.g., "summary"
  tokensUsed: { type: Number },
  createdAt: { type: Date, default: Date.now }
}
```
