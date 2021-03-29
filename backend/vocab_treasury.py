from flask import Flask, request, jsonify
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth
from dotenv import find_dotenv, load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


import os
from werkzeug.security import generate_password_hash, check_password_hash
import datetime


from itsdangerous import TimedJSONWebSignatureSerializer, BadSignature, SignatureExpired
import sys


dotenv_file = find_dotenv()
load_dotenv(dotenv_file)

print(
    "os.environ.get('SQLALCHEMY_DATABASE_URI') - "
    + os.environ.get("SQLALCHEMY_DATABASE_URI")
)


app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
if app.config["SECRET_KEY"] is None:
    sys.exit(
        datetime.datetime.utcnow().strftime("%Y-%m-%d, %H:%M:%S UTC")
        + " - An environment variable called SECRET_KEY must be specified: crashing..."
    )

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


db = SQLAlchemy(app)


migrate = Migrate(app, db)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)

    def public_representation(self):
        return {"id": self.id, "username": self.username}

    def __repr__(self):
        return f"User({self.username}, {self.email})"


class Example(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    created = db.Column(
        db.DateTime, nullable=False, default=datetime.datetime.utcnow
    )  # the function, not its invocation; also, you always want to use UTC when saving date+time to a DB (so they're consistent)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False
    )  # note the lower-case 'u'

    source_language = db.Column(db.String(30), default="Finnish")
    new_word = db.Column(db.String(30), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_translation = db.Column(db.Text)

    def to_json(self):
        return {
            "id": self.id,
            "source_language": self.source_language,
            "new_word": self.new_word,
            "content": self.content,
            "content_translation": self.content_translation,
        }

    def __repr__(self):
        return f"Example({self.id}, {self.new_word})"


basic_auth = HTTPBasicAuth()


@basic_auth.verify_password
def verify_password(email, password):
    user = User.query.filter_by(email=email).first()
    if user is None:
        return None

    if check_password_hash(user.password_hash, password) is False:
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


token_serializer = TimedJSONWebSignatureSerializer(
    app.config["SECRET_KEY"],
    expires_in=3600,
)


token_auth = HTTPTokenAuth()


@token_auth.verify_token
def verify_token(token):
    # TODO: utilize unittest.mock.patch
    #       to test this function's currently untested instructions
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

    username = request.json.get("username")
    email = request.json.get("email")
    password = request.json.get("password")

    for field, value in (
        ("username", username),
        ("email", email),
        ("password", password),
    ):
        if value is None:
            r = jsonify(
                {
                    "error": "Bad Request",
                    "message": (
                        f"Your request body did not specify a value for '{field}'"
                    ),
                }
            )
            r.status_code = 400
            return r

    if User.query.filter_by(email=email).first() is not None:
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

    if User.query.filter_by(username=username).first() is not None:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same username as"
                    " the one you provided."
                ),
            }
        )
        r.status_code = 400
        return r

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()

    payload = user.public_representation()
    r = jsonify(payload)
    r.status_code = 201
    return r


@app.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return {"users": [u.public_representation() for u in users]}


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    u = User.query.get(user_id)

    if u is None:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    f"There doesn't exist a User resource with an id of {user_id}"
                ),
            }
        )
        r.status_code = 404
        return r

    return u.public_representation()


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@basic_auth.login_required
def edit_user(user_id):
    if not request.json:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            }
        )
        r.status_code = 400
        return r

    if basic_auth.current_user().id != user_id:
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

    username = request.json.get("username")
    password = request.json.get("password")
    email = request.json.get("email")

    if email is not None:
        if User.query.filter_by(email=email).first() is not None:
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

    if username is not None:
        if User.query.filter_by(username=username).first() is not None:
            r = jsonify(
                {
                    "error": "Bad Request",
                    "message": (
                        "There already exists a User resource with the same username as"
                        " the one you provided."
                    ),
                }
            )
            r.status_code = 400
            return r

    u = User.query.get(user_id)
    if username is not None:
        u.username = username
    if email is not None:
        u.email = email
    if password is not None:
        u.password_hash = generate_password_hash(password)

    db.session.add(u)
    db.session.commit()

    return u.public_representation()


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@basic_auth.login_required
def delete_user(user_id):
    if basic_auth.current_user().id != user_id:
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

    u = User.query.get(user_id)
    db.session.delete(u)
    db.session.commit()

    return "", 204


@app.route("/api/tokens", methods=["POST"])
@basic_auth.login_required
def issue_token():
    token_payload = {"user_id": basic_auth.current_user().id}
    token = token_serializer.dumps(token_payload).decode("utf-8")
    return {"token": token}


@app.route("/api/examples", methods=["POST"])
@token_auth.login_required
def create_example():
    if not request.json:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            }
        )
        r.status_code = 400
        return r

    source_language = request.json.get("source_language")
    new_word = request.json.get("new_word")
    content = request.json.get("content")
    content_translation = request.json.get("content_translation")

    for field, value in (
        ("new_word", new_word),
        ("content", content),
    ):
        if value is None:
            r = jsonify(
                {
                    "error": "Bad Request",
                    "message": (
                        f"Your request body did not specify a value for '{field}'"
                    ),
                }
            )
            r.status_code = 400
            return r

    e = Example(
        user_id=token_auth.current_user().id,
        source_language=source_language,
        new_word=new_word,
        content=content,
        content_translation=content_translation,
    )
    db.session.add(e)
    db.session.commit()

    payload = e.to_json()
    r = jsonify(payload)
    r.status_code = 201
    return r


@app.route("/api/examples", methods=["GET"])
@token_auth.login_required
def get_examples():
    examples = Example.query.filter_by(user_id=token_auth.current_user().id).all()
    return {"examples": [e.to_json() for e in examples]}


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)