#!/bin/bash

# Script to build iOS app with better error handling

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Building iOS App - Simplified Process${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# Step 1: Install dependencies if needed
echo -e "${BLUE}Making sure all dependencies are installed...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies verified.${NC}"

# Step 2: Manually build web app
echo -e "\n${BLUE}Building web application...${NC}"
echo -e "${BLUE}Using local node_modules executables...${NC}"

# Create dist directory if it doesn't exist
mkdir -p dist

# Run vite build using npx
NODE_ENV=production npx vite build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Vite build failed.${NC}"
    exit 1
fi

# Build server
NODE_ENV=production npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Server build failed.${NC}"
    exit 1
fi
echo -e "${GREEN}Web build completed successfully.${NC}"

# Step 3: Install capacitor if needed
echo -e "\n${BLUE}Setting up Capacitor...${NC}"
npm install @capacitor/cli @capacitor/core @capacitor/ios
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install Capacitor.${NC}"
    exit 1
fi
echo -e "${GREEN}Capacitor is ready.${NC}"

# Step 4: Add iOS platform
echo -e "\n${BLUE}Adding iOS platform...${NC}"
if [ ! -d "ios" ]; then
    npx cap add ios
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to add iOS platform.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}iOS platform already exists.${NC}"
fi

# Step 5: Sync web app with iOS
echo -e "\n${BLUE}Syncing web app with iOS platform...${NC}"
npx cap sync ios
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to sync with iOS platform.${NC}"
    exit 1
fi
echo -e "${GREEN}Sync completed successfully.${NC}"

# Step 6: Open in Xcode if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "\n${BLUE}Opening project in Xcode...${NC}"
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}Warning: Xcode not found. You'll need to open the project manually.${NC}"
        echo -e "${BLUE}Navigate to the ios/App folder and open App.xcworkspace${NC}"
    else
        npx cap open ios
    fi
else
    echo -e "\n${RED}Not running on macOS. You'll need a Mac to continue.${NC}"
    echo -e "${BLUE}Transfer this project to a Mac and run:${NC}"
    echo -e "${BLUE}  npx cap open ios${NC}"
fi

echo -e "\n${GREEN}iOS build preparation completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Configure signing and capabilities in Xcode"
echo -e "2. Create app icons and splash screens"
echo -e "3. Update Info.plist with privacy descriptions"
echo -e "4. Build archive and submit to App Store"