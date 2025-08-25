#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
CONTAINER_NAME="permiso-test-$$"
TEST_DB_NAME="permiso_test_$$"
TEST_ORG_ID="test-org-$$"
TEST_PORT=${2:-5099}  # Use second argument or default to 5099
TIMEOUT=30

# Function to print colored output
print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Function to cleanup on exit
cleanup() {
    print_info "Cleaning up..."
    
    # Stop and remove test container
    if docker ps -a | grep -q $CONTAINER_NAME; then
        docker rm -f $CONTAINER_NAME >/dev/null 2>&1
        print_success "Removed test container"
    fi
    
    # Drop test database if it exists
    if [ -n "$POSTGRES_RUNNING" ]; then
        docker exec devenv-postgres-1 psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" >/dev/null 2>&1
        print_success "Dropped test database"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=15
    local attempt=1
    
    print_info "Waiting for $service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        # Try nc first, fall back to curl if not available
        if command -v nc >/dev/null 2>&1; then
            if nc -z $host $port >/dev/null 2>&1; then
                print_success "$service is ready"
                return 0
            fi
        else
            if curl -s http://$host:$port/health >/dev/null 2>&1; then
                print_success "$service is ready"
                return 0
            fi
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start after $max_attempts attempts"
    return 1
}

# Function to run GraphQL query
run_graphql_query() {
    local query=$1
    local expected_pattern=$2
    local description=$3
    
    print_info "Testing: $description"
    
    local response=$(curl -s -X POST http://localhost:$TEST_PORT/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}" 2>/dev/null)
    
    if [ -z "$response" ]; then
        print_error "No response received"
        return 1
    fi
    
    if echo "$response" | grep -q "errors"; then
        print_error "GraphQL error: $response"
        return 1
    fi
    
    if echo "$response" | grep -q "$expected_pattern"; then
        print_success "$description"
        return 0
    else
        print_error "Unexpected response: $response"
        return 1
    fi
}

# Show usage if help is requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [IMAGE] [PORT]"
    echo ""
    echo "Arguments:"
    echo "  IMAGE  Docker image to test (default: permiso:latest)"
    echo "  PORT   Port to expose the service on (default: 5099)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Test permiso:latest on port 5099"
    echo "  $0 ghcr.io/codespin-ai/permiso:latest # Test specific image"
    echo "  $0 permiso:latest 5001                # Test on specific port"
    exit 0
fi

# Parse command line arguments
IMAGE_TO_TEST=${1:-"permiso:latest"}
TEST_PORT=${2:-5099}

# Main test script
print_info "=== Permiso Docker Image Test ==="
echo

# Check if PostgreSQL is running
print_info "Checking for PostgreSQL..."
if docker ps | grep -q "devenv-postgres-1"; then
    POSTGRES_RUNNING=1
    print_success "PostgreSQL is running"
else
    print_warning "PostgreSQL not found. Starting it..."
    cd devenv && ./run.sh up -d
    cd ..
    sleep 5
    POSTGRES_RUNNING=1
fi

# Create test database
print_info "Creating test database..."
docker exec devenv-postgres-1 psql -U postgres -c "CREATE DATABASE $TEST_DB_NAME;" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Created test database: $TEST_DB_NAME"
    # Give PostgreSQL a moment to fully commit the database creation
    sleep 2
    print_info "Waiting for database to be fully available..."
else
    print_warning "Test database might already exist"
fi

print_info "Testing image: $IMAGE_TO_TEST on port $TEST_PORT"
echo

# Start the container
print_info "Starting Permiso container..."
docker run -d --rm \
    --name $CONTAINER_NAME \
    -p $TEST_PORT:5001 \
    --add-host=host.docker.internal:host-gateway \
    -e PERMISO_DB_HOST=host.docker.internal \
    -e PERMISO_DB_PORT=5432 \
    -e PERMISO_DB_NAME=$TEST_DB_NAME \
    -e PERMISO_DB_USER=postgres \
    -e PERMISO_DB_PASSWORD=postgres \
    -e UNRESTRICTED_DB_USER=unrestricted_db_user \
    -e UNRESTRICTED_DB_USER_PASSWORD=changeme_admin_password \
    -e RLS_DB_USER=rls_db_user \
    -e RLS_DB_USER_PASSWORD=changeme_rls_password \
    -e PERMISO_AUTO_MIGRATE=true \
    $IMAGE_TO_TEST >/dev/null 2>&1

if [ $? -ne 0 ]; then
    print_error "Failed to start container"
    exit 1
fi

print_success "Container started"

# Wait for the service to be ready
if ! wait_for_service localhost $TEST_PORT "Permiso GraphQL server"; then
    print_error "Server failed to start. Checking logs..."
    docker logs $CONTAINER_NAME
    exit 1
fi

# Give the server a moment to fully initialize
print_info "Waiting for server to fully initialize..."
sleep 5

echo
print_info "=== Running Tests ==="
echo

# Test 0: Health check
HEALTH_RESPONSE=$(curl -s http://localhost:$TEST_PORT/health)
if echo "$HEALTH_RESPONSE" | grep -q "\"status\":\"healthy\""; then
    print_success "Health check"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Health check failed: $HEALTH_RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 1: Create organization
if run_graphql_query \
    "mutation { createOrganization(input: {id: \\\"$TEST_ORG_ID\\\", name: \\\"Test Org\\\"}) { id name } }" \
    "\"id\":\"$TEST_ORG_ID\"" \
    "Create organization"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 2: Set string property
if run_graphql_query \
    "mutation { setOrganizationProperty(orgId: \\\"$TEST_ORG_ID\\\", name: \\\"tier\\\", value: \\\"premium\\\") { name value } }" \
    "\"value\":\"premium\"" \
    "Set string property"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 3: Set complex JSON property
if run_graphql_query \
    "mutation { setOrganizationProperty(orgId: \\\"$TEST_ORG_ID\\\", name: \\\"config\\\", value: {maxUsers: 100, features: [\\\"sso\\\", \\\"audit\\\"], active: true}) { name value } }" \
    "\"maxUsers\":100" \
    "Set complex JSON property"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 4: Set array property
if run_graphql_query \
    "mutation { setOrganizationProperty(orgId: \\\"$TEST_ORG_ID\\\", name: \\\"tags\\\", value: [\\\"tag1\\\", \\\"tag2\\\", \\\"tag3\\\"]) { name value } }" \
    "\\[\"tag1\",\"tag2\",\"tag3\"\\]" \
    "Set array property"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 5: Set number property
if run_graphql_query \
    "mutation { setOrganizationProperty(orgId: \\\"$TEST_ORG_ID\\\", name: \\\"score\\\", value: 98.5) { name value } }" \
    "\"value\":98.5" \
    "Set number property"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 6: Set boolean property
if run_graphql_query \
    "mutation { setOrganizationProperty(orgId: \\\"$TEST_ORG_ID\\\", name: \\\"active\\\", value: true) { name value } }" \
    "\"value\":true" \
    "Set boolean property"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 7: Set null property
if run_graphql_query \
    "mutation { setOrganizationProperty(orgId: \\\"$TEST_ORG_ID\\\", name: \\\"deletedAt\\\", value: null) { name value } }" \
    "\"value\":null" \
    "Set null property"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 8: Query organization with properties
if run_graphql_query \
    "query { organization(id: \\\"$TEST_ORG_ID\\\") { id name properties { name value hidden } } }" \
    "\"properties\":" \
    "Query organization with properties"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 9: Create user with properties
if run_graphql_query \
    "mutation { createUser(input: {id: \\\"test-user\\\", orgId: \\\"$TEST_ORG_ID\\\", identityProvider: \\\"test\\\", identityProviderUserId: \\\"123\\\", properties: [{name: \\\"profile\\\", value: {dept: \\\"eng\\\", level: 3}}]}) { id properties { name value } } }" \
    "\"dept\":\"eng\"" \
    "Create user with JSON properties"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 10: Create role with properties
if run_graphql_query \
    "mutation { createRole(input: {id: \\\"test-role\\\", orgId: \\\"$TEST_ORG_ID\\\", name: \\\"Admin\\\", properties: [{name: \\\"permissions\\\", value: {canEdit: true, canDelete: false}}]}) { id properties { name value } } }" \
    "\"canEdit\":true" \
    "Create role with JSON properties"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo
print_info "=== Test Summary ==="
print_success "Tests passed: ${TESTS_PASSED:-0}"
if [ "${TESTS_FAILED:-0}" -gt 0 ]; then
    print_error "Tests failed: $TESTS_FAILED"
else
    print_success "All tests passed!"
fi

echo
print_info "=== Container Health Check ==="
docker logs --tail 10 $CONTAINER_NAME 2>&1 | grep -E "(error|Error|ERROR)" >/dev/null
if [ $? -eq 0 ]; then
    print_warning "Errors found in container logs"
else
    print_success "No errors in container logs"
fi

# Show container info
echo
print_info "=== Container Information ==="
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
if [ "${TESTS_FAILED:-0}" -eq 0 ]; then
    print_success "Docker image test completed successfully!"
    exit 0
else
    print_error "Docker image test failed!"
    exit 1
fi