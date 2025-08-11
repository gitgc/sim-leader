#!/bin/bash

# Formula Evergreen Championship - Test Runner Script
# This script runs all tests and generates a coverage report

echo "🏎️  Formula Evergreen Championship - Running Tests"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🧪 Running test suite..."
echo "------------------------"

# Run tests with coverage
npm run test:coverage

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "📊 Coverage report generated in: coverage/"
    echo "   Open coverage/lcov-report/index.html in your browser to view detailed coverage"
    echo ""
    echo "🚀 Ready for development!"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi
