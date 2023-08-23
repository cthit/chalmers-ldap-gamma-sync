FROM node:fermium-alpine AS build
LABEL maintainer="digIT <digit@chalmers.it>"

COPY ["index.js", "package.json", "yarn.lock", "/app/"]

# Set up dependencies
WORKDIR /app
RUN yarn

# Build binary
RUN npm install -g pkg@5.8.1 pkg-fetch@3.5.2
RUN pkg index.js -o /app/chalmers-ldap-gamma-sync

##########################
#    PRODUCTION STAGE    #
##########################
FROM alpine

# Copy binary
COPY --from=build /app/chalmers-ldap-gamma-sync /app/chalmers-ldap-gamma-sync

RUN echo "0 0 * * * /app/chalmers-ldap-gamma-sync" > /etc/crontabs/root

WORKDIR /app
ENTRYPOINT ["crond", "-f", "-l", "2"]
