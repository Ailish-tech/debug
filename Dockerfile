# Use an official Node runtime as a parent image (Bullseye has better support for compilers)
FROM node:18-bullseye-slim

# Install compilers and interpreters (C/C++, Python, Java)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3 \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Map python3 to python (since server.js calls `python`)
RUN ln -s /usr/bin/python3 /usr/bin/python || true

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Ensure the temp directory exists and has correct permissions
RUN mkdir -p data/temp && chmod 777 data/temp

# Expose the port
EXPOSE 3000

# Start the application
CMD [ "node", "server.js" ]
