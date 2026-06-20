# FlowMap — Your Learning Universe

FlowMap is an interactive learning roadmap and productivity application designed to visualize study paths, schedule milestones, track habits, and analyze learning metrics.

---

## 📂 Project Structure

The project is structured into frontend and database layers for clean deployment:

```
flowmap/
├── frontend/             # Next.js web application
│   ├── app/              # Next.js page routing
│   ├── components/       # Custom React UI, sidebar, & canvas components
│   ├── hooks/            # Client-side hooks (history, local storage)
│   ├── lib/              # Client state, Supabase client, and AI outline generator
│   ├── types/            # TypeScript interfaces
│   ├── package.json      # Dependencies and run scripts
│   └── ...
├── database/             # Database migrations & documentation
│   ├── migrations/       # SQL migration scripts (RLS, tables, indexes)
│   └── README.md         # Database schema explanation and setup instructions
├── .gitignore            # Root-level ignore configurations
└── README.md             # Project documentation (this file)
```

---

## 🚀 Local Development

All frontend code is managed in the `frontend/` directory.

### 1. Database Setup
1. Create a free PostgreSQL instance on **Supabase**.
2. Run the database migration script found in [database/migrations/20260620_init_schema.sql](file:///c:/Users/ajink/Desktop/flowmap/database/migrations/20260620_init_schema.sql) in the Supabase SQL Editor.
3. Obtain your Project URL and Anon API key.

### 2. Run the Client
Navigate into the `frontend/` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Configure your environment variables by creating a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Note: If these env variables are omitted, FlowMap runs in **Local Simulation Mode**, storing sandbox credentials and files in local storage so you can test instantly offline).*

Start the development server:
```bash
npm run dev
```

---

## ☁️ Vercel Deployment

FlowMap is optimized for seamless deployment on **Vercel**:

1. **Import the repository**: Connect your repository to Vercel.
2. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `next` (automatically managed by Vercel)
3. **Configure Environment Variables**:
   Add the following variables in the **Environment Variables** section:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**: Click **Deploy** and your full-stack roadmap application is live!

---

## Roadmap generation notes

FlowMap currently includes a local outline/template generator in `frontend/lib/roadmapGenerator.ts`. It can turn structured text outlines into roadmap nodes without any external API key.

For true AI prompt-to-roadmap generation, such as accepting a broad goal and designing a custom roadmap from scratch, you should add a server-side AI integration. Gemini is a good budget-friendly option. Keep the Gemini API key on the server only, for example in `.env.local` as `GEMINI_API_KEY`, and call it from a Next.js API route instead of exposing it in browser code.

Uploaded file parsing is currently text-based. TXT and markdown-like files work best. Real binary PDF, PPT, and PPTX files need a document parser before their content can reliably become a roadmap.

### Sample testing files

Sample fixtures are available in `samples/`:

- `samples/sample-prompt.txt` for text prompt testing.
- `samples/roadmap-outline.txt` for normal text file upload testing.
- `samples/roadmap-outline-text-readable.pdf` for current parser smoke testing with a `.pdf` extension.
- `samples/roadmap-outline-text-readable.ppt` for current parser smoke testing with a `.ppt` extension.

The PDF and PPT fixtures are intentionally plain text with those extensions, because the current app reads uploaded files as text. They are not substitutes for a real PDF/PPT parser.
