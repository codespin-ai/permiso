#!/bin/bash

# Docker build script for Permiso
# Usage: ./docker-build.sh [tag]

set -e

# Default values
IMAGE_NAME="permiso"
DEFAULT_TAG="latest"
TAG="${1:-$DEFAULT_TAG}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Permiso Docker image...${NC}"

# Get git commit hash for labeling
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build the Docker image
echo -e "${YELLOW}Building image: ${IMAGE_NAME}:${TAG}${NC}"
docker build \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --label "git.commit=${GIT_COMMIT}" \
  --label "build.date=${BUILD_DATE}" \
  -t "${IMAGE_NAME}:${TAG}" \
  -t "${IMAGE_NAME}:${GIT_COMMIT}" \
  .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully built ${IMAGE_NAME}:${TAG}${NC}"
    echo -e "${GREEN}Also tagged as ${IMAGE_NAME}:${GIT_COMMIT}${NC}"
    
    # Show image info
    echo -e "\n${YELLOW}Image details:${NC}"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -3
else
    echo -e "${RED}Docker build failed!${NC}"
    exit 1
fi