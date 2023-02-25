from flask import Flask, request, jsonify, url_for
from dotenv import find_dotenv, load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


import os
from flask_bcrypt import Bcrypt
import datetime


from itsdangerous import TimedJSONWebSignatureSerializer, BadSignature, SignatureExpired
import sys

from flask_mail import Mail, Message
from threading import Thread

from configuration import name_2_configuration


dotenv_file = find_dotenv()
load_dotenv(dotenv_file)


app = Flask(__name__)

CONFIGURATION_4_BACKEND = os.environ.get("CONFIGURATION_4_BACKEND", "development")
if CONFIGURATION_4_BACKEND is None:
    sys.exit(
        datetime.datetime.utcnow().strftime("%Y-%m-%d, %H:%M:%S UTC")
        + " - An environment variable called CONFIGURATION_4_BACKEND must be specified:"
        + " crashing..."
    )
app.config.from_object(name_2_configuration[CONFIGURATION_4_BACKEND])


db = SQLAlchemy(app)


migrate = Migrate(app, db)


mail = Mail(app)


# As suggested on https://flask-bcrypt.readthedocs.io/en/latest/
# the following variable is not called simply `bcrypt`
# (because if it were, it would be effectively overriding the `bcrypt` module).
flsk_bcrpt = Bcrypt(app)


from src.models import User, Example


token_serializer = TimedJSONWebSignatureSerializer(
    app.config["SECRET_KEY"],
    expires_in=3600,
)

MINUTES_FOR_PASSWORD_RESET = 15

token_serializer_for_password_resets = TimedJSONWebSignatureSerializer(
    app.config["SECRET_KEY"],
    expires_in=60 * MINUTES_FOR_PASSWORD_RESET,
)


from src.auth import (
    basic_auth,
    token_auth,
)


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
        password_hash=flsk_bcrpt.generate_password_hash(password).decode("utf-8"),
    )
    db.session.add(user)
    db.session.commit()

    payload = user.to_dict()
    r = jsonify(payload)
    r.status_code = 201
    r.headers["Location"] = url_for("get_user", user_id=user.id)
    return r


@app.route("/api/users", methods=["GET"])
def get_users():
    """
    If the client wants to specify:
    - how many resources it wants at a time,
      it can incorporate `per_page` into its request;
    - which page of the paginated query results it wants,
      it can incorporate `page` into its request.

    Importantly, this function enforces that
    the "page size" (= the value of `per_page`) never be larger than 100,
    with the reason for this restriction being
    that we do not want to task the server too much.
    """
    per_page = min(
        request.args.get("per_page", 10, type=int),
        100,
    )
    page = request.args.get("page", 1, type=int)
    users_collection = User.to_collection_dict(User.query, per_page, page, "get_users")
    return users_collection


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

    return u.to_dict()


@app.route("/api/user-profile", methods=["GET"])
@token_auth.login_required
def get_user_profile():
    u = User.query.get(token_auth.current_user().id)
    r = u.to_dict()
    r["email"] = u.email
    return r


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
        u.password_hash = flsk_bcrpt.generate_password_hash(password).decode("utf-8")

    db.session.add(u)
    db.session.commit()

    return u.to_dict()


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


@app.route("/api/request-password-reset", methods=["POST"])
def request_password_reset():
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

    email = request.json.get("email")
    if email is None:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": "Your request's body didn't specify a value for 'email'.",
            }
        )
        r.status_code = 400
        return r

    user = User.query.filter_by(email=email).first()
    if user is None:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": "The email you provided is invalid.",
            }
        )
        r.status_code = 400
        return r

    send_password_reset_email(user)

    r = jsonify(
        {
            "message": (
                "Sending an email with instructions for resetting your password..."
            ),
        }
    )
    r.status_code = 202
    return r


def send_password_reset_email(user):
    password_reset_token = token_serializer_for_password_resets.dumps(
        {"user_id": user.id}
    ).decode("utf-8")

    msg_body = f"""Dear {user.username},

You may reset your password within {MINUTES_FOR_PASSWORD_RESET} minutes of receiving
this email message.

To reset your password, launch a terminal instance and issue the following request:
```
$ curl \\
    -i \\
    -H "Content-Type: application/json" \\
    -X POST \\
    -d '{{"new_password": <your-new-password>}}' \\
    {url_for('reset_password', token=password_reset_token, _external=True)}
```
When issuing that request, please remember
(a) to replace `<your-new-password>` with your desired new password, and
(b) to surround your desired new password with double quotation marks.

If you want to reset your password
but fail to do that within {MINUTES_FOR_PASSWORD_RESET} minutes of receiving this message,
you will have to submit a brand-new request for a password reset.
(To submit a brand-new request for a password reset, issue a POST request to the
{url_for('request_password_reset', _external=True)} endpoint.)

Sincerely,
The VocabTreasury Team

PS: If you did not request a password reset,
then simply ignore this email message and your password will remain unchanged.
    """

    send_email(
        subject="[VocabTreasury] Your request for a password reset",
        sender="noreply@demo.com",
        recipients=[user.email],
        body=msg_body,
    )


