# Backend - Smart Campus

This is the Spring Boot backend API for the Smart Campus Management System.

## Prerequisites

- Java 21
- Maven 3.9+ (optional if using wrapper)
- MySQL (for default profile)

## Run with Maven Wrapper

### Windows PowerShell

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

API base URL: `http://localhost:8080`

## Profiles

- Default profile uses MySQL with environment variables.
- Local profile uses in-memory H2 database.

Run local profile:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

H2 console (local profile): `http://localhost:8080/h2-console`

## Required Environment Variables (default profile)

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_SSL_MODE`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `GOOGLE_CLIENT_ID`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_NAME`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Build

```bash
./mvnw clean package
```

## Run Tests

```bash
./mvnw test
```
