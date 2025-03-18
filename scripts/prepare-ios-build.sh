#!/bin/bash

# Script to prepare iOS build

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Preparing iOS Build for App Store Submission${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# Check if npm is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed.${NC}"
    exit 1
fi

# Build the web app
echo -e "\n${BLUE}Building web application...${NC}"
echo -e "${BLUE}Using NPX to ensure vite is available...${NC}"
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Web build failed.${NC}"
    exit 1
fi
echo -e "${GREEN}Web build completed successfully.${NC}"

# Check if capacitor is installed
echo -e "\n${BLUE}Checking Capacitor installation...${NC}"
if ! npx cap --version &> /dev/null; then
    echo -e "${BLUE}Installing Capacitor CLI...${NC}"
    npm install -g @capacitor/cli
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install Capacitor CLI.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}Capacitor is ready.${NC}"

# Check if iOS platform is added
echo -e "\n${BLUE}Checking iOS platform...${NC}"
if [ ! -d "ios" ]; then
    echo -e "${BLUE}Adding iOS platform...${NC}"
    npx cap add ios
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to add iOS platform.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}iOS platform already exists.${NC}"
fi

# Sync web app with iOS platform
echo -e "\n${BLUE}Syncing web app with iOS platform...${NC}"
npx cap sync ios
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to sync with iOS platform.${NC}"
    exit 1
fi
echo -e "${GREEN}Sync completed successfully.${NC}"

# Verify if on macOS for Xcode operations
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}Warning: Xcode command line tools not found. Cannot proceed with iOS build.${NC}"
        echo -e "${BLUE}You will need to open the project in Xcode manually.${NC}"
    else
        echo -e "\n${BLUE}Opening project in Xcode...${NC}"
        npx cap open ios
    fi
else
    echo -e "\n${RED}Warning: Not running on macOS. Cannot open Xcode.${NC}"
    echo -e "${BLUE}You will need to continue on a Mac computer to build for iOS.${NC}"
fi

echo -e "\n${GREEN}iOS build preparation completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Configure signing and capabilities in Xcode"
echo -e "2. Create app icons and splash screens"
echo -e "3. Update Info.plist with privacy descriptions"
echo -e "4. Build archive and submit to App Store"
echo -e "\n${BLUE}See ios-app-guide.md for detailed instructions.${NC}"