#!/bin/bash

# Variables
GITHUB_USER=<username>
REPO_NAME=ABC
COMMIT_SHA=abc
SUB_FOLDER=path/to/sub-folder

# Download the ZIP archive of the repository at the specific commit
curl -L -o repo.zip https://github.com/${GITHUB_USER}/${REPO_NAME}/archive/${COMMIT_SHA}.zip

# Extract the desired sub-folder
unzip repo.zip "${REPO_NAME}-${COMMIT_SHA}/${SUB_FOLDER}/*" -d infrastructure-backend

# Cleanup
rm repo.zip
