FROM node:lts

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Set and expose the port the app runs on
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

CMD ["npm", "start"]
