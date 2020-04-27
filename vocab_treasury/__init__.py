from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_mail import Mail

from vocab_treasury.config import Config


db = SQLAlchemy()

bcrypt = Bcrypt()

login_manager = LoginManager()
login_manager.login_view = 'users.login'  # tells the extension where the login route is located
login_manager.login_message_category = 'info'  # the same as the category that Corey Schafer's Flask Tutorial uses for the `Bootstrap` classes

mail = Mail()


def create_app(configuration=Config):

    # instantiate the `Flask` class and configure it
    app = Flask(__name__)
    app.config.from_object(configuration)

    # pass the application object to all extension objects
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)

    # get the routes to work
    from vocab_treasury.main.routes import main
    from vocab_treasury.users.routes import users
    from vocab_treasury.examples.routes import examples

    app.register_blueprint(main)
    app.register_blueprint(users)
    app.register_blueprint(examples)

    return app
