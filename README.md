# 🏆 ArenaLink

ArenaLink is a mobile-first, full-stack sports matchmaking platform built for the **Google Code League Hackathon**. It empowers local sporting communities by streamlining how players discover, book, and organize sports matches (like Futsal, Cricket, and Football) while integrating advanced AI and automation workflows.

## ✨ Features

*   **Real-Time Matchmaking & Bookings:** View scheduled matches, book spots, and see live updates via Supabase Realtime when players join or leave.
*   **AI-Powered Tournament Ingestion:** Upload promotional flyers for tournaments. Our integrated **n8n AI workflow** automatically extracts vital data (sport type, venue, date, time) and populates it directly into the platform.
*   **Player Economy & Wallet:** Built-in virtual wallet system (`wallet_balance`). To discourage flaking, the platform enforces cancellation penalties and issues partial refunds, facilitated by an automated n8n webhook workflow.
*   **Elo Skill Tracking:** Integrated Elo-based skill rating system to ensure fair and competitive matchmaking.
*   **Discovery Map:** Interactive map (powered by Google Maps API & Leaflet) with geocoding search to help you discover arenas and matches nearby.
*   **"ArenaGoa" AI Chatbot:** An integrated AI customer support assistant to help users navigate the platform and inquire about tournaments.
*   **Premium UI/UX:** Built with React, Tailwind CSS, and the "Coastal Pulse" design system for a highly responsive, mobile-first experience.

## 🛠️ Technology Stack

*   **Frontend:** React 19 (Vite), React Router, Tailwind CSS, Lucide Icons
*   **Backend:** Supabase (PostgreSQL, Authentication, Row Level Security, Realtime)
*   **Mapping:** React-Leaflet, Google Maps API
*   **Automation & AI:** n8n Webhooks & AI Workflows
*   **Design System:** Google Stitch (Coastal Pulse)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn
*   A Supabase project
*   n8n instance (for AI workflows and webhooks)

### 1. Supabase Setup
1. Create a new Supabase project.
2. Navigate to the SQL Editor in your Supabase dashboard.
3. Run the SQL scripts found in the `supabase/` directory in the following order to set up your schema and seed data:
   - `schema.sql`
   - `wallet_schema.sql`
   - `fix_wallet_rls.sql`
   - `webhook_n8n.sql`
   - `add_map_coordinates.sql`
   - `elo_update.sql`
   - `tournament-ingestion.sql`
   - `seed.sql` / `seed_goa_venues.sql` / `seed_more_goa_tournaments.sql`

### 2. Client Setup
1. Clone the repository and navigate to the project directory.
2. Navigate to the `client` directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the `client` directory based on the `.env.example` file and populate it with your Supabase credentials and Google Maps API key:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📱 Mobile-First Design
ArenaLink is designed specifically for mobile users, featuring bottom tab navigation and a responsive layout, ensuring a seamless experience whether you are organizing a tournament from your desk or booking a futsal match on the go.

## 🤝 Contributing
Built for the Google Code League Hackathon. Feel free to fork and submit pull requests if you'd like to extend the platform!
