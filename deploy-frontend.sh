#!/bin/bash
set -e

echo "Building frontend..."
# ใช้ pnpm แทน npm
pnpm install
pnpm run build

# echo "Deploying to server via SCP..."
# scp -r dist/* obomit@192.168.100.8:/var/www/html/

echo "Deploying to TEST..."
scp -r dist/* obomit@192.168.100.8:/var/www/test/

echo "Reloading Nginx..."
ssh obomit@192.168.100.8 'sudo systemctl reload nginx'

echo "Frontend deployed successfully!"
