FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:20-slim
WORKDIR /app
RUN useradd -m appuser
COPY --from=build /app .
USER appuser
CMD ["node", "src/index.js"]