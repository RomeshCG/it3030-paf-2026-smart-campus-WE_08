# Smart Campus Management System

A full-stack web application built for the PAF assignment to manage campus resources, bookings, support tickets, and user administration.

## Project Structure

- `frontend` - React + Vite client application
- `backend` - Spring Boot REST API

## Core Features

- User authentication and role-based access
- Resource management and booking workflows
- Ticketing module with comments and attachments
- Admin analytics and management dashboards
- Notification and email support for key actions

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Backend: Spring Boot, Spring Security, Spring Data JPA, Maven
- Database: MySQL (primary), H2 (local development profile)

## Prerequisites

- Node.js 18+
- Java 21
- Maven (or use the included Maven Wrapper)
- MySQL (for default backend profile)

## Running the Project

### 1) Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

For Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend runs on `http://localhost:8080`.

### 2) Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Configuration

- Frontend uses `frontend/.env` (for API base URL and Google client ID).
- Backend uses environment variables referenced by `backend/src/main/resources/application.properties`.
- For local-only backend testing, you can run with H2 profile:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

## Group Members

- IT23184480 - Gamadikari G.A.M.R.C.K
- IT23172982 - Perera G.R.C
- IT23179394 - Samarakoon S.M.A.S
- IT23164994 - Kaveesha P L S K

## Module Readmes

- Frontend setup: `frontend/README.md`
- Backend setup: `backend/README.md`
