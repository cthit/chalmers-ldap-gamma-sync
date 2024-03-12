FROM rust:1.76-alpine AS build
LABEL maintainer="digIT <digit@chalmers.it>"

# Install build dependencies
RUN apk add --no-cache build-base musl-dev openssl-dev openssl
ENV OPENSSL_DIR=/usr

WORKDIR /app

# Copy over the Cargo.toml files to the shell project
COPY Cargo.toml Cargo.lock ./

# Build and cache the dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo fetch
RUN cargo build --release
RUN rm src/main.rs

# Copy the actual code files and build the application
COPY src ./src/
# Update the file date
RUN touch src/main.rs
RUN cargo build --release

##########################
#    PRODUCTION STAGE    #
##########################
FROM scratch

WORKDIR /app
COPY --from=build /app/target/release/chalmers-ldap-gamma-sync chalmers-ldap-gamma-sync

ENTRYPOINT ["/app/chalmers-ldap-gamma-sync"]
