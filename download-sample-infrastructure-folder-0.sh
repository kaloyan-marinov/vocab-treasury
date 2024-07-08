#!/bin/bash

# Variables
GITHUB_USER=kaloyan-marinov
REPO_NAME=msdocs-python-flask-azure-container-apps-3
COMMIT_SHA=068743411e368a3f981d93e3b17b1a8b6724e94b
SUB_FOLDER=infrastructure

# Download the ZIP archive of the repository at the specific commit
curl -L -o repo.zip https://github.com/${GITHUB_USER}/${REPO_NAME}/archive/${COMMIT_SHA}.zip

# Extract the desired sub-folder
unzip repo.zip "${REPO_NAME}-${COMMIT_SHA}/${SUB_FOLDER}/*" -d infrastructure-backend

# Cleanup
rm repo.zip
