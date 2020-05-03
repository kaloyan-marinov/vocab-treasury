from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired


class ExampleForm(FlaskForm):
    source_language = StringField('SOURCE LANGUAGE')
    new_word = StringField('NEW WORD', validators=[DataRequired()])
    content = TextAreaField('EXAMPLE', validators=[DataRequired()])
    content_translation = TextAreaField('TRANSLATION')

    submit = SubmitField('RECORD THIS EXAMPLE')


class SearchForm(FlaskForm):
    new_word = StringField('NEW WORD')
    content = StringField('EXAMPLE')
    content_translation = StringField('TRANSLATION')

    submit = SubmitField('SEARCH')
