FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data
COPY package*.json ./
# инструменты сборки нужны, если для better-sqlite3 нет готовой сборки; после установки удаляем
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm ci --omit=dev \
 && npm cache clean --force \
 && apt-get purge -y python3 make g++ && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*
COPY . .
VOLUME /data
EXPOSE 3000
CMD ["node", "src/server.js"]
