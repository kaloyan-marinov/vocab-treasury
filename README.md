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

3. at the the root of your local repository, create a `.env` file with the following structure:
    ```
    SECRET_KEY=<specify-a-good-secret-key-here>
    SQLALCHEMY_DATABASE_URI=sqlite:///<absolute-path-starting-with-a-leading-slash-and-pointing-to-an-SQLite-file>


    EMAIL_USER=<email-account-that-you-are-in-charge-of>
    EMAIL_PASS=<the-password-associated-with-the-email-account>
    ```

    (For deployment, you should generate a "good secret key" and store that value in `SECRET_KEY` within the `.env` file; to achieve that, take a look at the "How to generate good secret keys" section on https://flask.palletsprojects.com/en/1.1.x/quickstart/ . For local development, something like `keep-this-value-known-only-to-the-deployment-machine` should suffice.)

4. create a SQLite3 database and insert some data into it:
    ```
    (venv) $ python create_and_populate_db.py
    ```

5. verify that the database was created successfully:
    ```
    (venv) $ ll <the-value-of-DATABASE_URL-in-your-.env-file> 
    -rw-r--r--  1 <your-user>  <your-group>    20K Mar  5 15:03 <the-value-of-DATABASE_URL-in-your-.env-file>
    (venv) $ sqlite3 <the-value-of-DATABASE_URL-in-your-.env-file> 
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

6. optionally, take a look at the data that has just been inserted into the database:
    ```
    $ sqlite3 <the-value-of-DATABASE_URL-in-your-.env-file> 
    SQLite version 3.30.1 2019-10-10 20:19:45
    Enter ".help" for usage hints.
    sqlite> .tables
    example  user   
    sqlite> SELECT * FROM user;
    id          username    email                  password                                                    
    ----------  ----------  ---------------------  ------------------------------------------------------------
    1           du          DeployedUser@test.com  $2b$12$JxB1yI2QX1NL26dsIFbbDOUrH3oDMN3QdKUicyX1L62b5oOzRLNjm
    2           jd          john.doe@gmail.com     $2b$12$j7ljn7S3gTh9z/obSRSLJuwHMnLCSqqrLOguqZdR2Unr1VPz2/gnS
    3           ms          mary.smith@yahoo.com   $2b$12$U0S6cEuZkuJbQJlqpGj66u9kFA/16mQsCpRfYx.0Kgbm0bIjtQWFq
    sqlite> SELECT * FROM example;
    id          created                     user_id     source_language  new_word    content                   content_translation         
    ----------  --------------------------  ----------  ---------------  ----------  ------------------------  ----------------------------
    1           2021-03-22 14:21:57.850175  2           Finnish          lautanen    Lautasella on spagettia.  There is pasta on the plate.
    2           2021-03-22 14:21:57.851096  1           l-1              ABC         PQR                       XYZ                         
    3           2021-03-22 14:21:57.851227  1           l-2              ABC         XYZ                       PQR                         
    4           2021-03-22 14:21:57.851321  1           l-3              PQR         ABC                       XYZ                         
    5           2021-03-22 14:21:57.851410  1           l-4              PQR         XYZ                       ABC                         
    6           2021-03-22 14:21:57.851498  1           l-5              XYZ         ABC                       PQR                         
    7           2021-03-22 14:21:57.851582  1           l-6              XYZ         PQR                       ABC                         
    8           2021-03-22 14:21:57.851664  2           German           sich (A) z  Ich finde mich gar nicht  I can't manage anymore.
    ```

7. ensure that running the tests results in a PASS:
    ```
    sqlite> .quit
    (venv) $ python -m unittest discover -v tests/
    .
    .
    .
    ----------------------------------------------------------------------
    Ran 26 tests in 6.245s

    OK
    ```

8. start a process responsible for serving the application instance:
    ```
    (venv) $ python run.py
    ```

    (alternatively, if you wish to perform this step through VS Code's GUI, modify `.vscode/settings.json` by replacing the value associated to the `"python.pythonPath"` key with the location of the Python executable in your Python virtual environment)

9. launch a web browser, navigate to `localhost:5000`, and interact with the web interface

# Future plans

Since this is my first web application, I have cut a few corners during its development. I am currently planning how to improve the project, which will likely include modularizing the codebase into two loosely coupled sub-projects: a backend and a frontend.