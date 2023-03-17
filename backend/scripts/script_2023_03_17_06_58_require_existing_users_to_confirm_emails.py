import logging

from flask import url_for

from src import create_app
from src.models import User
from src.api.users import send_email
from src.constants import ACCOUNT_CONFIRMATION


logger = logging.getLogger(__name__)

logger.setLevel(logging.DEBUG)

handler_1 = logging.StreamHandler()
handler_1.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"),
)

logger.addHandler(handler_1)


if __name__ == "__main__":
    import os

    os.environ["SERVER_NAME"] = "localhost"

    app = create_app(
        name_of_configuration="production",
    )

    with app.app_context(), app.test_request_context():
        users = User.query.all()

        for u in users:
            logger.info(f"sending email to '{repr(u)}', i.e. to '{u.email}'")

            # Imitate the implementation of
            # the `send_email_requesting_that_account_should_be_confirmed` function.
            token_payload = {
                "purpose": ACCOUNT_CONFIRMATION,
                "user_id": u.id,
            }
            account_confirmation_token = (
                app.token_serializer_for_account_confirmation.dumps(
                    token_payload
                ).decode("utf-8")
            )

            msg_sender = "noreply@demo.com"
            msg_recipients = [u.email]

            msg_subject = (
                "[VocabTreasury] ACTION REQUIRED: Please confirm your email address"
            )
            msg_body = f"""Dear {u.username},

Thank you for using VocabTreasury.
We hope you have found that both helpful and enjoyable.

A new version of VocabTreasury was released recently.
As part of that release,
we have taken a step towards ensuring more robust security for user accounts.
In particular:
from now on, VocabTreasury can be used
only by users who go on to confirm their email addresses.

ACTION REQUIRED:
Please confirm your email address
in order to be able to log in and continue using VocabTreasury.
(
Before confirming your email address,
you will be unable to log in to your account.
)

To perform the required confirmation,
launch a terminal instance and issue the following request:
```
$ curl \\
    -i \\
    -H "Content-Type: application/json" \\
    -X POST \\
    {url_for(
        'api_blueprint.confirm_newly_created_account',
        token=account_confirmation_token,
        _external=True,
    )}
```

We hope
that you will confirm your email address at your earliest convenience,
and that you will continue using VocabTreasury in the future.
We are looking forward to bringing new features to you
that will make your language learning more enjoyable!

Sincerely,
The VocabTreasury Team

PS: If you do not confirm your account within {app.config["DAYS_FOR_ACCOUNT_CONFIRMATION"]} days of receiving this email,
_both_ your account _and_ all your data stored therein will be deleted.
            """

            send_email(
                msg_sender,
                msg_recipients,
                msg_subject,
                msg_body,
            )

        # TODO: (2023/03/17, 07:03)
        #       before submitting a pull request for review:
        #       write a test case ensuring that
        #       deleting a `User` resource will also delete all their `Example`s
