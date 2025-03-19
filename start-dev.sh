#!/bin/bash

# Start the server
cd server && npm run dev &

# Wait for server to start
sleep 2

# Start the client
cd .. && npm run dev 