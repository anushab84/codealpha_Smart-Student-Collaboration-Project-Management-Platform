FROM node:22-alpine
ENV NODE_ENV=production PORT=5000
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
