# MyCat - Catechism Search

A Next.js application for searching the Catechism of the Catholic Church using semantic search.

## Features

- 🔍 Semantic search through the entire Catechism
- 📱 Responsive design with Tailwind CSS
- 🎨 Modern UI with shadcn/ui components
- 🗄️ Supabase backend with pgvector for similarity search
- 🤖 Ready for OpenAI integration (placeholder functions included)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key (for future implementation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: Your OpenAI API key (for future use)

3. Set up your Supabase database:
   - Run the SQL commands in `supabase/schema.sql` in your Supabase SQL editor
   - This will create the `ccc_paragraphs` table with pgvector support

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── api/search/route.ts    # Search API endpoint
│   ├── search/page.tsx        # Search page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── SearchBar.tsx          # Search input component
└── lib/
    ├── supabase.ts            # Supabase client
    ├── openai.ts              # OpenAI placeholder functions
    └── utils.ts               # Utility functions
```

## Database Schema

The application uses a Supabase database with the following table:

```sql
CREATE TABLE ccc_paragraphs (
  id SERIAL PRIMARY KEY,
  paragraph_number INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Next Steps

1. **Populate the database**: Add Catechism paragraphs to the `ccc_paragraphs` table
2. **Implement OpenAI integration**: Replace placeholder functions in `lib/openai.ts`
3. **Add authentication**: If needed for your use case
4. **Deploy**: Deploy to Vercel or your preferred platform

## Technologies Used

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Supabase](https://supabase.com/) - Backend and database
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [Radix UI](https://www.radix-ui.com/) - UI primitives

## License

MIT License
