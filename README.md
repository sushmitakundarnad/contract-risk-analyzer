# AI Contract Risk Analyzer

A full-stack web application that uses AI (OpenAI GPT-4o-mini) to analyze legal contracts and identify potential risks. Built as a final-year computer science project.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green) ![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-purple)

## Features

- **JWT Authentication** - Secure registration/login with bcrypt password hashing
- **AI Contract Analysis** - Upload PDF/TXT/DOC files or paste text for GPT-4o-mini risk analysis
- **Interactive Dashboard** - Charts (Pie, Bar, Line) showing risk distribution and trends
- **Risk Detection** - Identifies Legal, Financial, Compliance, and Operational risks
- **PDF Export** - Download risk analysis reports as PDF documents
- **Dark Theme** - Professional dark UI with glassmorphism effects
- **Search & Filter** - Find contracts by name or severity level
- **Admin Panel** - View all users and contracts (admin role)
- **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS (custom dark theme)
- Chart.js + react-chartjs-2
- React Router v6
- React Dropzone (drag & drop file upload)
- jsPDF (PDF report export)
- React Hot Toast (notifications)
- Axios (HTTP client)

### Backend
- Node.js + Express.js + TypeScript
- MongoDB + Mongoose ODM
- JWT (JSON Web Tokens) authentication
- bcrypt password hashing
- OpenAI GPT-4o-mini API
- Multer (file upload handling)
- pdf-parse (PDF text extraction)
- Helmet, CORS, express-rate-limit (security)

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** account (MongoDB Atlas recommended) or local MongoDB instance
- **OpenAI API Key** (get from https://platform.openai.com/api-keys)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd contract-risk-analyzer
```

### 2. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/contract-risk-analyzer?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**MongoDB Atlas Setup:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or allow access from anywhere: `0.0.0.0/0`)
5. Get the connection string and replace `<username>` and `<password>`

**OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key into your `.env` file

Start the backend:

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The backend will start on `http://localhost:5000`.

### 3. Set up the Frontend

```bash
cd frontend

# Install dependencies
npm install
```

Start the frontend:

```bash
# Development mode
npm run dev
```

The frontend will start on `http://localhost:5173`.

### 4. Open the application

Navigate to `http://localhost:5173` in your browser.

1. **Register** a new account
2. **Login** with your credentials
3. **Upload** a contract or paste contract text
4. **Analyze** and review the AI-generated risk assessment
5. **Export** the report as PDF

## Project Structure

```
contract-risk-analyzer/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.ts          # User schema (name, email, password, role)
│   │   │   └── Contract.ts      # Contract schema (userId, filename, content, analysis)
│   │   ├── routes/
│   │   │   ├── auth.ts          # Register, Login, Get Profile
│   │   │   ├── contracts.ts     # Analyze, List, Get, Delete contracts
│   │   │   └── dashboard.ts     # Stats, Admin dashboard
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT protect & admin guards
│   │   ├── utils/
│   │   │   └── openai.ts        # OpenAI GPT-4o-mini integration
│   │   └── server.ts            # Express server setup
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Navigation bar with user menu
│   │   │   ├── RiskCard.tsx      # Individual risk display card
│   │   │   ├── ProtectedRoute.tsx # Auth-guarded route wrapper
│   │   │   └── LoadingSpinner.tsx # Reusable loading spinner
│   │   ├── pages/
│   │   │   ├── Login.tsx         # Login page
│   │   │   ├── Register.tsx      # Registration page
│   │   │   ├── Dashboard.tsx     # Dashboard with charts & history
│   │   │   └── Analyzer.tsx      # Contract upload & analysis page
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Authentication context provider
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── App.tsx               # Router & app layout
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Tailwind + custom dark theme
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint          | Description          | Access  |
|--------|-------------------|----------------------|---------|
| POST   | /api/auth/register | Register new user   | Public  |
| POST   | /api/auth/login    | Login user          | Public  |
| GET    | /api/auth/me       | Get current profile | Private |

### Contracts
| Method | Endpoint                | Description            | Access  |
|--------|-------------------------|------------------------|---------|
| POST   | /api/contracts/analyze  | Analyze a contract     | Private |
| GET    | /api/contracts          | List user's contracts  | Private |
| GET    | /api/contracts/:id      | Get single contract    | Private |
| DELETE | /api/contracts/:id      | Delete a contract      | Private |

### Dashboard
| Method | Endpoint              | Description           | Access  |
|--------|-----------------------|-----------------------|---------|
| GET    | /api/dashboard/stats  | User dashboard stats  | Private |
| GET    | /api/dashboard/admin  | Admin dashboard       | Admin   |

## Risk Severity Levels

| Level    | Color  | Score Range | Description                    |
|----------|--------|-------------|--------------------------------|
| Critical | Red    | 0-29        | Major issues requiring action  |
| High     | Orange | 30-49       | Significant concerns           |
| Medium   | Yellow | 50-69       | Moderate risks                 |
| Low      | Green  | 70-100      | Minor or no concerns           |

## Risk Categories

- **Legal** - Liability, indemnification, IP rights, dispute resolution
- **Financial** - Payment terms, penalties, insurance requirements
- **Compliance** - Regulatory compliance, data protection, confidentiality
- **Operational** - Termination, renewal, force majeure, non-compete

## Security Features

- JWT token-based authentication (30-day expiry)
- bcrypt password hashing (12 salt rounds)
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Environment variables for sensitive data

## License

This project is built for educational purposes as a final-year computer science project.
