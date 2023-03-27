#!/bin/bash

COURT_REPO="https://github.com/ustaxcourt/ef-cms.git"
FLEXION_REPO="https://github.com/flexion/ef-cms.git"
SOURCE_BRANCH=$(git branch --show-current)
INTERMEDIATE_BRANCH="${SOURCE_BRANCH}-intermediate-branch"

git switch -c "${INTERMEDIATE_BRANCH}-$(date +%s)"
git pull --no-edit $COURT_REPO test

git status

# handle merge conflicts (if any)
if [[ -n $(git status --porcelain | grep '^UU') ]]; then
    echo "Merge conflict detected. Please resolve the conflict and try again."
    exit 1
fi

git push -u $FLEXION_REPO $INTERMEDIATE_BRANCH

# TODO: open the browser only if the push operation was successful
open "https:github.com/ustaxcourt/ef-cms/compare/test...flexion:${INTERMEDIATE_BRANCH}"



