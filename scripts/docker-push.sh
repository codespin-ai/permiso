#!/bin/bash

# Docker push script for Permiso
# Usage: ./docker-push.sh [tag] [registry]
# Examples:
#   ./docker-push.sh                                    # Push latest locally
#   ./docker-push.sh latest                             # Push latest locally
#   ./docker-push.sh latest ghcr.io/codespin-ai        # Push to registry
#   ./docker-push.sh v1.0.0 docker.io/yourorg          # Push version to registry

set -e

# Parse arguments
IMAGE_NAME="permiso"
TAG="${1:-latest}"
REGISTRY="${2:-}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Show usage if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [tag] [registry]"
    echo ""
    echo "Arguments:"
    echo "  tag       Docker image tag (default: latest)"
    echo "  registry  Registry base path (optional, e.g., ghcr.io/codespin-ai)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Push latest locally"
    echo "  $0 latest                             # Push latest locally"
    echo "  $0 latest ghcr.io/codespin-ai        # Push to registry"
    echo "  $0 v1.0.0 docker.io/yourorg          # Push version to registry"
    exit 0
fi

# Get git commit hash
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Construct full image name
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
    echo -e "${BLUE}Preparing to push ${IMAGE_NAME} to ${REGISTRY}...${NC}"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}"
    echo -e "${BLUE}Preparing to push ${IMAGE_NAME} locally...${NC}"
fi

# Check if local image exists
if ! docker image inspect "${IMAGE_NAME}:${TAG}" >/dev/null 2>&1; then
    echo -e "${RED}Error: Local image ${IMAGE_NAME}:${TAG} not found!${NC}"
    echo -e "${YELLOW}Please run ./docker-build.sh first${NC}"
    exit 1
fi

# Tag images for registry if needed
if [ -n "$REGISTRY" ]; then
    echo -e "${YELLOW}Tagging images for registry...${NC}"
    docker tag "${IMAGE_NAME}:${TAG}" "${FULL_IMAGE_NAME}:${TAG}"
    docker tag "${IMAGE_NAME}:${TAG}" "${FULL_IMAGE_NAME}:${GIT_COMMIT}"
    
    # If we have a git-tagged local image and pushing latest, use it
    if [ "${TAG}" = "latest" ] && docker image inspect "${IMAGE_NAME}:${GIT_COMMIT}" >/dev/null 2>&1; then
        docker tag "${IMAGE_NAME}:${GIT_COMMIT}" "${FULL_IMAGE_NAME}:${GIT_COMMIT}"
    fi
fi

# Push the main tag
echo -e "${YELLOW}Pushing ${FULL_IMAGE_NAME}:${TAG}...${NC}"
docker push "${FULL_IMAGE_NAME}:${TAG}"

# Push git commit tag if registry is specified
if [ -n "$REGISTRY" ] && [ "$GIT_COMMIT" != "unknown" ]; then
    echo -e "${YELLOW}Pushing ${FULL_IMAGE_NAME}:${GIT_COMMIT}...${NC}"
    docker push "${FULL_IMAGE_NAME}:${GIT_COMMIT}"
fi

# Success message with pull instructions
echo -e "${GREEN}Successfully pushed images!${NC}"
echo -e "${GREEN}Tags pushed:${NC}"
echo -e "  - ${FULL_IMAGE_NAME}:${TAG}"
if [ -n "$REGISTRY" ] && [ "$GIT_COMMIT" != "unknown" ]; then
    echo -e "  - ${FULL_IMAGE_NAME}:${GIT_COMMIT}"
fi

if [ -n "$REGISTRY" ]; then
    echo -e "\n${BLUE}To pull the image:${NC}"
    echo -e "  docker pull ${FULL_IMAGE_NAME}:${TAG}"
    if [ "$GIT_COMMIT" != "unknown" ]; then
        echo -e "  docker pull ${FULL_IMAGE_NAME}:${GIT_COMMIT}"
    fi
fi

# Cleanup local registry tags if pushing to registry
if [ -n "$REGISTRY" ]; then
    echo -e "\n${YELLOW}Cleaning up local registry tags...${NC}"
    docker rmi "${FULL_IMAGE_NAME}:${TAG}" 2>/dev/null || true
    if [ "$GIT_COMMIT" != "unknown" ]; then
        docker rmi "${FULL_IMAGE_NAME}:${GIT_COMMIT}" 2>/dev/null || true
    fi
fi

echo -e "${GREEN}Done!${NC}"