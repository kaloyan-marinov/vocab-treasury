import datetime
import os
import sys

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_bcrypt import Bcrypt
from itsdangerous import TimedJSONWebSignatureSerializer


from configuration import name_2_configuration


# Create Flask extentions, each in an uninitialized state.
db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
# As suggested on https://flask-bcrypt.readthedocs.io/en/latest/
# the following variable is not called simply `bcrypt`
# (because if it were, it would be effectively overriding the `bcrypt` module).
flsk_bcrpt = Bcrypt()


# Import the models so that they get registered with SQLAlchemy.
from src.models import User, Example  # noqa


def create_app(name_of_configuration=None):
    if name_of_configuration is None:
        CONFIGURATION_4_BACKEND = os.environ.get(
            "CONFIGURATION_4_BACKEND", "development"
        )

        if CONFIGURATION_4_BACKEND is None:
            sys.exit(
                datetime.datetime.utcnow().strftime("%Y-%m-%d, %H:%M:%S UTC")
                + " - An environment variable called CONFIGURATION_4_BACKEND must be specified:"
                + " crashing..."
            )

        name_of_configuration = CONFIGURATION_4_BACKEND

    app = Flask(__name__)
    app.config.from_object(name_2_configuration[name_of_configuration])

    # Initialize the Flask extensions.
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    flsk_bcrpt.init_app(app)

    # fmt: off
    '''
    For each `TimedJSONWebSignatureSerializer` object
    that our application instance depends on:

        (a) we don't have an extension to initialize in the global scope, so

        (b) we are going to do things directly in the Application Factory Function;
            namely, we are going to add a `TimedJSONWebSignatureSerializer` attribute
            to the application instance itself.
    
    (This isn't the only way to do things,
    but adding each `TimedJSONWebSignatureSerializer` object
    as an attribute to the application instance ensures that,
    wherever we have access to `current_app`,
    we will also have access to the `TimedJSONWebSignatureSerializer` in question.)
    '''
    # fmt: on
    app.token_serializer_for_account_confirmation = TimedJSONWebSignatureSerializer(
        app.config["SECRET_KEY"],
        expires_in=app.config["DAYS_FOR_ACCOUNT_CONFIRMATION"] * 24 * 60 * 60,
    )

    app.token_serializer = TimedJSONWebSignatureSerializer(
        app.config["SECRET_KEY"],
        expires_in=app.config["MINUTES_FOR_TOKEN_VALIDITY"] * 60,
    )

    app.token_serializer_for_password_resets = TimedJSONWebSignatureSerializer(
        app.config["SECRET_KEY"],
        expires_in=app.config["MINUTES_FOR_PASSWORD_RESET"] * 60,
    )

    # Register `Blueprint`(s) with the application instance.
    # (By themselves, `Blueprint`s are "inactive".)
    from src.api import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app
