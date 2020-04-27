from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError

from vocab_treasury.models import User


class RegistrationForm(FlaskForm):
    username = StringField('USERNAME',
                           validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('EMAIL',
                        validators=[DataRequired(), Email()])
    password = PasswordField('PASSWORD',
                             validators=[DataRequired()])
    confirm_password = PasswordField('CONFIRM PASSWORD',
                                     validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('CREATE MY ACCOUNT')

    '''
    def validate_field(self, field):
        """
        this is a custom validation method for this form:
        - gets checked when we actually try to validate the form
        - returns visual feedback (within the webpage/frontend itself!) of any error messages

        the structure of this method was gleaned from the `wtforms` documentation
        """

        boolean_condition = ...

        if boolean_condition:
            raise ValidationError('Validation Message')
    '''

    def validate_username(self, username):
        """
        Checks if the submitted username already exists in the database
        """
        user = User.query.filter_by(username=username.data).first()  # if no such User, this returns `None`
        if user:
            raise ValidationError('THAT USERNAME IS TAKEN - PLEASE CHOOSE A DIFFERENT ONE.')

    def validate_email(self, email):
        """
        Checks if the submitted email already exists in the database
        """
        user = User.query.filter_by(email=email.data).first()  # if no such User, this returns `None`
        if user:
            raise ValidationError('THAT EMAIL IS TAKEN - PLEASE CHOOSE A DIFFERENT ONE.')


class LoginForm(FlaskForm):
    email = StringField('EMAIL',
                        validators=[DataRequired(), Email()])
    password = PasswordField('PASSWORD',
                             validators=[DataRequired()])
    submit = SubmitField('LOG INTO MY ACCOUNT')


class RequestResetForm(FlaskForm):
    email = StringField('EMAIL',
                        validators=[DataRequired(), Email()])
    submit = SubmitField('REQUEST PASSWORD RESET')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is None:
            raise ValidationError('There is no account with that email. You must register first.')


class ResetPasswordForm(FlaskForm):
    password = PasswordField('PASSWORD', validators=[DataRequired()])
    confirm_password = PasswordField('CONFIRM PASSWORD',
                                     validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('RESET PASSWORD')
