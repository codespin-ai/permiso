#!/bin/bash

# Docker push script for Permiso
# Usage: ./docker-push.sh <registry> [tag]
# Example: ./docker-push.sh ghcr.io/yourorg/permiso latest
# Example: ./docker-push.sh docker.io/yourorg/permiso v1.0.0

set -e

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <registry/image> [tag]"
    echo "Example: $0 ghcr.io/yourorg/permiso latest"
    echo "Example: $0 docker.io/yourorg/permiso v1.0.0"
    exit 1
fi

# Parse arguments
REGISTRY_IMAGE="$1"
TAG="${2:-latest}"
LOCAL_IMAGE="permiso"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Preparing to push Permiso to registry...${NC}"

# Get git commit hash for additional tagging
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Check if local image exists
if ! docker image inspect "${LOCAL_IMAGE}:${TAG}" >/dev/null 2>&1; then
    echo -e "${RED}Error: Local image ${LOCAL_IMAGE}:${TAG} not found!${NC}"
    echo -e "${YELLOW}Please run ./docker-build.sh first${NC}"
    exit 1
fi

# Tag the image for the registry
echo -e "${YELLOW}Tagging image for registry...${NC}"
docker tag "${LOCAL_IMAGE}:${TAG}" "${REGISTRY_IMAGE}:${TAG}"
docker tag "${LOCAL_IMAGE}:${TAG}" "${REGISTRY_IMAGE}:${GIT_COMMIT}"

# If this is 'latest', also tag with the git commit
if [ "${TAG}" == "latest" ]; then
    docker tag "${LOCAL_IMAGE}:${GIT_COMMIT}" "${REGISTRY_IMAGE}:${GIT_COMMIT}"
fi

# Push to registry
echo -e "${YELLOW}Pushing ${REGISTRY_IMAGE}:${TAG}...${NC}"
docker push "${REGISTRY_IMAGE}:${TAG}"

echo -e "${YELLOW}Pushing ${REGISTRY_IMAGE}:${GIT_COMMIT}...${NC}"
docker push "${REGISTRY_IMAGE}:${GIT_COMMIT}"

# Check if push was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully pushed images to registry!${NC}"
    echo -e "${GREEN}Tags pushed:${NC}"
    echo -e "  - ${REGISTRY_IMAGE}:${TAG}"
    echo -e "  - ${REGISTRY_IMAGE}:${GIT_COMMIT}"
    
    echo -e "\n${BLUE}To pull the image:${NC}"
    echo -e "  docker pull ${REGISTRY_IMAGE}:${TAG}"
    echo -e "  docker pull ${REGISTRY_IMAGE}:${GIT_COMMIT}"
else
    echo -e "${RED}Docker push failed!${NC}"
    exit 1
fi

# Cleanup local registry tags (optional)
echo -e "\n${YELLOW}Cleaning up local registry tags...${NC}"
docker rmi "${REGISTRY_IMAGE}:${TAG}" "${REGISTRY_IMAGE}:${GIT_COMMIT}" 2>/dev/null || true

echo -e "${GREEN}Done!${NC}"