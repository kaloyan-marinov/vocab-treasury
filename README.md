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

2. in the `backend` subfolder of your local repository, create a `.env` file with the following structure:
    ```
    SECRET_KEY=<specify-a-good-secret-key-here>

    SQLALCHEMY_DATABASE_URI=sqlite:///<absolute-path-starting-with-a-leading-slash-and-pointing-to-an-SQLite-file>

    MAIL_SERVER=
    MAIL_PORT=
    #MAIL_USE_TLS =  True
    MAIL_USERNAME=
    MAIL_PASSWORD=
    ```
    (For deployment, you should generate a "good secret key" and store that value in SECRET_KEY within the `.env` file; to achieve that, take a look at the "How to generate good secret keys" section on https://flask.palletsprojects.com/en/1.1.x/quickstart/ . For local development, something like `keep-this-value-known-only-to-the-deployment-machine` should suffice.)

3. set up the backend:

    - navigate into the `backend` subfolder:
        ```
        $ cd backend
        ```

    - create a Python virtual environment, activate it, and install all dependencies:
        ```
        backend $ python3 --version
        Python 3.8.3

        backend $ python3 -m venv venv

        backend $ source venv/bin/activate
        (venv) backend $ pip install --upgrade pip
        (venv) backend $ pip install -r requirements.txt
        ```

    - ensure that running the tests results in a PASS by issuing one of the following - either:
        ```
        (venv) backend $ python -m unittest tests.py

        (venv) backend $ python \
            -m unittest \
            discover -v \
            .
        ```

        or, even better:
        ```
        (venv) backend $ coverage run \
            --source=./ \
            --omit=venv/*,tests.py \
            -m unittest \
            discover -v \
            .

        (venv) backend $ coverage report

        (venv) backend $ coverage html
        ```

    - create an empty SQLite database and apply all database migrations:
        ```
        (venv) backend $ FLASK_APP=vocab_treasury.py flask db upgrade
        ```

    - verify that the previous step was successful by issuing `$ sqlite3 <the-value-of-SQLALCHEMY_DATABASE_URI-in-your.env-file>` and then issuing:
        ```
        SQLite version 3.32.3 2020-06-18 14:16:19
        Enter ".help" for usage hints.
        sqlite> .tables
        alembic_version  user           
        sqlite> .schema user
        CREATE TABLE user (
                id INTEGER NOT NULL, 
                username VARCHAR(20) NOT NULL, 
                email VARCHAR(120) NOT NULL, 
                password_hash VARCHAR(60) NOT NULL, 
                PRIMARY KEY (id), 
                UNIQUE (email), 
                UNIQUE (username)
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
        sqlite> .quit
        ```

    - create a pre-commit Git hook that runs the `black` formatter for Python code:
        ```
        (venv) $ pre-commit install
        pre-commit installed at .git/hooks/pre-commit
        (venv) $
        ```

    - launch a terminal window and, in it, start a process responsible for serving the application instance by issuing either one of the following commands:
        ```
        (venv) backend $ python vocab_treasury.py

        (venv) backend $ FLASK_APP=vocab_treasury.py flask run
        ```

    - launch another terminal window and, in it, issue the following request and make sure you get the indicated status code in the response:
        ```
        $ curl -v \
            -X GET \
            localhost:5000/api/users \
            | json_pp

        200

        ---------

        $ curl -v \
            -X GET \
            localhost:5000/api/users/1 \
            | json_pp
        
        404

        ---------

        $ curl -v \
            -X POST \
            -d '{"username": "jd", "email": "john.doe@protonmail.com", "password": "123"}' \
            localhost:5000/api/users \
            | json_pp

        400

        $ curl -v \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"username": "jd", "email": "john.doe@protonmail.com", "password": "123"}' \
            localhost:5000/api/users \
            | json_pp
        
        201

        $ curl -v \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"username": "ms", "email": "mary.smith@yahoo.com", "password": "456"}' \
            localhost:5000/api/users \
            | json_pp

        201

        ----

        $ curl -v \
            -X PUT \
            -d '{"username": "j-d"}' \
            localhost:5000/api/users/1 \
            | json_pp

        401

        $ curl -v \
            -X PUT \
            -u john.doe@protonmail.com:123 \
            -d '{"username": "j-d"}' \
            localhost:5000/api/users/1 \
            | json_pp

        400

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u john.doe@protonmail.com:123 \
            -d '{"username": "j-d"}' \
            localhost:5000/api/users/2 \
            | json_pp

        403

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u john.doe@protonmail.com:123 \
            -d '{"username": "JD", "email": "JOHN.DOE@PROTONMAIL.COM"}' \
            localhost:5000/api/users/1 \
            | json_pp
        
        200

        $ curl -v \
            -X GET \
            localhost:5000/api/users \
            | json_pp

        200

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u mary.smith@yahoo.com:456 \
            -d '{"email": "JOHN.DOE@PROTONMAIL.COM"}' \
            localhost:5000/api/users/2 \
            | json_pp

        400

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u mary.smith@yahoo.com:wrong-password \
            -d '{"email": "MARY.SMITH@YAHOO.COM"}' \
            localhost:5000/api/users/2 \
            | json_pp

        401

        ---

        $ curl -v \
            -X DELETE \
            localhost:5000/api/users/1 \
            | json_pp

        401

        $ curl -v \
            -X DELETE \
            -u JOHN.DOE@PROTONMAIL.COM:123 \
            localhost:5000/api/users/2 \
            | json_pp

        403

        $ curl -v \
            -X DELETE \
            -u JOHN.DOE@PROTONMAIL.COM:123 \
            localhost:5000/api/users/1 \
            | json_pp

        204

        $ curl -v \
            -X GET \
            localhost:5000/api/users/1 \
            | json_pp

        404

        $ curl -v \
            -X DELETE \
            -u mary.smith@yahoo.com:wrong-password \
            localhost:5000/api/users/2 \
            | json_pp

        401

        ---

        $ curl -v \
            -X POST \
            -u mary.smith@yahoo.com:456 \
            localhost:5000/api/tokens

        200

        $ export T2=<the-json-web-signature-token-from-the-previous-response>

        $ curl -v \
            -H "Authorization: Bearer ${T2}" \
            localhost:5000/api/examples \
            | json_pp

        200

        $ curl -v \
            -X POST \
            -H "Authorization: Bearer ${T2}" \
            -H "Content-Type: application/json" \
            -d '{"source_language": "German", "new_word": "die Tasse, -n", "content": "e-e Tasse Kaffe"}' \
            localhost:5000/api/examples \
            | json_pp

        201

        $ curl -v \
            -H "Authorization: Bearer ${T2}" \
            localhost:5000/api/examples/1 \
            | json_pp

        200

        $ curl -v \
            -X PUT \
            -H "Authorization: Bearer ${T2}" \
            -H "Content-Type: application/json" \
            -d '{"content_translation": "a cup of coffee"}' \
            localhost:5000/api/examples/1 \
            | json_pp
        
        200
        ```

4. set up the frontend:

    - navigate into the `frontend` subfolder:
        ```
        $ cd frontend
        ```
    
    - install the Node.js dependencies
        ```
        frontend $ npm install

        frontend $ npm audit fix
        ```
    
    - ensure that running the tests results in a PASS:
        ```
        frontend $ npm test -- \
            --watchAll \
            --coverage \
            --verbose
        ```
    
    - launch a terminal window and, in it, start a process responsible for serving the application instance:
        ```
        frontend $ npm start
        ```
    
    - launch a web browser, and enter `localhost:3000` into its address bar