def send_email(subject, sender, recipients, body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = body

    t = Thread(target=send_async_email, args=(app, msg))
    t.start()


def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)


@app.route("/api/reset-password/<token>", methods=["POST"])
def reset_password(token):
    reject_token = False
    try:
        token_payload = token_serializer_for_password_resets.loads(token)
    except SignatureExpired as e:
        reject_token = True  # valid token, but expired
    except BadSignature as e:
        reject_token = True  # invalid token

    if reject_token:
        r = jsonify(
            {
                "error": "Unauthorized",
                "message": "Your password-reset token is invalid.",
            }
        )
        r.status_code = 401
        return r
    user_id = token_payload["user_id"]
    user = User.query.get(user_id)

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

    new_password = request.json.get("new_password")
    if new_password is None:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "Your request's body didn't specify a value for a 'new_password'."
                ),
            }
        )
        r.status_code = 400
        return r

    user.password_hash = flsk_bcrpt.generate_password_hash(new_password)
    db.session.add(user)
    db.session.commit()

    r = jsonify(
        {
            "message": "You have reset your password successfully.",
        }
    )
    r.status_code = 200
    return r


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
        if value is None or value == "":
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

    payload = e.to_dict()
    r = jsonify(payload)
    r.status_code = 201
    r.headers["Location"] = url_for("get_example", example_id=e.id)
    return r


@app.route("/api/examples", methods=["GET"])
@token_auth.login_required
def get_examples():
    """
    If the client wants to specify:
    - how many resources it wants at a time,
      it can incorporate `per_page` into its request;
    - which page of the paginated query results it wants,
      it can incorporate `page` into its request.

    Importantly, this function enforces that
    the "page size" (= the value of `per_page`) never be larger than 100,
    with the reason for this restriction being
    that we do not want to task the server too much.
    """
    examples_query = Example.query.filter_by(user_id=token_auth.current_user().id)
    query_param_kwargs = {}
    new_word = request.args.get("new_word")
    if new_word:
        examples_query = examples_query.filter(
            Example.new_word.like("%" + new_word + "%")
        )
        query_param_kwargs["new_word"] = new_word
    content = request.args.get("content")
    if content:
        examples_query = examples_query.filter(
            Example.content.like("%" + content + "%")
        )
        query_param_kwargs["content"] = content
    content_translation = request.args.get("content_translation")
    if content_translation:
        examples_query = examples_query.filter(
            Example.content_translation.like("%" + content_translation + "%")
        )
        query_param_kwargs["content_translation"] = content_translation

    per_page = min(
        100,
        request.args.get("per_page", default=10, type=int),
    )
    page = request.args.get("page", default=1, type=int)

    examples_collection = Example.to_collection_dict(
        examples_query,
        per_page,
        page,
        "get_examples",
        **query_param_kwargs,
    )
    return examples_collection


@app.route("/api/examples/<int:example_id>", methods=["GET"])
@token_auth.login_required
def get_example(example_id):
    example = Example.query.get(example_id)
    if example is None or example.user_id != token_auth.current_user().id:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id)
                ),
            }
        )
        r.status_code = 404
        return r
    return example.to_dict()


@app.route("/api/examples/<int:example_id>", methods=["PUT"])
@token_auth.login_required
def edit_example(example_id):
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

    example = Example.query.get(example_id)
    if example is None or example.user_id != token_auth.current_user().id:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id)
                ),
            }
        )
        r.status_code = 404
        return r

    source_language = request.json.get("source_language")
    new_word = request.json.get("new_word")
    content = request.json.get("content")
    content_translation = request.json.get("content_translation")

    if source_language is not None:
        example.source_language = source_language
    if new_word is not None:
        example.new_word = new_word
    if content is not None:
        example.content = content
    if content_translation is not None:
        example.content_translation = content_translation

    db.session.add(example)
    db.session.commit()

    return example.to_dict()


@app.route("/api/examples/<int:example_id>", methods=["DELETE"])
@token_auth.login_required
def delete_example(example_id):
    example = Example.query.get(example_id)
    if example is None or example.user_id != token_auth.current_user().id:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id)
                ),
            }
        )
        r.status_code = 404
        return r

    db.session.delete(example)
    db.session.commit()

    return "", 204


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
