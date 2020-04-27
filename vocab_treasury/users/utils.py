from flask import url_for
from flask_mail import Message

from vocab_treasury import mail


def send_reset_email(user):
    token = user.get_reset_token()

    msg = Message(subject='Instructions for resetting the password for your VocabTreasury account',
                  sender='noreply@demo.com',
                  recipients=[user.email])
    # '''
    # be careful here not to spoof a sender
    # (b/c if you pretend to be somebody that you're not,
    # you're going to end up in the SPAM folder)
    # so try to have sth that's coming from your domain
    # or sth that's actually coming from your email address
    # '''
    msg.body = f'''To reset your password, visit the following link:
{url_for('users.reset_token', token=token, _external=True)}

If you did not make a password-reset request, then simply ignore this email and no changes will be made.'''
    # `_external=True` gets an absolute URL which is needed for the link in the email, whereas relative URLs are fine within the application
    # if this message is too long and/or complicated enough,
    # you can use the `jinja2` templates to piece these messages together as well
    mail.send(msg)

