import datetime
import os
import sys

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_bcrypt import Bcrypt


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
from src.models import User, Example, EmailAddressChange  # noqa


def create_app(name_of_configuration=None):
    if name_of_configuration is None:
        CONFIGURATION_4_BACKEND = os.environ.get(
            "CONFIGURATION_4_BACKEND", "development"
        )

        if CONFIGURATION_4_BACKEND is None:
            sys.exit(
                # TODO (2024/06/14, 08:27)
                #       fix the deprecated call below
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

    # Register `Blueprint`(s) with the application instance.
    # (By themselves, `Blueprint`s are "inactive".)
    from src.api import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app
