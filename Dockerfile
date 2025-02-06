# Production stage
FROM node:22-slim

WORKDIR /app

# Install dependencies for downloading and extracting
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create directory for CLI tools
RUN mkdir -p /bin

# Download and extract Thunder CLI
RUN wget https://releases.drivechain.info/L2-S9-Thunder-latest-x86_64-unknown-linux-gnu.zip \
    && unzip L2-S9-Thunder-latest-x86_64-unknown-linux-gnu.zip -d /tmp \
    && mv /tmp/thunder-cli-latest-x86_64-unknown-linux-gnu /bin/thunder-cli \
    && chmod +x /bin/thunder-cli \
    && rm L2-S9-Thunder-latest-x86_64-unknown-linux-gnu.zip

# Download and extract BitNames CLI
RUN wget https://releases.drivechain.info/L2-S2-BitNames-latest-x86_64-unknown-linux-gnu.zip \
    && unzip L2-S2-BitNames-latest-x86_64-unknown-linux-gnu.zip -d /tmp \
    && mv /tmp/bitnames-cli-latest-x86_64-unknown-linux-gnu /bin/bitnames-cli \
    && chmod +x /bin/bitnames-cli \
    && rm L2-S2-BitNames-latest-x86_64-unknown-linux-gnu.zip

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy built node_modules and source code
COPY index.js ./
COPY config.js ./

# Set environment variables for CLI paths
ENV THUNDER_CLI_PATH=/bin/thunder-cli \
    BITNAMES_CLI_PATH=/bin/bitnames-cli

# Expose the server port
EXPOSE 3333

# Start the server
CMD ["node", "index.js"]
