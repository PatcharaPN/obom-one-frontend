#!/bin/bash
set -e

echo "Building frontend..."
npm install
npm run build

echo "Deploying to server via SCP..."
scp -r dist/* obomit@192.168.100.8:/var/www/html/

echo "Reloading Nginx..."
ssh obomit@192.168.100.8 'sudo systemctl reload nginx'

echo "Frontend deployed successfully!"
