# 🥗 NutriTrack - Nutrition Tracking App

A modern, AI-powered nutrition tracking application built with React, Vite, and Supabase.

## ✨ Features

- **📊 Daily Nutrition Tracking** - Log meals and track calories, macros, and nutrients
- **🤖 AI-Powered Food Analysis** - Get detailed nutrition information using OpenAI
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **👥 Coach & Trainee System** - Coaches can manage multiple trainees
- **📈 Progress Tracking** - Monitor weight and nutrition goals over time
- **🔍 Barcode Scanner** - Quick food entry with barcode scanning
- **💬 AI Chat Assistant** - Get nutrition advice and meal suggestions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nutri-track
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **AI:** OpenAI GPT-4
- **Deployment:** Vercel/Netlify ready

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Deployment

This app is configured for easy deployment to:

- **Vercel** (recommended) - `vercel.json` included
- **Netlify** - `netlify.toml` included  
- **GitHub Pages** - GitHub Actions workflow included

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📁 Project Structure

```
src/
├── api/           # API clients and functions
├── components/    # React components
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── pages/         # Page components
└── utils/         # Utility functions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository.
