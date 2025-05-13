# # Use an official Node.js runtime as a base image
# FROM node:21

# # Set the working directory to /usr/src/app
# WORKDIR /usr/src/app/
# COPY . .

# WORKDIR /usr/src/app/client
# RUN npm install

# WORKDIR /usr/src/app/sdk
# RUN npm install
# # Install dependencies for ipfs
# WORKDIR /usr/src/app/ipfs
# RUN npm install

# WORKDIR /usr/src/app/client
# RUN mkdir /uploads

# WORKDIR /usr/src/app/client/uploads
# RUN mkdir /patient

# WORKDIR /usr/src/app/client

# EXPOSE 5001

# CMD ["npm", "start"]


# Use an official Node.js runtime as a base image
FROM node:21

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for each component
# COPY package*.json ./
COPY client/package*.json ./client/
COPY sdk/package*.json ./sdk/
COPY ipfs/package*.json ./ipfs/

# Install root dependencies
# RUN npm install --legacy-peer-deps

# Using a single RUN command to reduce layers, improving cache utilization
# and potentially speeding up builds if any of the package.json files don't change
RUN cd client && npm install --legacy-peer-deps && \
    cd ../sdk && npm install --legacy-peer-deps && \
    cd ../ipfs && npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Make directories for uploads
RUN mkdir -p client/uploads/patient

# Expose port
EXPOSE 5001
WORKDIR /usr/src/app/client
# Command to run the application
CMD ["npm", "start"]
