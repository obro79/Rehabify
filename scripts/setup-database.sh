#!/bin/bash

# =============================================================================
# Rehabify Database Setup Script
#
# This script sets up the complete database with one command.
# Run this after setting your DATABASE_URL environment variable.
#
# Usage:
#   ./scripts/setup-database.sh
#
# Or with explicit DATABASE_URL:
#   DATABASE_URL="postgresql://..." ./scripts/setup-database.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "======================================"
echo "  Rehabify Database Setup"
echo "======================================"
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    # Try to load from .env.local
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    elif [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not found${NC}"
    echo ""
    echo "Please set DATABASE_URL in one of these ways:"
    echo "  1. Add to .env.local file"
    echo "  2. Export as environment variable"
    echo "  3. Run with: DATABASE_URL='...' ./scripts/setup-database.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL found"
echo ""

# Check for psql
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: psql not found, using Drizzle Kit instead${NC}"
    USE_DRIZZLE=true
else
    USE_DRIZZLE=false
fi

# Function to run SQL file
run_migration() {
    local file=$1
    local name=$2

    echo -n "Running $name... "

    if [ "$USE_DRIZZLE" = true ]; then
        # Use drizzle-kit push (schema must be defined in drizzle config)
        npx drizzle-kit push 2>/dev/null
        echo -e "${GREEN}✓${NC}"
    else
        if psql "$DATABASE_URL" -f "$file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
            return 1
        fi
    fi
}

# Run migrations
echo "Step 1: Running schema migration..."
if [ -f "src/db/migrations/001_complete_schema.sql" ]; then
    if [ "$USE_DRIZZLE" = false ]; then
        run_migration "src/db/migrations/001_complete_schema.sql" "schema migration"
    else
        echo -e "${YELLOW}Using Drizzle Kit for schema...${NC}"
        npx drizzle-kit push
        echo -e "${GREEN}✓ Schema pushed${NC}"
    fi
else
    echo -e "${RED}Error: Migration file not found${NC}"
    exit 1
fi

echo ""
echo "Step 2: Running seed data (200 exercises, achievements)..."
if [ -f "src/db/migrations/002_seed_data.sql" ]; then
    if [ "$USE_DRIZZLE" = false ]; then
        run_migration "src/db/migrations/002_seed_data.sql" "seed data"
    else
        echo -e "${YELLOW}Seeding with psql...${NC}"
        # For seed data, we still need psql or a Node script
        if command -v psql &> /dev/null; then
            psql "$DATABASE_URL" -f "src/db/migrations/002_seed_data.sql" 2>/dev/null
            echo -e "${GREEN}✓ Seed data inserted${NC}"
        else
            echo -e "${YELLOW}Skipping seed (psql not available)${NC}"
            echo "Run manually: psql \$DATABASE_URL -f src/db/migrations/002_seed_data.sql"
        fi
    fi
else
    echo -e "${YELLOW}Seed file not found, skipping...${NC}"
fi

echo ""
echo "Step 3: Running mock data (demo accounts, sessions)..."
if [ -f "src/db/migrations/003_mock_data.sql" ]; then
    if command -v psql &> /dev/null; then
        psql "$DATABASE_URL" -f "src/db/migrations/003_mock_data.sql" 2>/dev/null
        echo -e "${GREEN}✓ Mock data inserted${NC}"
    else
        echo -e "${YELLOW}Skipping mock data (psql not available)${NC}"
        echo "Run manually: psql \$DATABASE_URL -f src/db/migrations/003_mock_data.sql"
    fi
else
    echo -e "${YELLOW}Mock data file not found, skipping...${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}Database setup complete!${NC}"
echo "======================================"
echo ""
echo "Demo Accounts:"
echo "  PT:      dr.sarah@rehabify.demo"
echo "  Patient: alex.patient@rehabify.demo"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm dev' to start the development server"
echo "  2. Open http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  npx drizzle-kit studio  - Open database GUI"
echo "  npx drizzle-kit push    - Push schema changes"
echo "  pnpm db:mock            - Re-run mock data only"
echo ""
