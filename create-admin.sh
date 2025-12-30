#!/bin/bash

echo "================================"
echo "Creating Default Admin Account"
echo "================================"
echo ""

cd backend
npm run seed:admin

echo ""
echo "================================"
echo "Done!"
echo "================================"
