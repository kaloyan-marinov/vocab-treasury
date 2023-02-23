from flask import jsonify
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth
from itsdangerous import BadSignature, SignatureExpired

# fmt: off
'''
NB:
If the next statement is replaced with
```
from src import token_serializer, flsk_bcrpt
```
then issuing `FLASK_APP=src flask db upgrade` fails with
```
Error: While importing "src", an ImportError was raised:

Traceback (most recent call last):
  File "<path-to>/vocab-treasury/backend/venv/lib/python3.8/site-packages/flask/cli.py", line 240, in locate_app
    __import__(module_name)
  File "<path-to>/vocab-treasury/backend/src/__init__.py", line 1, in <module>
    from src.vocab_treasury import app, db, flsk_bcrpt, token_serializer
  File "<path-to>/vocab-treasury/backend/src/vocab_treasury.py", line 108, in <module>
    from src.auth import (
  File "<path-to>/vocab-treasury/backend/src/auth.py", line 5, in <module>
    from src import token_serializer, flsk_bcrpt
ImportError: cannot import name 'token_serializer' from partially initialized module 'src' (most likely due to a circular import) (<path-to>/vocab-treasury/backend/src/__init__.py)
```
'''
# fmt: on
from src.vocab_treasury import token_serializer, flsk_bcrpt
from src.models import User


basic_auth = HTTPBasicAuth()


@basic_auth.verify_password
def verify_password(email, password):
    user = User.query.filter_by(email=email).first()
    if user is None:
        return None

    if flsk_bcrpt.check_password_hash(user.password_hash, password) is False:
        return None

    return user


@basic_auth.error_handler
def basic_auth_error():
    """Return a 401 error to the client."""
    r = jsonify(
        {
            "error": "Unauthorized",
            "message": "Authentication in the Basic Auth format is required.",
        }
    )
    r.status_code = 401
    # fmt: off
    '''
    source: https://blog.miguelgrinberg.com/post/designing-a-restful-api-with-python-and-flask

        Unfortunately web browsers have the nasty habit of showing an ugly login dialog
        box when a request comes back with a 401 error code.

        A simple trick to distract web browsers is to return an error code other than
        401. An alternative error code favored by many is 403, which is the "Forbidden"
        error. While this is a close enough error, it sort of violates the HTTP
        standard, so it is not the proper thing to do if full compliance is necessary.
        In particular this would be a bad idea if the client application is not a web
        browser. But for cases where server and client are developed together it saves a
        lot of trouble.
    
    source: https://flask-httpauth.readthedocs.io/en/latest/index.html

        class flask_httpauth.HTTPBasicAuth

            This class handles HTTP Basic authentication for Flask routes.

            __init__(scheme=None, realm=None)

                Create a basic authentication object.

                If the optional `scheme` argument is provided, it will be used instead
                of the standard “Basic” scheme in the `WWW-Authenticate` response. A
                fairly common practice is to use a custom scheme to prevent browsers
                from prompting the user to login.

                The `realm` argument can be used to provide an application defined realm
                with the `WWW-Authenticate` header.

    source: https://github.com/kaloyan-marinov/goal-tracker-public/blob/13c76f8abd4182e8ad559492e796476eb9d38f37/goal_tracker/auth.py

        This project also prevents web browsers from showing an ugly login dialog box
        when a request comes back with a 401 error code.

        It appears that:
        (a) this project _effectively_ uses the approach recommended by the previous
            source, but
        (b) this project's implementation is not identical to the approach recommended
            by the previous source.
        
        Recall that this project's implementation is based on the following project's
        implementation:
        https://github.com/miguelgrinberg/microblog/blob/02aae8d9816fb23b72cbeca2ac945ac2d48a6ed0/app/api/auth.py
    '''
    # fmt: on
    return r


token_auth = HTTPTokenAuth()


@token_auth.verify_token
def verify_token(token):
    try:
        token_payload = token_serializer.loads(token)
    except SignatureExpired:
        return None  # valid token, but expired
    except BadSignature:
        return None  # invalid token

    user = User.query.get(token_payload["user_id"])
    if user is None:
        return None

    return user


@token_auth.error_handler
def token_auth_error():
    """Return a 401 error to the client."""
    r = jsonify(
        {
            "error": "Unauthorized",
            "message": "Authentication in the Bearer-Token Auth format is required.",
        }
    )
    r.status_code = 401
    return r
