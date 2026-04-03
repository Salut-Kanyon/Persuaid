FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ENV NODE_ENV=production
ENV STT_PROXY_BIND=0.0.0.0
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
