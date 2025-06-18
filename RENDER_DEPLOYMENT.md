# Deploying UNILORIN AMS to Render

## Prerequisites
1. A Render account (free tier available)
2. A PostgreSQL database (Render provides this)
3. Your code pushed to a Git repository (GitHub, GitLab, etc.)

## Step 1: Set up PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "PostgreSQL"
3. Choose a name (e.g., "unilorin-ams-db")
4. Select "Free" plan
5. Choose a region close to your users
6. Click "Create Database"
7. Note down the connection details (you'll need them later)

## Step 2: Deploy the Web Service

1. In your Render dashboard, click "New" → "Web Service"
2. Connect your Git repository
3. Configure the service:
   - **Name**: `unilorin-ams`
   - **Environment**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan for better performance)

## Step 3: Configure Environment Variables

Add these environment variables in your Render service settings:

### Required Variables:
```
NODE_ENV=production
PORT=10000
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-secure-secret-key-here
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret-here
HARDWARE_API_KEY=your-hardware-api-key
HARDWARE_SECRET=your-hardware-secret
```

### Optional Variables:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=Unilorin AMS <noreply@unilorin.edu.ng>
```

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. The first deployment may take 5-10 minutes

## Step 5: Update Hardware Configuration

After deployment, update your ESP32/hardware devices to use the new WebSocket URL:
```
ws://your-app-name.onrender.com/api/ws
```

## Important Notes

1. **WebSocket Support**: Render supports WebSocket connections, making it ideal for this application
2. **Free Tier Limitations**: 
   - Service sleeps after 15 minutes of inactivity
   - Limited bandwidth and build minutes
   - Consider upgrading for production use
3. **Database**: Use the PostgreSQL connection string from Step 1
4. **Custom Domain**: You can add a custom domain in the service settings

## Troubleshooting

1. **Build Failures**: Check the build logs in Render dashboard
2. **WebSocket Issues**: Ensure your hardware devices use the correct URL
3. **Database Connection**: Verify the DATABASE_URL is correct
4. **Environment Variables**: Double-check all required variables are set

## Monitoring

- View logs in the Render dashboard
- Set up alerts for service downtime
- Monitor database usage and performance

## Security

1. Use strong, unique secrets for NEXTAUTH_SECRET and JWT_SECRET
2. Keep your HARDWARE_API_KEY secure
3. Regularly update dependencies
4. Consider enabling HTTPS-only access 