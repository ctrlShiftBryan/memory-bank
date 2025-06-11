#!/bin/bash

# Run only the auth tests
echo "Running authentication tests..."
npx playwright test tests/e2e/specs/auth.spec.ts --reporter=list

# Show test results
echo ""
echo "Test run complete!"