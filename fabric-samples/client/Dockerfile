# Use an official Node.js runtime as a base image
FROM node:21

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app


COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
