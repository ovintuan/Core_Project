#!/bin/bash

# Update the package list
apt-get update

# Install the required packages
apt-get install -y \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

echo 'Installed sudo'

# Execute the command passed as CMD or docker-compose.yml
exec "$@"
