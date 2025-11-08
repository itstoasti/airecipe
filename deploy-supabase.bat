@echo off
echo ============================================
echo Supabase Edge Functions Deployment Script
echo ============================================
echo.

REM Navigate to project directory
cd /d "C:\Users\deanf\OneDrive\Desktop\projects\ai recipe"

echo Step 1: Login to Supabase (opens browser)
echo ============================================
supabase login
if %errorlevel% neq 0 (
    echo ERROR: Login failed
    pause
    exit /b 1
)
echo.

echo Step 2: Link project
echo ============================================
supabase link --project-ref hlyrnwalexksdzibduhm
if %errorlevel% neq 0 (
    echo ERROR: Project linking failed
    pause
    exit /b 1
)
echo.

echo Step 3: Set OpenAI API Key
echo ============================================
set /p OPENAI_KEY="Enter your OpenAI API key (starts with sk-): "
supabase secrets set OPENAI_API_KEY=%OPENAI_KEY%
if %errorlevel% neq 0 (
    echo ERROR: Failed to set OpenAI key
    pause
    exit /b 1
)
echo.

echo Step 4: Set FAL API Key
echo ============================================
set /p FAL_KEY="Enter your FAL API key: "
supabase secrets set FAL_API_KEY=%FAL_KEY%
if %errorlevel% neq 0 (
    echo ERROR: Failed to set FAL key
    pause
    exit /b 1
)
echo.

echo Step 5: Deploy Edge Functions
echo ============================================
echo Deploying generate-recipe function...
supabase functions deploy generate-recipe --no-verify-jwt
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy generate-recipe
    pause
    exit /b 1
)

echo Deploying generate-image function...
supabase functions deploy generate-image --no-verify-jwt
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy generate-image
    pause
    exit /b 1
)

echo Deploying chat-with-chef function...
supabase functions deploy chat-with-chef --no-verify-jwt
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy chat-with-chef
    pause
    exit /b 1
)
echo.

echo ============================================
echo SUCCESS! All Edge Functions deployed!
echo ============================================
echo.
echo Verify deployment:
supabase functions list
echo.

echo Check secrets:
supabase secrets list
echo.

pause
