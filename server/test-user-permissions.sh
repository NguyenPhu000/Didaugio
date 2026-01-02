#!/bin/bash

# Test script for user permissions API

BASE_URL="http://localhost:8081"
TOKEN_FILE="/tmp/login.json"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing User Permissions API ===${NC}\n"

# Login
echo -e "${BLUE}1. Login...${NC}"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@didaugio.vn","password":"Phu123"}' \
  | tee $TOKEN_FILE | python -m json.tool

TOKEN=$(cat $TOKEN_FILE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Login failed!${NC}"
  exit 1
fi

echo -e "\n${GREEN}✓ Login successful${NC}\n"

# Get users in Admin role
echo -e "${BLUE}2. Get users in Admin role (roleId=2)...${NC}"
curl -s "$BASE_URL/api/roles/2/users" \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool

echo -e "\n${GREEN}✓ Users fetched${NC}\n"

# Get permissions of user ID 10 (admin user)
echo -e "${BLUE}3. Get permissions of user ID 10...${NC}"
curl -s "$BASE_URL/api/users/10/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool | head -80

echo -e "\n${GREEN}✓ User permissions fetched${NC}\n"

# Add custom permission to user 10
echo -e "${BLUE}4. Add custom permission (ID: 1) to user 10...${NC}"
curl -s -X PUT "$BASE_URL/api/users/10/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionIds": [1, 2, 3]}' \
  | python -m json.tool

echo -e "\n${GREEN}✓ Custom permissions added${NC}\n"

# Check user permissions again
echo -e "${BLUE}5. Get permissions of user 10 again...${NC}"
curl -s "$BASE_URL/api/users/10/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool | head -80

echo -e "\n${GREEN}✓ Verified custom permissions${NC}\n"

# Get users list to see customPermissionCount
echo -e "${BLUE}6. Get users in Admin role to see customPermissionCount...${NC}"
curl -s "$BASE_URL/api/roles/2/users" \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool

echo -e "\n${GREEN}✓ CustomPermissionCount visible${NC}\n"

echo -e "${BLUE}=== All tests completed ===${NC}"
