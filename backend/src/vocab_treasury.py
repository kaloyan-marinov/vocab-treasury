from flask import Flask
from dotenv import find_dotenv, load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


import os
from flask_bcrypt import Bcrypt
import datetime


from itsdangerous import TimedJSONWebSignatureSerializer
import sys

from flask_mail import Mail

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


# Import the models so that they get registered with SQLAlchemy.
from src.models import User, Example  # noqa


token_serializer = TimedJSONWebSignatureSerializer(
    app.config["SECRET_KEY"],
    expires_in=3600,
)

MINUTES_FOR_PASSWORD_RESET = 15

token_serializer_for_password_resets = TimedJSONWebSignatureSerializer(
    app.config["SECRET_KEY"],
    expires_in=60 * MINUTES_FOR_PASSWORD_RESET,
)


from src.api import api_bp

app.register_blueprint(api_bp, url_prefix="/api")


if __name__ == "__main__":
    app.run(use_debugger=False, use_reloader=False, passthrough_errors=True)
