# Environment Setup Instructions

## Create .env file

Since .env files are in .gitignore, you need to create it manually:

1. Create a file named `.env` in the project root
2. Add the following content (update the password):

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=udrive-from-bolt
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_postgres_password_here

# JWT Secret (generate a secure random string in production)
JWT_SECRET=udrive_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

# App Configuration
VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

3. **IMPORTANT:** Replace `your_actual_postgres_password_here` with your actual PostgreSQL password

## Verify Setup

After creating `.env`, verify it's working:
```bash
node -e "require('dotenv').config(); console.log('DB:', process.env.DATABASE_NAME)"
```

Should output: `DB: udrive-from-bolt`

