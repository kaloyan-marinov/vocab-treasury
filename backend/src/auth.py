from flask import jsonify, current_app, g
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth
from itsdangerous import BadSignature, SignatureExpired

from src import flsk_bcrpt
from src.models import User
from src.constants import EMAIL_ADDRESS_CONFIRMATION, ACCESS, PASSWORD_RESET


basic_auth = HTTPBasicAuth()


@basic_auth.verify_password
def verify_password(email, password):
    user = User.query.filter_by(email=email).first()

    if user is None:
        return None

    if not user.is_confirmed:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "Your email address has not been confirmed."
                    " Please confirm your email address"
                    " and re-issue the same HTTP request."
                ),
            }
        )
        r.status_code = 400
        g.response_for_unconfirmed_email_address = r
        return None

    if flsk_bcrpt.check_password_hash(user.password_hash, password) is False:
        return None

    return user


@basic_auth.error_handler
def basic_auth_error():
    """Return an appropriate error to the client."""
    if hasattr(g, "response_for_unconfirmed_email_address"):
        return g.response_for_unconfirmed_email_address

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
        token_payload = current_app.token_serializer.loads(token)
    except SignatureExpired:
        return None  # valid token, but expired
    except BadSignature:
        return None  # invalid token

    if token_payload["purpose"] != ACCESS:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "The provided token's `purpose` is"
                    f" different from {repr(ACCESS)}."
                ),
            }
        )
        r.status_code = 400
        g.response_for_inadmissible_token_purpose = r
        return None

    user = User.query.get(token_payload["user_id"])
    if user is None:
        return None

    return user


@token_auth.error_handler
def token_auth_error():
    """Return an appropriate error to the client."""
    if hasattr(g, "response_for_inadmissible_token_purpose"):
        return g.response_for_inadmissible_token_purpose

    r = jsonify(
        {
            "error": "Unauthorized",
            "message": "Authentication in the Bearer-Token Auth format is required.",
        }
    )
    r.status_code = 401
    return r


def validate_token(token, purpose):
    if purpose == PASSWORD_RESET:
        t_s = current_app.token_serializer_for_password_resets
    elif purpose == EMAIL_ADDRESS_CONFIRMATION:
        t_s = current_app.token_serializer_for_email_address_confirmation
    else:
        raise ValueError(
            f"`purpose` must be one of {repr(PASSWORD_RESET)}, {repr(EMAIL_ADDRESS_CONFIRMATION)},"
            f" but it is equal to {repr(purpose)} instead"
        )

    reject_token = False
    try:
        token_payload = t_s.loads(token)
    except SignatureExpired as e:
        reject_token = True  # valid token, but expired
    except BadSignature as e:
        reject_token = True  # invalid token

    if reject_token:
        r = jsonify(
            {
                "error": "Unauthorized",
                "message": "The provided token is invalid.",
            }
        )
        r.status_code = 401
        return reject_token, r

    return reject_token, token_payload
