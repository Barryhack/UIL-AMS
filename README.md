# University of Ilorin Attendance Management System

A modern web application for managing student attendance using biometric and RFID authentication.

## Features

- Role-based authentication (Admin, Lecturer, Student)
- Comprehensive admin dashboard
- User management (students and lecturers)
- Course management
- Device management (biometric scanners and RFID readers)
- Real-time attendance tracking
- Attendance statistics and reporting
- Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Tables:** TanStack Table
- **Forms:** React Hook Form
- **Notifications:** Sonner
- **API:** REST with Next.js API Routes

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/unilorin-ams.git
   cd unilorin-ams
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database URL and other configurations.

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
.
├── app/                  # Next.js app router
│   ├── admin/           # Admin dashboard routes
│   ├── api/             # API routes
│   └── auth/            # Authentication routes
├── components/          # React components
│   ├── admin/          # Admin dashboard components
│   └── ui/             # UI components
├── lib/                # Utility functions and configurations
├── prisma/             # Database schema and migrations
└── public/             # Static assets
```

## API Routes

- `/api/admin/users` - User management
- `/api/admin/courses` - Course management
- `/api/admin/devices` - Device management
- `/api/admin/dashboard/stats` - Dashboard statistics

## Authentication

The system uses NextAuth.js for authentication with the following features:
- JWT sessions
- Role-based access control
- Secure password hashing
- Protected API routes
- Automatic token refresh

## Database Schema

The database includes the following main models:
- User (Admin, Lecturer, Student)
- Course
- Session
- Attendance
- Device

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

Let's create a simple .env.local file to ensure the correct environment variables:

```plaintext file=".env.local"
... This file was left out for brevity. Assume it is correct and does not need any modifications. ...
