v1.0.0 (2020/04/27)
-------------------

``VocabTreasury`` is a web application
that supports the process of learning a foreign language.

It is developed using the following technologies:

- Python
  
- the Flask micro web framework
  
- the Jinja2 templating language
  
- the SQLite relational database management system

v1.1.0 (2020/05/03)
-------------------

- allow searching for Example resources
  not only by "TRANSLATION" but also by "NEW WORD" and "EXAMPLE"

- make page redirection more user-friendly

v1.2.0 (2021/03/22)
-------------------

- add ``README.md``

- prepare for switching from using ``conda``
  to using the Python Standard Library's ``venv`` module
  (by adding ``requirements.txt``)

- add a utility ``create_and_populate_db.py`` script

- add configuration files,
  which make it easier to develop and debug the project in VS Code

v1.2.1 (2021/03/22)
-------------------

- update the website that the web application is deployed at

- bump up the version of the ``jinja2`` package (for security reasons)

v1.2.2 (2021/03/31)
-------------------

- add Flask-Migrate to the existing project

v2.0.0 (2021/08/20)
-------------------

This is a comprehensive rewrite of the ``VocabTreasury`` project.
This rewrite splits up the project into
a backend sub-project and a frontend sub-project.

The backend sub-project uses the following technologies:

- Python

- Flask, Flask-Migrate, Flask-HTTPAuth, Flask-Bcrypt, Flask-Mail

- the Python Standard Library's ``unittest`` module, the ``coverage`` package

- SQLite

The frontend sub-project uses the following technologies:

- TypeScript

- React

- React-Router

- Redux
- Axios
- Redux-Thunk
- Jest

v2.0.1 (2021/08/22)
-------------------

- add ``CHANGELOG.rst``

- update ``frontend/public/index.html`` by replacing “React App” with “VocabTreasury”

v2.1.0 (2023/02/05)
-------------------

- switch the relational database management system from SQLite to MySQL

v2.2.0 (2023/02/28)
-------------------

- refactor the backend sub-project into a modular structure

v2.3.0 (2023/03/23)
-------------------

- introduce the concept of a user confirming their email address,
  as well as the corresponding workflow in the backend sub-project

- add several scripts within the ``backend/scripts/`` folder;
  those scripts can be used
  to require users,
  which were created prior to the application of the
  ``migrations/versions/8ff9b3efa93e_add_an_is_confirmed_column_to_the_user_.py``
  database migration script,
  to confirm their email addresses

- require every newly-created user to confirm their email address

v2.3.1 (2023/03/31)
-------------------

- update ``backend/.env.template``
  by replacing the configuration item called ``EMAIL_ADDRESS_OF_ADMINISTRATOR``
  with the following ones:
  ``EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING``
  and ``EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING``

- make it impossible for a user with an unconfirmed email address
  to request a password reset

- make the
  ``backend/scripts/script_2023_03_17_06_58_require_existing_users_to_confirm_email_addresses.py```
  script sleep for a certain amount of time
  after sending each email message

v2.4.0 (2023/11/13)
--------------------

- enable each confirmed user to edit their email address

- augment the GitHub workflow
  to get (not only the backend's tests but) also the frontend's tests
  to be executed on every push event

- address
  `this TODO <https://github.com/kaloyan-marinov/vocab-treasury/commit/45ff1c40260e4be6849b191cf2dc0d2d49a43817>`_,
  which was added to the
  ``"renders a heading, manipulation links," +
  " and a page of the logged-in user's Example resources"``
  test
  on 2021/08/05

- modularize the frontend sub-project

- make the frontend look nicer by utilizing (CSS styling based on) Bootstrap 5

v2.4.1 (2023/11/19)
-------------------

- control whether or not the component name should render
  (based on the value of the ``NODE_ENV`` environment variable)

- make the frontend sub-project use a custom-made (albeit simple) favicon

- ensure that, if one of the links in the navigation bar is clicked,
  it will be highlighted as "active"

- make the forms
  (a) have full width on viewports below Bootstrap's ``md`` breakpoint, and
  (b) have smaller width on larger viewports
