# Use the official Node.js runtime as a parent image
FROM node:22-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create uploads directory structure
RUN mkdir -p public/uploads/images-driver public/uploads/images-circuit

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the application
CMD ["npm", "start"]
