from datetime import datetime
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from flask import current_app
from vocab_treasury import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    """
    this was gleaned from the `flask-login` extension's website
    """
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)  # same as in users.forms.RegistrationForm
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)  # passwords will be hashed to a length of 60

    examples = db.relationship('Example', backref='author', lazy=True)  # the `backref` is similar to adding an attribute to the `Example` model; `lazy=True` specifies that SQLAlchemy will load the data as necessary in one go

    def get_reset_token(self, expires_sec=1800):
        s = Serializer(current_app.config['SECRET_KEY'], expires_sec)
        return s.dumps({'user_id': self.id}).decode('utf-8')

    @staticmethod
    def verify_reset_token(token):
        """
        accepts a token
        and, if it is valid, returns the user with the user_id that had been passed (as payload) into the initial token
        """
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            user_id = s.loads(token)['user_id']
        except:  # or `itsdangerous.exc.SignatureExpired`?
            return None
        return User.query.get(user_id)

    def __repr__(self):
        return f'User({self.username}, {self.email})'


class Example(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    created = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # the function, not its invocation; also, you always want to use UTC when saving date+time to a DB (so they're consistent)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # note the lower-case 'u'

    source_language = db.Column(db.String(30), default='Finnish')
    new_word = db.Column(db.String(30), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_translation = db.Column(db.Text)
