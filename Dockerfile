FROM node:20.5-alpine
LABEL maintainer="digIT <digit@chalmers.it>"

COPY ["index.js", "package.json", "yarn.lock", "/app/"]

WORKDIR /app
RUN yarn
RUN echo "0 0 * * * node index.js" > /etc/crontabs/root

ENTRYPOINT ["crond", "-f", "-l", "2"]
