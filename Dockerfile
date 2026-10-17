FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:24-trixie-slim
WORKDIR /app
RUN useradd -m appuser
COPY --from=build /app .
USER appuser
CMD ["node", "src/index.js"]
