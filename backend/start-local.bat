@echo off
echo ===================================
echo Codeit Onboarding Backend - Local Setup
echo ===================================
echo.

echo Starting PostgreSQL container...
docker-compose up -d

echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak > nul

echo Building the application...
call mvnw.cmd clean install -DskipTests

echo.
echo Starting Spring Boot application...
echo API will be available at: http://localhost:8080/api
echo.
echo Press Ctrl+C to stop the application
echo.

call mvnw.cmd spring-boot:run
