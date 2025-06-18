#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the Next.js application
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
