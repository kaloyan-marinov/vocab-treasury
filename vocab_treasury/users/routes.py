from flask import Blueprint, flash, redirect, url_for, render_template, request
from flask_login import login_user, current_user, logout_user, login_required
from werkzeug.exceptions import HTTPException

from vocab_treasury import db, bcrypt
from vocab_treasury.constants import EXAMPLES_PER_PAGE
from vocab_treasury.examples.forms import SearchForm
from vocab_treasury.models import User, Example
from vocab_treasury.users.forms import RegistrationForm, LoginForm, RequestResetForm, ResetPasswordForm
from vocab_treasury.users.utils import send_reset_email

users = Blueprint('users', __name__)


@users.route('/register', methods=['GET', 'POST'])
def register():

    if current_user.is_authenticated:
        return redirect(url_for('main.home'))

    form = RegistrationForm()

    # check for POST data and if the data is valid for this form
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')

        user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        db.session.add(user)
        db.session.commit()

        flash('YOUR ACCOUNT HAS BEEN CREATED - YOU ARE NOW ABLE TO LOG IN.')
        return redirect(url_for('users.login'))

    return render_template('register.html',
                           title='REGISTER', form=form)


@users.route('/login', methods=['GET', 'POST'])
def login():

    if current_user.is_authenticated:
        return redirect(url_for('main.home'))

    form = LoginForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and bcrypt.check_password_hash(user.password_hash, form.password.data):
            login_user(user)

            # identify if the user logged in out of their own will,
            # or if the app told him/her to log in (due to him/her trying to access a resource only for logged-in users)
            next_page = request.args.get('next')
            flash('YOU HAVE JUST LOGGED IN.', category='info')
            if next_page:
                return redirect(next_page)
            else:
                return redirect(url_for('main.home'))
        else:
            flash('LOGIN UNSUCCESSFUL. PLEASE CHECK YOUR EMAIL AND PASSWORD.', category='danger')

    return render_template('login.html',
                           title='LOG-IN', form=form)


@users.route('/logout')
def logout():
    logout_user()
    flash('YOU HAVE SUCCESSFULLY LOGGED OUT.')
    return redirect(url_for('main.home'))


@users.route('/account')
@login_required
def account():
    return render_template('account.html', title='ACCOUNT')


@users.route('/own-vocabtreasury')
@login_required
def own_vocabtreasury():
    page = request.args.get('page', default=1, type=int)
    query = Example.query.filter_by(user_id=current_user.id)
    try:
        examples = query.paginate(page=page, per_page=EXAMPLES_PER_PAGE)
    except HTTPException:
        # occurs in either of the following scenarios:
        # - a user had a single example on the past page in their VocabTreasury, and they deleted that example
        # - a user requests a page in their VocabTreasury that's bigger than its number of pages
        last_page = query.paginate(page=1, per_page=EXAMPLES_PER_PAGE).pages
        return redirect(url_for('users.own_vocabtreasury', page=last_page))
    else:
        return render_template('own_vocabtreasury.html', title='OWN VOCABTREASURY', examples=examples)


@users.route('/own-vocabtreasury/search', methods=['GET', 'POST'])
@login_required
def search_query():
    form = SearchForm()
    if form.validate_on_submit():
        return redirect(url_for(
            'users.search_query', new_word=form.new_word.data, content=form.content.data,
            content_translation=form.content_translation.data
        ))

    query_for_current_user_examples = Example.query.filter_by(user_id=current_user.id)

    new_word = request.args.get('new_word')
    if new_word:
        form.new_word.data = new_word
        query = query_for_current_user_examples.filter(Example.new_word.like(f'%{new_word}%'))
    else:
        query = None

    content = request.args.get('content')
    if content:
        form.content.data = content
        if query is None:
            query = query_for_current_user_examples
        query = query.filter(Example.content.like(f'%{content}%'))

    content_translation = request.args.get('content_translation')
    if content_translation:
        form.content_translation.data = content_translation
        if query is None:
            query = query_for_current_user_examples
        query = query.filter(Example.content_translation.like(f'%{content_translation}%'))

    if query:
        page = request.args.get('page', default=1, type=int)
        examples = query.paginate(page=page, per_page=EXAMPLES_PER_PAGE)
    else:
        examples = None

    return render_template('search.html', title='SEARCH OWN VOCABTREASURY', form=form, examples=examples)


@users.route('/reset_password', methods=['GET', 'POST'])
def reset_request():
    """
    route where the user requests to reset their password (by entering their email)
    """
    # make sure the user is logged out before they request a password-reset
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))

    form = RequestResetForm()

    # handle what happens when the user submits this form -
    # it will submit back to the same route that it was rendered from
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        send_reset_email(user)
        flash('AN EMAIL HAS BEEN SENT WITH INSTRUCTIONS TO RESET YOUR PASSWORD.',
              category='info')
        return redirect(url_for('users.login'))

    return render_template('reset_request.html', title='RESET PASSWORD', form=form)


@users.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_token(token):
    """
    route where the user actually resets their password
    """
    # make sure the user is logged out before they reset their password
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    # verify the token from this URL
    user = User.verify_reset_token(token)
    if user is None:
        flash('THAT IS AN INVALID OR EXPIRED TOKEN', category='warning')
        return redirect(url_for('users.reset_request'))

    form = ResetPasswordForm()

    # handle what happens when the user submits this form (in order to actually change their password) -
    # it will submit back to the same route that it was rendered from
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data)
        user.password_hash = hashed_password
        db.session.commit()
        flash('YOUR PASSWORD HAS BEEN UPDATED! YOU ARE NOW ABLE TO LOG IN.')
        return redirect(url_for('users.login'))

    return render_template('reset_token.html', title='RESET PASSWORD', form=form)
