#!/bin/bash

# Create components/ui directory if it doesn't exist
mkdir -p components/ui

# Install shadcn CLI
npm install --save-dev @shadcn/ui

# Initialize shadcn
npx shadcn init --yes

# Install components
npx shadcn add button
npx shadcn add card
npx shadcn add input
npx shadcn add table
npx shadcn add tabs
npx shadcn add label
npx shadcn add alert
npx shadcn add badge

echo "shadcn/ui components installed successfully!"
