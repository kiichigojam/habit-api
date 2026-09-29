# Habit API Simple Design Doc

## Idea

This project is a backend API for a habit-tracking app.

The main idea is:

- users create an account
- users create habits they want to track
- users check in on habits by date
- the app stores that history so a frontend can show progress over time

This backend is designed to support a web or mobile client.

## Main Features

- signup
- login
- get current user
- soft delete current user
- create habit
- list habits
- get one habit
- update habit
- delete habit
- create habit check-in
- list habit check-ins
- delete a habit check-in by date

## Tech Stack

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Flyway
- PostgreSQL
- JWT authentication

## Database Structure

There are 3 main tables.

### 1. `users`

Purpose:

- stores account information

Columns:

- `id` UUID primary key
- `email` text
- `password_hash` text
- `name` text
- `created_at` timestamptz
- `deleted_at` timestamptz nullable

Notes:

- email must be unique for active users
- users are soft-deleted, not fully removed

### 2. `habits`

Purpose:

- stores habits created by a user

Columns:

- `id` UUID primary key
- `user_id` UUID foreign key to `users.id`
- `title` text
- `notes` text nullable
- `is_active` boolean
- `created_at` timestamptz

Notes:

- one user can have many habits

### 3. `habit_checkins`

Purpose:

- stores when a user completed a habit on a specific date

Columns:

- `id` UUID primary key
- `habit_id` UUID foreign key to `habits.id`
- `user_id` UUID foreign key to `users.id`
- `checkin_date` date
- `created_at` timestamptz

Notes:

- one habit can only have one check-in per date
- this is enforced by a unique constraint on `(habit_id, checkin_date)`

## Database Relationships

- one `user` has many `habits`
- one `habit` has many `habit_checkins`
- one `user` can have many `habit_checkins`

## Authentication Flow

### Signup

Request:

json
POST /auth/signup
{
  "email": "demo@example.com",
  "password": "password123",
  "name": "Demo User"
}


Response:

json
{
  "token": "jwt-token-here"
}


### Login

Request:

json
POST /auth/login
{
  "email": "demo@example.com",
  "password": "password123"
}


Response:

json
{
  "token": "jwt-token-here"
}


### Protected Routes

All protected routes require:

http
Authorization: Bearer <token>


## API Request and Response Structure

### 1. Health Check

Request:

http
GET /health


Response:

text
HEALTH CHECK PASS


### 2. Get Current User

Request:

http
GET /users/me
Authorization: Bearer <token>


Response:

json
{
  "id": "uuid",
  "email": "demo@example.com",
  "name": "Demo User",
  "createdAt": "2026-03-15T10:00:00Z"
}


### 3. Delete Current User

Request:

http
DELETE /users/me
Authorization: Bearer <token>


Response:

http
204 No Content


### 4. Create Habit

Request:

json
POST /habits
Authorization: Bearer <token>
{
  "title": "Workout",
  "notes": "Upper body on Mondays"
}


Response:

json
{
  "id": "uuid",
  "title": "Workout",
  "notes": "Upper body on Mondays",
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00Z"
}


### 5. List Habits

Request:

http
GET /habits
Authorization: Bearer <token>


Response:

json
[
  {
    "id": "uuid",
    "title": "Workout",
    "notes": "Upper body on Mondays",
    "isActive": true,
    "createdAt": "2026-03-15T10:00:00Z"
  }
]


### 6. Get One Habit

Request:

http
GET /habits/{habitId}
Authorization: Bearer <token>


Response:

json
{
  "id": "uuid",
  "title": "Workout",
  "notes": "Upper body on Mondays",
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00Z"
}


### 7. Update Habit

Request:

json
PATCH /habits/{habitId}
Authorization: Bearer <token>
{
  "title": "Workout 5x/week",
  "notes": "Upper/lower split",
  "isActive": true
}


Response:

json
{
  "id": "uuid",
  "title": "Workout 5x/week",
  "notes": "Upper/lower split",
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00Z"
}


### 8. Delete Habit

Request:

http
DELETE /habits/{habitId}
Authorization: Bearer <token>


Response:

http
204 No Content


### 9. Create Check-In

Request with explicit date:

json
POST /habits/{habitId}/checkins
Authorization: Bearer <token>
{
  "checkinDate": "2026-03-15"
}


Request with today’s default date:

json
POST /habits/{habitId}/checkins
Authorization: Bearer <token>
{}


Response:

json
{
  "id": "uuid",
  "habitId": "uuid",
  "checkinDate": "2026-03-15",
  "createdAt": "2026-03-15T10:00:00Z"
}


### 10. List Check-Ins

Request:

http
GET /habits/{habitId}/checkins
Authorization: Bearer <token>


Response:

json
[
  {
    "id": "uuid",
    "habitId": "uuid",
    "checkinDate": "2026-03-15",
    "createdAt": "2026-03-15T10:00:00Z"
  }
]


### 11. Delete Check-In

Request:

http
DELETE /habits/{habitId}/checkins/2026-03-15
Authorization: Bearer <token>


Response:

http
204 No Content


## Internal Structure

### Controllers

Purpose:

- define API endpoints
- handle requests and return responses

Main controllers:

- `AuthController`
- `UserController`
- `HabitController`

### Repositories

Purpose:

- query the database through Spring Data JPA

Main repositories:

- `UserRepository`
- `HabitRepository`
- `HabitCheckinRepository`

### Entities

Purpose:

- map Java classes to database tables

Main entities:

- `User`
- `Habit`
- `HabitCheckin`

## How Data Is Queried

This codebase mostly does not use raw SQL for normal app logic.

Instead, it uses Spring Data JPA repository methods like:

- `findByIdAndUserId(...)`
- `findAllByUserIdOrderByCreatedAtDesc(...)`
- `existsByHabitIdAndUserIdAndCheckinDate(...)`

Spring generates the SQL behind the scenes.

Raw SQL only appears in the Flyway migration files that create or update the database schema.

## Main Design Choices

- JWT auth instead of server-side sessions
- PostgreSQL as the source of truth
- Flyway for database versioning
- UUIDs for primary keys
- soft delete for users
- simple controller + repository structure for fast development


## Future Ideas

- mobile frontend
- streak calculations
- reminders
- goal tracking
- macro tracking
- AI suggestions for goals and habits
