![run-test-suite](https://github.com/kaloyan-marinov/vocab-treasury/actions/workflows/run-test-suite.yml/badge.svg)

# Table of Contents

This is the first web application that I have developed on my own.

It is currently deployed and hosted at https://vocab-treasury.kaloyan-marinov.com

The rest of this repository's documentation is organized as follows.

1. [Introduction](#introduction)

2. [How to set up the project locally](#how-to-set-up-the-project-locally)

3. [Future plans](#future-plans)

# Introduction

`VocabTreasury` is a web application
that supports the process of learning a foreign language.

Writing down new words is part and parcel of that process.
Traditionally, new words have been written down in a physical notebook;
nowadays, new words can alternatively be recorded on a tablet using a stylus.
Such written records are a reliable means for language learners
to achieving fluency in their respective target languages.

Another aspect of the reality of purposeful language learning is that
it takes a long time.
One consequence of that is the continuous accumulation of written records though time;
another consequence is that
it becomes increasingly more difficult to look up specific information,
which is imprinted in only one or two particular written records.
Maintaining an organized approach can become cumbersome even for diligent learners.

`VocabTreasury` has the following twofold objective:
    
- firstly, to serve as a single place that you can store all of your written records in,
  and
    
- secondly, to enable you to efficiently scan all your records for specific information,
  thus helping you pinpoint the one or two relevant records
  that you actually need to inspect.

# How to set up the project locally

In a nutshell, this section will explain how to
use Docker to serve a persistence layer;
use `localhost` (= the local network interface) to serve a backend application;
and use `localhost` to serve a frontend application.

1. clone this repository, and navigate into your local repository

2. create `.env` file within the `backend` subfolder of your local repository
   by taking the following steps:
    ```
    $ cp \
        backend/.env.template \
        backend/.env
    
    # Edit the content of `backend/.env` as per the comments/instructions therein.
    ```

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

    - ensure that running the tests results in a PASS by issuing one of the following -
      either:
        ```
        (venv) backend $ python -m unittest \
            discover -v \
            tests/
        ```

        or, even better:
        ```
        (venv) backend $ coverage run \
            --source=src/ \
            --omit=venv/*,tests/* \
            -m unittest \
            discover -v \
            tests/

        (venv) backend $ coverage report

        (venv) backend $ coverage html
        ```

    - create an empty database:

        ```
        $ docker run \
            --name container-v-t-mysql \
            --add-host host.docker.internal:host-gateway \
            --mount source=volume-v-t-mysql,destination=/var/lib/mysql \
            --env-file backend/.env \
            --publish 3306:3306 \
            mysql:8.0.26 \
            --default-authentication-plugin=mysql_native_password \
            --character-set-server=utf8mb4 \
            --collation-server=utf8mb4_bin \
            --skip-character-set-client-handshake
        ```

        ```
        # Verify that the new database does not contain any tables.
        
        $ docker container exec -it container-v-t-mysql /bin/bash

        root@<container_id>:/# mysql \
            -u <enter-the-value-of-MYSQL_USER-specified-within-backend/.env> \
            -p \
            <enter-the-value-of-MYSQL_DATABASE-specified-within-backend/.env>
        Enter password:

        mysql> SHOW DATABASES;
        +--------------------+
        | Database           |
        +--------------------+
        | <the-value-of-MYSQL_DATABASE-specified-within-backend/.env> |
        | information_schema |
        +--------------------+
        2 rows in set (0.01 sec)

        mysql> USE <the-value-of-MYSQL_DATABASE-specified-within-backend/.env>;
        Database changed

        mysql> SHOW TABLES;
        Empty set (0.00 sec)
        ```

    - apply all database migrations:
        ```
        (venv) backend $ FLASK_APP=src flask db upgrade
        ```

        ```
        # Verify that repeating the previous step now returns the following:

        mysql> SHOW TABLES;
        +----------------------+
        | Tables_in_db-4-v-t   |
        +----------------------+
        | alembic_version      |
        | email_address_change |
        | example              |
        | user                 |
        +----------------------+
        3 rows in set (0.00 sec)

        

        # Also, verify that the following commands generate the indicated outputs:
        
        mysql> SHOW CREATE TABLE user;
        +-------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        | Table | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                        |
        +-------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        | user  | CREATE TABLE `user` (
          `id` int NOT NULL AUTO_INCREMENT,
          `username` varchar(32) COLLATE utf8mb4_bin NOT NULL,
          `email` varchar(128) COLLATE utf8mb4_bin NOT NULL,
          `password_hash` varchar(128) COLLATE utf8mb4_bin NOT NULL,
          `is_confirmed` tinyint(1) DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `email` (`email`),
          UNIQUE KEY `username` (`username`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin |
        +-------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        1 row in set (0.00 sec)

        mysql> SHOW CREATE TABLE example;
        +---------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        | Table   | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
        +---------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        | example | CREATE TABLE `example` (
          `id` int NOT NULL AUTO_INCREMENT,
          `created` datetime NOT NULL,
          `user_id` int NOT NULL,
          `source_language` varchar(32) COLLATE utf8mb4_bin DEFAULT NULL,
          `new_word` varchar(128) COLLATE utf8mb4_bin NOT NULL,
          `content` text COLLATE utf8mb4_bin NOT NULL,
          `content_translation` text COLLATE utf8mb4_bin,
          PRIMARY KEY (`id`),
          KEY `user_id` (`user_id`),
          CONSTRAINT `example_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin |
        +---------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        1 row in set (0.01 sec)

        mysql> SHOW CREATE TABLE email_address_change;
        +----------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        | Table                | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                        |
        +----------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        | email_address_change | CREATE TABLE `email_address_change` (
          `id` int NOT NULL AUTO_INCREMENT,
          `user_id` int NOT NULL,
          `old` varchar(128) COLLATE utf8mb4_bin NOT NULL,
          `new` varchar(128) COLLATE utf8mb4_bin NOT NULL,
          `created` datetime NOT NULL,
          PRIMARY KEY (`id`),
          KEY `user_id` (`user_id`),
          CONSTRAINT `email_address_change_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin |
        +----------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        1 row in set (0.01 sec)

    - create a pre-commit Git hook that runs the `black` formatter for Python code:
        ```
        (venv) $ pre-commit install
        pre-commit installed at .git/hooks/pre-commit
        (venv) $
        ```

    - launch a terminal window and, in it, start a process
      responsible for serving the application instance
      by issuing either one of the following commands:
        ```
        (venv) backend $ python run_dev_server.py

        (venv) backend $ FLASK_APP=src flask run
        ```

    - launch another terminal window and, in it, issue each of the following requests
      and make sure you get the indicated status code in the response:
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

        $ export EMAIL_1=<a-real-email-address-that-you-have-access-to>

        $ curl -v \
            -X POST \
            -d \
                "{ \
                    \"username\": \"jd\", \
                    \"email\": \"${EMAIL_1}\", \
                    \"password\": \"123\" \
                }" \
            localhost:5000/api/users \
            | json_pp

        400

        $ curl -v \
            -X POST \
            -H "Content-Type: application/json" \
            -d \
                "{ \
                    \"username\": \"jd\", \
                    \"email\": \"${EMAIL_1}\", \
                    \"password\": \"123\" \
                }" \
            localhost:5000/api/users \
            | json_pp
        
        201

        $ curl -v \
            -X GET \
            localhost:5000/api/users/1 \
            | json_pp

        404

        # Check the inbox of `EMAIL_1`.
        # You will receive an email with instructions
        # for confirming the newly-created user's email address.
        # Follow those instructions.

        $ curl -v \
            -X GET \
            localhost:5000/api/users/1 \
            | json_pp
        
        200

        ---

        $ export EMAIL_2_1=<another-real-email-address-that-you-have-access-to>

        $ curl -v \
            -X POST \
            -H "Content-Type: application/json" \
            -d \
                "{ \
                    \"username\": \"ms\", \
                    \"email\": \"${EMAIL_2_1}\", \
                    \"password\": \"456\"\
                }" \
            localhost:5000/api/users \
            | json_pp

        201

        # Check the inbox of `EMAIL_2_1`.
        # You will receive an email with instructions
        # for confirming the newly-created user's email address.
        # Follow those instructions.

        ----

        $ curl -v \
            -X PUT \
            -d '{"username": "JD"}' \
            localhost:5000/api/users/1 \
            | json_pp

        401

        $ curl -v \
            -X PUT \
            -u ${EMAIL_1}:123 \
            -d '{"username": "JD"}' \
            localhost:5000/api/users/1 \
            | json_pp

        400

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u ${EMAIL_1}:123 \
            -d '{"username": "JD"}' \
            localhost:5000/api/users/2 \
            | json_pp

        403

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u ${EMAIL_1}:123 \
            -d "{ \
                    \"username\": \"JD\", \
                    \"email\": \"JOHN.DOE@PROTONMAIL.COM\" \
                }" \
            localhost:5000/api/users/1 \
            | json_pp
        
        400

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u ${EMAIL_1}:123 \
            -d "{ \
                    \"username\": \"JD\" \
                }" \
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
            -u ${EMAIL_2_1}:wrong-password \
            -d "{ \
                    \"username\": \"MS\" \
                }" \
            localhost:5000/api/users/2 \
            | json_pp

        401

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u ${EMAIL_2_1}:456 \
            -d "{ \
                    \"username\": \"JD\" \
                }" \
            localhost:5000/api/users/2 \
            | json_pp

        400

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u ${EMAIL_2_1}:456 \
            -d "{ \
                    \"email\": \"${EMAIL_1}\" \
                }" \
            localhost:5000/api/users/2 \
            | json_pp
        
        400

        $ export EMAIL_2_2=MARY.SMITH@PROTONMAIL.COM

        $ curl -v \
            -X PUT \
            -H "Content-Type: application/json" \
            -u ${EMAIL_2_1}:456 \
            -d "{ \
                    \"email\": \"${EMAIL_2_2}\" \
                }" \
            localhost:5000/api/users/2 \
            | json_pp
        
        202

        # Check the inbox of `EMAIL_2_2`.
        # You will receive an email with instructions
        # for confirming the new email address.
        # Follow those instructions.

        ---

        $ curl -v \
            -X DELETE \
            localhost:5000/api/users/1 \
            | json_pp

        401

        $ curl -v \
            -X DELETE \
            -u ${EMAIL_1}:123 \
            localhost:5000/api/users/2 \
            | json_pp

        403

        $ curl -v \
            -X DELETE \
            -u ${EMAIL_1}:123 \
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
            -u ${EMAIL_2_2}:wrong-password \
            localhost:5000/api/users/2 \
            | json_pp

        401

        ---

        $ curl -v \
            -X POST \
            -u ${EMAIL_2_2}:456 \
            localhost:5000/api/tokens \
            | json_pp

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
            -d \
                "{ \
                    \"source_language\": \"German\", \
                    \"new_word\": \"die Tasse, -n\", \
                    \"content\": \"e-e Tasse Kaffe\" \
                }" \
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
            -d \
                "{ \
                    \"content_translation\": \"a cup of coffee\" \
                }" \
            localhost:5000/api/examples/1 \
            | json_pp
        
        200

        $ curl -v \
            -X DELETE \
            -u ${EMAIL_2_2}:456 \
            localhost:5000/api/users/2 \
            | json_pp
        

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
    
    - launch a terminal window and, in it, start a process
      responsible for serving the application instance:
        ```
        frontend $ npm start
        ```
    
    - launch a web browser, and enter `localhost:3000` into its address bar

# Future plans

- modularize the frontend

- enable every newly-created user to confirm their email address
  through the frontend

- allow each user to export their personal data in JSON format

- make it possible for users to upload audio files
