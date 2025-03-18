FROM node:18 as build

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Copy client package.json
COPY client/package*.json ./client/
RUN cd client && npm install

# Bundle app source
COPY . .

# Build React client
RUN cd client && npm run build

# Production stage
FROM node:18-slim

WORKDIR /usr/src/app

# Copy package.json and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built app from build stage
COPY --from=build /usr/src/app/client/build ./client/build
COPY --from=build /usr/src/app/server.js ./

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose the standard port
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"] 