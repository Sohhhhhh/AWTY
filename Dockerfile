# 1- Base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# 2- Development
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 3- Build
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# 4- Production
FROM base AS production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
