# # Use an official Node.js runtime as a base image
# FROM node:14

# # Set the working directory to /usr/src/app
# WORKDIR /usr/src/app

# # Copy package.json and package-lock.json to the working directory
# COPY package*.json ./

# # Install app dependencies
# RUN npm install

# # Copy the entire Angular app to the working directory
# COPY . .

# # Build the Angular app
# RUN npm run build --prod

# # Expose port 80 for the Angular app
# EXPOSE 4200

# # Command to run the Angular app in the background
# CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--disable-host-check"]


# Use an official Node.js 14 image
FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Copy both package.json and package-lock.json
COPY package.json package-lock.json ./

# Install exact dependencies from package-lock.json
RUN npm ci

# Copy the rest of your files into the image
COPY . .

# Build the Angular app for production
RUN npm run build --prod

# Expose the Angular dev server port (4200 by default)
EXPOSE 4200

# Launch the app in dev server mode
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--disable-host-check"]
