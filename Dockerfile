FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
VOLUME /data
EXPOSE 3000
CMD ["node", "src/server.js"]
