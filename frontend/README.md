# Freelance Fortress

A modern freelance platform built with Next.js and Django.

## Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and Radix UI
- **Backend**: Django REST Framework with JWT authentication
- **Database**: SQLite (development) / PostgreSQL (production)

## Quick Start

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd ../freelance_backend
   ```

2. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the Django server:
   ```bash
   python manage.py runserver 8000
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:9002`.

## Features

- **Authentication**: JWT-based user authentication with role-based access (Client/Freelancer)
- **Project Management**: Create, browse, and manage freelance projects
- **User Profiles**: Comprehensive user profiles with skills and portfolio
- **Video Demos**: Upload and showcase work demonstrations
- **Search & Filter**: Advanced project search and filtering capabilities

## API Endpoints

- **Authentication**: `/api/auth/`
  - `POST /register/` - User registration
  - `POST /login/` - User login
  - `POST /logout/` - User logout
  - `GET /profile/` - Get user profile

- **Projects**: `/api/projects/`
  - `GET /` - List projects
  - `POST /` - Create project
  - `GET /{id}/` - Get project details
  - `PUT /{id}/` - Update project
  - `DELETE /{id}/` - Delete project

- **Profiles**: `/api/profiles/`
  - `GET /me/` - Get current user profile
  - `PUT /me/` - Update current user profile
  - `GET /demos/` - List video demos
  - `POST /demos/` - Upload video demo
