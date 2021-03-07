# Table of Contents

This is the first web application that I have developed on my own.

It is currently deployed and hosted at https://vocabtreasury.com

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

2. install the `conda` package manager

    The version I used is:
    ```
    $ conda --version
    conda 4.5.12
    ```

3. create a `conda` environment, install the project dependencies, and activate the environment:
    ```
    $ conda env create --file environment.yml

    $ conda activate repo_vocab_treasury

    (repo_vocab_treasury) $ 
    ```

4. at the the root of your local repository, create a `.env` file with the following structure:
    ```
    SECRET_KEY=<specify-a-good-secret-key-here>
    SQLALCHEMY_DATABASE_URI=sqlite:///site.db

    EMAIL_USER=<email-account-that-you-are-in-charge-of>
    EMAIL_PASS=<the-password-associated-with-the-email-account>
    ```

    (For deployment, you should generate a "good secret key" and store that value in `SECRET_KEY` within the `.env` file; to achieve that, take a look at the "How to generate good secret keys" section on https://flask.palletsprojects.com/en/1.1.x/quickstart/ . For local development, something like `keep-this-value-known-only-to-the-deployment-machine` should suffice.)

5. create a SQLite3 database and insert some data into it:
    ```
    (repo_vocab_treasury) $ python create_and_populate_db.py
    ```

6. verify that the database was created successfully:
    ```
    (repo_vocab_treasury) $ ll vocab_treasury/site.db 
    -rw-r--r--  1 <your-user>  <your-group>    20K Mar  5 15:03 vocab_treasury/site.db
    (repo_vocab_treasury) $ sqlite3 vocab_treasury/site.db 
    SQLite version 3.30.1 2019-10-10 20:19:45
    Enter ".help" for usage hints.
    sqlite> .tables
    example  user   
    sqlite> .schema user
    CREATE TABLE user (
            id INTEGER NOT NULL, 
            username VARCHAR(20) NOT NULL, 
            email VARCHAR(120) NOT NULL, 
            password VARCHAR(60) NOT NULL, 
            PRIMARY KEY (id), 
            UNIQUE (username), 
            UNIQUE (email)
    );
    sqlite> .schema example 
    CREATE TABLE example (
            id INTEGER NOT NULL, 
            created DATETIME NOT NULL, 
            user_id INTEGER NOT NULL, 
            source_language VARCHAR(30), 
            new_word VARCHAR(30) NOT NULL, 
            content TEXT NOT NULL, 
            content_translation TEXT, 
            PRIMARY KEY (id), 
            FOREIGN KEY(user_id) REFERENCES user (id)
    );
    ```

7. optionally, take a look at the data that has just been inserted into the database:
    ```
    $ sqlite3 vocab_treasury/site.db 
    SQLite version 3.30.1 2019-10-10 20:19:45
    Enter ".help" for usage hints.
    sqlite> .tables
    example  user   
    sqlite> .schema user
    CREATE TABLE user (
            id INTEGER NOT NULL, 
            username VARCHAR(20) NOT NULL, 
            email VARCHAR(120) NOT NULL, 
            password VARCHAR(60) NOT NULL, 
            PRIMARY KEY (id), 
            UNIQUE (username), 
            UNIQUE (email)
    );
    sqlite> .schema example 
    CREATE TABLE example (
            id INTEGER NOT NULL, 
            created DATETIME NOT NULL, 
            user_id INTEGER NOT NULL, 
            source_language VARCHAR(30), 
            new_word VARCHAR(30) NOT NULL, 
            content TEXT NOT NULL, 
            content_translation TEXT, 
            PRIMARY KEY (id), 
            FOREIGN KEY(user_id) REFERENCES user (id)
    );
    ```

8. ensure that running the tests results in a PASS:
    ```
    sqlite> .quit
    (repo_vocab_treasury) $ python -m unittest discover -v tests/
    .
    .
    .
    ----------------------------------------------------------------------
    Ran 26 tests in 6.245s

    OK
    ```

9. start a process responsible for serving the application instance:
    ```
    (repo_vocab_treasury) $ python run.py
    ```

    (alternatively, if you wish to perform this step through VS Code's GUI, modify `.vscode/settings.json` by replacing the value associated to the `"python.pythonPath"` key with the location of your conda environment's Python executable)

10. launch a web browser, navigate to `localhost:5000`, and interact with the web interface

# Future plans

Since this is my first web application, I have cut a few corners during its development. I am currently planning how to improve the project, which will likely include modularizing the codebase into two loosely coupled sub-projects: a backend and a frontend.