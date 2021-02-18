# syntax = docker/dockerfile:1.0-experimental

# First build stage suitable for running interpreted ts via ts-node or overriding entrypoint to running tests in ci/cd
FROM node:14-alpine as deps
COPY . /usr/share/battleships
WORKDIR /usr/share/battleships
RUN npm install
ENTRYPOINT [ "npm", "run", "start" ]

# Second build stage runs compiled js faster than interpretted ts from the deps stage
FROM node:14-alpine as build
COPY --from=deps /usr/share/battleships /usr/share/battleships
WORKDIR /usr/share/battleships
ENV NODE_ENV=production
# Cull dependencies not used in production mode, e.g. typescript compiler, testing and linter packages
RUN npm run build && npm prune
ENTRYPOINT [ "npm", "run", "start:prod" ]

# Third build stage excludes all artifacts not used in the prod execution, e.g. source code, package-lock, .git, readme.md etc.
# Based of the alpine linux image rather than ubuntu or a heavier distro, the final image should be ~50mb or less
FROM node:14-alpine as slim
# Node-alpine has a pre-configured unprivileged user 'node'
COPY --from=build --chown=node:node /usr/share/battleships/dist /usr/share/battleships/dist
COPY --from=build --chown=node:node /usr/share/battleships/node_modules /usr/share/battleships/node_modules
COPY --from=build --chown=node:node /usr/share/battleships/package.json /usr/share/battleships/
USER node
WORKDIR /usr/share/battleships
ENV NODE_ENV=production
ENTRYPOINT [ "npm", "run", "start:prod" ]
