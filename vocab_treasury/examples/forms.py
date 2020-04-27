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
    search = StringField('SEARCH IN "TRANSLATION" FOR:',
                         validators=[DataRequired()])

    submit = SubmitField('SEARCH')
