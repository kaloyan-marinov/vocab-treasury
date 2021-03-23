# Table of Contents

This is the first web application that I have developed on my own.

It is currently deployed and hosted at https://vocab-treasury.kaloyan-marinov.com

The rest of this repository's documentation is organized as follows.

1. [Introduction](#introduction)

2. [How to set up the project locally](#how-to-set-up-the-project-locally)

3. [Future plans](#future-plans)
# Introduction

`VocabTreasury` is a web application that supports the process of learning a foreign language.

Writing down new words is part and parcel of that process. Traditionally, new words have been written down in a physical notebook; nowadays, new words can alternatively be recorded on a tablet using a stylus. Such written records are a reliable means for language learners to achieving fluency in their respective target languages.

Another aspect of the reality of purposeful language learning is that it takes a long time. One consequence of that is the continuous accumulation of written records though time; another consequence is that it becomes increasingly more difficult to look up specific information, which is imprinted in only one or two particular written records. Maintaining an organized approach can become cumbersome even for diligent learners.

`VocabTreasury` has the following twofold objective:
    
- firstly, to serve as a single place that you can store all of your written records in, and
    
 - secondly, to enable you to efficiently scan all your records for specific information, thus helping you pinpoint the one or two relevant records that you actually need to inspect.

# How to set up the project locally

1. clone this repository, and navigate into your local repository

2. create a Python virtual environment, activate it, and install all dependencies:
    ```
    $ python3 --version
    Python 3.8.3

    $ python3 -m venv venv

    $ source venv/bin/activate
    (venv) $ pip install --upgrade pip
    (venv) $ pip install -r requirements.txt
    ```

3. ensure that running the tests results in a PASS by issuing one of the following - either:
    ```
    (venv) $ python -m unittest backend/tests.py

    (venv) $ python \
        -m unittest \
        discover -v \
        backend/
    ```

    or, even better:
    ```
    (venv) $ coverage run \
        --source=backend/ \
        --omit=backend/tests.py \
        -m unittest \
        discover -v \
        backend/

    (venv) $ coverage report

    (venv) $ coverage html
    ```

4. create a pre-commit Git hook that runs the `black` formatter for Python code:
    ```
    (venv) $ pre-commit install
    pre-commit installed at .git/hooks/pre-commit
    (venv) $
    ```

    upon making the previous commit, the following notification was printed in the terminal window:
    ```
    (venv) vocab-treasury $ git commit -m '19: pip install coverage'
    [WARNING] The 'rev' field of repo 'https://github.com/ambv/black' appears to be a mutable reference (moving tag / branch).  Mutable references are never updated after first install and are not supported.  See https://pre-commit.com/#using-the-latest-version-for-a-repository for more details.  Hint: `pre-commit autoupdate` often fixes this.
    black................................................(no files to check)Skipped
    [2021/03/23/13_46/19/build-a-brand-new-backend 9b3ad00] 19: pip install coverage
    3 files changed, 23 insertions(+), 2 deletions(-)
    ```
    so I issued:
    ```
    (venv) vocab-treasury $ pre-commit autoupdate
    [WARNING] The 'rev' field of repo 'https://github.com/ambv/black' appears to be a mutable reference (moving tag / branch).  Mutable references are never updated after first install and are not supported.  See https://pre-commit.com/#using-the-latest-version-for-a-repository for more details.  Hint: `pre-commit autoupdate` often fixes this.
    [WARNING] The 'rev' field of repo 'https://github.com/ambv/black' appears to be a mutable reference (moving tag / branch).  Mutable references are never updated after first install and are not supported.  See https://pre-commit.com/#using-the-latest-version-for-a-repository for more details.  Hint: `pre-commit autoupdate` often fixes this.
    Updating https://github.com/ambv/black ... [INFO] Initializing environment for https://github.com/ambv/black.
    updating stable -> 20.8b1.
    ```
    which made a change to the `.pre-commit-config.yaml` file; that change and the change introducing this comment are committed in the repository with a single/common changeset

5. start a process responsible for serving the application instance by issuing either one of the following commands:
    ```
    (venv) $ python backend/vocab_treasury.py

    (venv) $ FLASK_APP=backend/vocab_treasury.py flask run
    ```

6. launch a web browser, navigate to `localhost:5000`, and make sure that "Hello world!" is rendered on the screen
