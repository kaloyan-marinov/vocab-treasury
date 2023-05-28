import os
import threading

from flask import request, jsonify, url_for, current_app
from flask_mail import Message

import sqlalchemy

from src import db, flsk_bcrpt, mail
from src.models import User, EmailAddressChange
from src.auth import basic_auth, token_auth, validate_token
from src.api import api_bp
from src.constants import EMAIL_ADDRESS_CONFIRMATION, PASSWORD_RESET


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

    send_email_requesting_that_email_address_should_be_confirmed(user)

    payload = user.to_dict()
    r = jsonify(payload)
    r.status_code = 201
    r.headers["Location"] = url_for("api_blueprint.get_user", user_id=user.id)
    return r


@api_bp.route("/confirm-email-address/<token>", methods=["POST"])
def confirm_email_address(token):
    """
    Handle an email-address confirmation
    either from a newly-registered user
    whose email address on record has not yet been confirmed,
    or from an existing user
    whose email address on record has been confirmed
    but who wishes to change their email address on record.
    """
    reject_token, response_or_token_payload = validate_token(
        token, EMAIL_ADDRESS_CONFIRMATION
    )

    if reject_token:
        return response_or_token_payload

    if response_or_token_payload["purpose"] != EMAIL_ADDRESS_CONFIRMATION:
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "The provided token's `purpose` is"
                    f" different from {repr(EMAIL_ADDRESS_CONFIRMATION)}."
                ),
            }
        )
        r.status_code = 400
        return r

    user_id = response_or_token_payload["user_id"]
    user = User.query.get(user_id)

    if user.is_confirmed is False:
        # This is the case where `user` is a newly-registered user
        # whose email address on record has not yet been confirmed.
        user.is_confirmed = True
    else:
        # This is the case where `user` is an existing user
        # whose email address on record has been confirmed
        # but who wishes to change their email address on record.
        e_a_c = (
            EmailAddressChange.query.filter_by(user_id=user.id)
            .order_by(EmailAddressChange.id.desc())
            .first()
        )
        if response_or_token_payload["email_address_change_id"] != e_a_c.id:
            r = jsonify(
                {
                    "error": "Unauthorized",
                    "message": (
                        "You have submitted multiple consecutive requests for"
                        " the email address associated with your account to be edited,"
                        " without following up on the instructions that you received"
                        " for any of those requests;"
                        " you may only follow up on the instructions"
                        " that you received for the most recent request."
                    ),
                }
            )
            r.status_code = 401
            return r
        assert user.email == e_a_c.old
        user.email = e_a_c.new
    db.session.add(user)
    db.session.commit()

    r = jsonify(
        {
            "message": (
                "You have confirmed your email address successfully."
                " You may now log in."
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
    # TODO: (2023/05/22, 05:29)
    #       before submitting a pull request for review,
    #       consider extracting the following code-block
    #       into a stand-alone utility function
    #       (which should be able to utilize not only within this module
    #       but also within `examples.py`)
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

    curr_user = basic_auth.current_user()
    if curr_user.id != user_id:
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
    if (username is not None or password is not None) and (email is not None):
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    "You are not allowed to edit _both_ your email address"
                    " _and_ your username and/or password"
                    " with a single request to this endpoint."
                    " To achieve that effect,"
                    " you have to issue two separate requests to this endpoint."
                ),
            }
        )
        r.status_code = 400
        return r
    elif email is not None:
        return _initiate_change_of_email_address(curr_user, email)
    else:
        return _edit_username_and_or_password(curr_user, username, password)


def _initiate_change_of_email_address(user, new_email_address):
    if User.query.filter_by(email=new_email_address).first() is not None:
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

    e_a_c = EmailAddressChange(
        user_id=user.id,
        old=basic_auth.current_user().email,
        new=new_email_address,
    )
    db.session.add(e_a_c)
    db.session.commit()

    send_email_requesting_that_change_of_email_address_should_be_confirmed(
        user,
        e_a_c,
    )

    r = jsonify(
        {
            "message": (
                "Please check the inbox of your new email address for instructions"
                " on how to confirm that address..."
            ),
        }
    )
    r.status_code = 202
    return r


def _edit_username_and_or_password(user, new_username, new_password):
    if new_username is not None:
        if User.query.filter_by(username=new_username).first() is not None:
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

    if new_username is not None:
        user.username = new_username

    if new_password is not None:
        user.password_hash = flsk_bcrpt.generate_password_hash(new_password).decode(
            "utf-8"
        )

    db.session.add(user)
    db.session.commit()

    return user.to_dict()


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


def send_email_requesting_that_email_address_should_be_confirmed(user):
    token_payload = {
        "purpose": EMAIL_ADDRESS_CONFIRMATION,
        "user_id": user.id,
    }
    email_address_confirmation_token = (
        current_app.token_serializer_for_email_address_confirmation.dumps(
            token_payload
        ).decode("utf-8")
    )

    msg_sender = current_app.config["ADMINS"][0]
    msg_recipients = [user.email]

    msg_subject = "[VocabTreasury] Please confirm your email address"
    msg_body = f"""Dear {user.username},

Thank you for creating a VocabTreasury account.

Please confirm your email address
in order to be able to log in and start using VocabTreasury.

To confirm your email address,
launch a terminal instance and issue the following request:
```
$ curl \\
    -i \\
    -L \\
    -H "Content-Type: application/json" \\
    -X POST \\
    {url_for(
        'api_blueprint.confirm_email_address',
        token=email_address_confirmation_token,
        _external=True,
    )}
```

Sincerely,
The VocabTreasury Team

PS: If you do not confirm your email address within {current_app.config["DAYS_FOR_EMAIL_ADDRESS_CONFIRMATION"]} days of receiving this message,
your account will be deleted.
If your account is deleted but you do want to use VocabTreasury,
you can still use VocabTreasury by simply creating a new account.
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
    -L \\
    -H "Content-Type: application/json" \\
    -X POST \\
    -d '{{"new_password": <your-new-password>}}' \\
    {url_for(
        'api_blueprint.reset_password',
        token=password_reset_token,
        _external=True,
    )}
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
        msg_body,
    )


def send_email_requesting_that_change_of_email_address_should_be_confirmed(
    user: User,
    email_address_change: EmailAddressChange,
):
    token_payload = {
        "purpose": EMAIL_ADDRESS_CONFIRMATION,
        "user_id": user.id,
        "email_address_change_id": email_address_change.id,
    }
    email_address_confirmation_token = (
        current_app.token_serializer_for_email_address_confirmation.dumps(
            token_payload
        ).decode("utf-8")
    )

    msg_sender = current_app.config["ADMINS"][0]
    msg_recipients = [email_address_change.new]

    msg_subject = "[VocabTreasury] Please confirm your new email address"
    msg_body = f"""Dear {user.username},

You have requested that
the email address associated with your VocabTreasury account should be edited.

In order for your (account-editing) request to be processed,
launch a terminal instance and issue the following (HTTP) request:
```
$ curl \\
    -i \\
    -L \\
    -H "Content-Type: application/json" \\
    -X POST \\
    {url_for(
        'api_blueprint.confirm_email_address',
        token=email_address_confirmation_token,
        _external=True,
    )}
```

Sincerely,
The VocabTreasury Team

PS: If you do not follow the instructions within this message,
the email address associated with your VocabTreasury account will remain unchanged.
    """

    send_email(
        msg_sender,
        msg_recipients,
        msg_subject,
        msg_body,
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
