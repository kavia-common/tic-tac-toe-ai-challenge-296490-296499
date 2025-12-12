#!/bin/bash
cd /home/kavia/workspace/code-generation/tic-tac-toe-ai-challenge-296490-296499/frontend_react_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

