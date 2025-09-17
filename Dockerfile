# syntax=docker/dockerfile:1-labs

FROM node:20.14.0-alpine AS database
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.json       ./
COPY database/package.json                              ./database/
RUN npm ci
COPY database                                           ./database/
RUN npm run build -w database
ENTRYPOINT npm run deploy -w database

FROM node:20.14.0-alpine AS gateway
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.json       ./
COPY database/package.json                              ./database/
COPY gateway/package.json                               ./gateway/
RUN npm ci
COPY --from=database --exclude=/workspace/database/{migrations,fixtures}/ /workspace/database/               ./database/
COPY gateway                                            ./gateway/
RUN npm run build -w gateway
ENV  NODE_ENV=production
ENTRYPOINT npm start -w gateway


