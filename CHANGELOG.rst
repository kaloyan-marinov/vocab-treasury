v1.0.0 (2020/04/27)
-------------------

`VocabTreasury` is a web application that supports the process of learning a foreign language.

It was developed using the following technologies:

- Python
  
- the Flask micro web framework
  
- the Jinja2 templating language
  
- the SQLite relational database management system

v1.1.0 (2020/05/03)
-------------------

- allow searching for Example resources not only by "TRANSLATION" but also by "NEW WORD" and "EXAMPLE"

- make page redirection more user-friendly

v1.2.0 (2021/03/22)
-------------------

- add `README.md`

- prepare for switching from using `conda` to using the Python Standard Library's `venv` module (by adding `requirements.txt`)

- add a utility `create_and_populate_db.py` script

- add configuration files, which make it easier to develop and debug the project in VS Code

v1.2.1 (2021/03/22)
-------------------

- update the website that the web application is deployed at

- bump up the version of the `jinja2` package (for security reasons)

v1.2.2 (2021/03/31)
-------------------

- add Flask-Migrate to the existing project

v2.0.0 (2021/08/20)
-------------------

This is a comprehensive rewrite of `VocabTreasury`. It is split up into a backend sub-project and a frontend sub-project.

The backend sub-project uses the following technologies:

- Python

- Flask, Flask-Migrate, Flask-HTTPAuth, Flask-Bcrypt, Flask-Mail

- the Python Standard Library's `unittest` module, the `coverage` package

- SQLite

The frontend sub-project uses the following technologies:

- TypeScript

- React

- React-Router

- Redux
- Axios
- Redux-Thunk
- Jest