import threading

from flask import request, jsonify, url_for, current_app
from flask_mail import Message

import sqlalchemy

from src import db, flsk_bcrpt, mail
from src.models import User
from src.auth import basic_auth, token_auth, validate_token
from src.api import api_bp
from src.constants import ACCOUNT_CONFIRMATION, PASSWORD_RESET


@api_bp.route("/users", methods=["POST"])
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
        is_confirmed=False,
    )
    db.session.add(user)
    db.session.commit()

    send_email_requesting_that_account_should_be_confirmed(user)

    payload = user.to_dict()
    r = jsonify(payload)
    r.status_code = 201
    r.headers["Location"] = url_for("api_blueprint.get_user", user_id=user.id)
    return r


@api_bp.route("/confirm-account/<token>", methods=["POST"])
def confirm_account(token):
    reject_token, response_or_token_payload = validate_token(
        token, ACCOUNT_CONFIRMATION
    )

    if reject_token:
        return response_or_token_payload

    if response_or_token_payload["purpose"] != ACCOUNT_CONFIRMATION:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "The provided token's `purpose` is"
                    f" different from {repr(ACCOUNT_CONFIRMATION)}."
                ),
            }
        )
        r.status_code = 400
        return r

    user_id = response_or_token_payload["user_id"]
    user = User.query.get(user_id)

    user.is_confirmed = True
    db.session.add(user)
    db.session.commit()

    r = jsonify(
        {
            "message": (
                "You have confirmed your account successfully. You may now log in."
            )
        }
    )
    r.status_code = 200
    return r


@api_bp.route("/users", methods=["GET"])
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
    users_collection = User.to_collection_dict(
        User.query.filter_by(is_confirmed=True),
        per_page,
        page,
        "api_blueprint.get_users",
    )
    return users_collection


@api_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    u = User.query.get(user_id)

    if u is None or u.is_confirmed is False:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    f"There doesn't exist a User resource with an id of {user_id}."
                ),
            }
        )
        r.status_code = 404
        return r

    return u.to_dict()


@api_bp.route("/user-profile", methods=["GET"])
@token_auth.login_required
def get_user_profile():
    u = User.query.get(token_auth.current_user().id)
    r = u.to_dict()
    r["email"] = u.email
    return r


@api_bp.route("/users/<int:user_id>", methods=["PUT"])
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
        # TODO: (2023/03/10, 08:41)
        #       resolve v-t-i-66
        #       :=
        #       require the user to confirm the new email address
        #       before it actually becomes their _active_ email address
        #       (from the perspective of the backend application)
        # fmt: off
        '''
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
        '''
        # fmt: on
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "Currently, it is not possible"
                    " to edit the email address associated with your User resource."
                    " But it is planned to implement that feature in the future."
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
    # fmt: off
    # The following code-block is commented out, because it is unreachable.
    # Its unreachability is due to
    # the statements within the body the preceding `if email is not None` statement.
    '''
    if email is not None:
        u.email = email
    '''
    # fmt: on
    if password is not None:
        u.password_hash = flsk_bcrpt.generate_password_hash(password).decode("utf-8")

    db.session.add(u)
    db.session.commit()

    return u.to_dict()


@api_bp.route("/users/<int:user_id>", methods=["DELETE"])
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
    try:
        db.session.commit()
    except sqlalchemy.exc.IntegrityError:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "Your User resource cannot be deleted at this time,"
                    " because there exists at least one Example resource"
                    " that is associated with your User resource."
                ),
            }
        )
        r.status_code = 400
        return r

    return "", 204


@api_bp.route("/request-password-reset", methods=["POST"])
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


def send_email_requesting_that_account_should_be_confirmed(user):
    token_payload = {
        "purpose": ACCOUNT_CONFIRMATION,
        "user_id": user.id,
    }
    account_confirmation_token = (
        current_app.token_serializer_for_account_confirmation.dumps(
            token_payload
        ).decode("utf-8")
    )

    msg_sender = current_app.config["ADMINS"][0]
    msg_recipients = [user.email]

    msg_subject = "[VocabTreasury] Please confirm your newly-created account"
    msg_body = f"""Dear {user.username},

Thank you for creating a VocabTreasury account.

Please confirm your account
in order to be able to log in and start using VocabTreasury.

To confirm your account, launch a terminal instance and issue the following request:
```
$ curl \\
    -i \\
    -H "Content-Type: application/json" \\
    -X POST \\
    {url_for(
        'api_blueprint.confirm_account',
        token=account_confirmation_token,
        _external=True,
    )}
```

Sincerely,
The VocabTreasury Team

PS: If you do not confirm your account within {current_app.config["DAYS_FOR_ACCOUNT_CONFIRMATION"]} days of receiving this email,
your account will be deleted.
If your account is deleted but you do want to use VocabTreasury,
you can still do so by simply creating a new VocabTreasury account.
    """

    send_email(
        msg_sender,
        msg_recipients,
        msg_subject,
        msg_body,
    )


def send_password_reset_email(user):
    token_payload = {
        "purpose": PASSWORD_RESET,
        "user_id": user.id,
    }
    password_reset_token = current_app.token_serializer_for_password_resets.dumps(
        token_payload
    ).decode("utf-8")

    minutes_for_password_reset = current_app.config["MINUTES_FOR_PASSWORD_RESET"]

    msg_sender = current_app.config["ADMINS"][0]
    msg_recipients = [user.email]

    msg_subject = "[VocabTreasury] Your request for a password reset"
    msg_body = f"""Dear {user.username},

You may reset your password within {minutes_for_password_reset} minutes of receiving
this email message.

To reset your password, launch a terminal instance and issue the following request:
```
$ curl \\
    -i \\
    -H "Content-Type: application/json" \\
    -X POST \\
    -d '{{"new_password": <your-new-password>}}' \\
    {url_for('api_blueprint.reset_password', token=password_reset_token, _external=True)}
```
When issuing that request, please remember
(a) to replace `<your-new-password>` with your desired new password, and
(b) to surround your desired new password with double quotation marks.

If you want to reset your password
but fail to do that within {minutes_for_password_reset} minutes of receiving this message,
you will have to submit a brand-new request for a password reset.
(To submit a brand-new request for a password reset, issue a POST request to the
{url_for('api_blueprint.request_password_reset', _external=True)} endpoint.)

Sincerely,
The VocabTreasury Team

PS: If you did not request a password reset,
then simply ignore this email message and your password will remain unchanged.
    """

    send_email(
        msg_sender,
        msg_recipients,
        msg_subject,
        body=msg_body,
    )


def send_email(sender, recipients, subject, body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = body

    t = threading.Thread(
        target=send_async_email,
        args=(current_app._get_current_object(), msg),
    )
    t.start()


def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)


@api_bp.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    reject_token, response_or_token_payload = validate_token(token, PASSWORD_RESET)

    if reject_token:
        return response_or_token_payload

    if response_or_token_payload["purpose"] != PASSWORD_RESET:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "The provided token's `purpose` is"
                    f" different from {repr(PASSWORD_RESET)}."
                ),
            }
        )
        r.status_code = 400
        return r

    user_id = response_or_token_payload["user_id"]
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
