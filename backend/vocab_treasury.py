from flask import Flask, request, jsonify
from flask_httpauth import HTTPBasicAuth
from dotenv import find_dotenv, load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


dotenv_file = find_dotenv()
load_dotenv(dotenv_file)
import os

print(
    "os.environ.get('SQLALCHEMY_DATABASE_URI') - "
    + os.environ.get("SQLALCHEMY_DATABASE_URI")
)


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


db = SQLAlchemy(app)


migrate = Migrate(app, db)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)


users_list = [
    {
        "id": "1",
        "username": "jd",
        "email": "john.doe@gmail.com",
        "password": "123",
    },
    {
        "id": "2",
        "username": "ms",
        "email": "mary.smith@yahoo.com",
        "password": "456",
    },
]


users = {u["id"]: u for u in users_list}


def public_representation(user):
    user_public_fields = ["id", "username"]
    return {f: user[f] for f in user_public_fields}


basic_auth = HTTPBasicAuth()


@basic_auth.verify_password
def verify_password(email, password):
    user = None
    for u in users.values():
        if u["email"] == email:
            user = u
            break

    if user is None:
        return None

    if user["password"] != password:
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


@app.route("/api/users", methods=["GET"])
def get_users():
    return {u_id: public_representation(u) for u_id, u in users.items()}


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user_id_str = str(user_id)
    u = users.get(user_id_str)

    if u is None:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    f"There doesn't exist a User resource with an id of {user_id_str}"
                ),
            }
        )
        r.status_code = 404
        return r

    return public_representation(u)


@app.route("/api/users", methods=["POST"])
def create_user():
    if not request.json:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            }
        )
        r.status_code = 400
        return r

    email = request.json.get("email")
    is_email_taken = False
    for user in users.values():
        if user["email"] == email:
            is_email_taken = True
            break
    if is_email_taken:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as"
                    " the one you provided."
                ),
            }
        )
        r.status_code = 400
        return r

    new_user_id = max([int(u_id) for u_id in users.keys()]) + 1
    new_user_id_str = str(new_user_id)
    new_user = {k: v for k, v in request.json.items()}
    new_user["id"] = new_user_id_str

    users[new_user_id_str] = new_user

    payload = public_representation(new_user)
    r = jsonify(payload)
    r.status_code = 201
    return r


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@basic_auth.login_required
def edit_user(user_id):
    if not request.json:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            }
        )
        r.status_code = 400
        return r

    user_id_str = str(user_id)
    if basic_auth.current_user()["id"] != user_id_str:
        r = jsonify(
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to edit any User resource different from your"
                    " own."
                ),
            }
        )
        r.status_code = 403
        return r

    email = request.json.get("email")
    if email:
        is_email_taken = False
        for user in users.values():
            if user["email"] == email:
                is_email_taken = True
                break
        if is_email_taken:
            r = jsonify(
                {
                    "error": "Bad Request",
                    "message": (
                        "There already exists a User resource with the same email as"
                        " the one you provided."
                    ),
                }
            )
            r.status_code = 400
            return r

    original_user = users[user_id_str]
    edited_user = {**original_user, **request.json}
    users[user_id_str] = edited_user

    payload = public_representation(edited_user)
    return payload


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@basic_auth.login_required
def delete_user(user_id):
    user_id_str = str(user_id)
    if basic_auth.current_user()["id"] != user_id_str:
        r = jsonify(
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to delete any User resource different from"
                    " your own."
                ),
            }
        )
        r.status_code = 403
        return r

    del users[user_id_str]

    return "", 204


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
