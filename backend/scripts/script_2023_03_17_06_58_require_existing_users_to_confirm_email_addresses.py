"""
If you wish to use this script
in a 'development' (or other non-'production') environment,
it might be advisable
to start by executing `backend/scripts/script_2023_03_17_06_29_populate_db.py`,
and only then to go on to execute this script.

###############################################################################

The following steps describe how to use this script:

- launch a terminal instance

- execute this script by issuing
  ```
  (venv) backend $ PYTHONPATH=. \
    python \
    scripts/script_2023_03_17_06_58_require_existing_users_to_confirm_email_addresses.py \
        --time-to-sleep=5
  ```
"""

import argparse
import datetime
import logging
import os
import time

from flask import url_for

from src import create_app
from src.models import User
from src.api.users import send_email
from src.constants import EMAIL_ADDRESS_CONFIRMATION


logger = logging.getLogger(__name__)

logger.setLevel(logging.DEBUG)

handler_1 = logging.StreamHandler()
handler_1.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"),
)

logger.addHandler(handler_1)


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(
        __name__,
    )
    arg_parser.add_argument(
        "-t",
        "--time-to-sleep",
        required=True,
        type=int,
        help=(
            "Indicates the number of seconds that"
            " this script should sleep for after having sent an/each email message."
            " Must be >= 5."
        ),
    )

    args = arg_parser.parse_args()
    logger.debug("args.time_to_sleep = %s", args.time_to_sleep)

    if args.time_to_sleep < 5:
        raise ValueError(
            "The value provided to '--time-to-sleep' must be >= 5;"
            f" found '{args.time_to_sleep}' - crashing..."
        )

    CONFIGURATION_4_BACKEND = os.environ.get("CONFIGURATION_4_BACKEND")
    app = create_app(
        name_of_configuration=CONFIGURATION_4_BACKEND,
    )
    if CONFIGURATION_4_BACKEND == "development":
        app.config["SERVER_NAME"] = "localhost:5000"

    with app.app_context():
        users = User.query.all()

        for u in users:
            if u.is_confirmed:
                logger.info(
                    "skipping %s (because that user has been confirmed)",
                    repr(u),
                )
                continue

            logger.info(
                "sending email to %s, i.e. to %s",
                repr(u),
                u.email,
            )

            # Imitate the implementation of
            # the `send_email_requesting_that_email_address_should_be_confirmed` function.
            token_payload = {
                "purpose": EMAIL_ADDRESS_CONFIRMATION,
                "user_id": u.id,
            }
            email_address_confirmation_token = (
                app.token_serializer_for_email_address_confirmation.dumps(
                    token_payload
                ).decode("utf-8")
            )

            msg_sender = app.config["ADMINS"][0]
            msg_recipients = [u.email]

            msg_subject = "[VocabTreasury] Addendum to our ealier message(s)"
            msg_body = f"""[
({datetime.datetime.now().strftime('%Y/%m/%d, %H:%M:%S')} UTC) Introduction
]

You may have received a few email messages from our email address over the last few days.
The title of each of those messages was 'ACTION REQUIRED: Please confirm your email address'.
Those email messages were faulty in two aspects:
(a) they failed to provide adequate background information, and
(b) they instructed you to use a terminal window in order to issue an HTTP request,
    but issuing that HTTP request resulted in a failure and thus failed to achieve its intended result.



[
To rectify the fault described in (a) above,
let us provide the following additional background.
]

If you do not wish to continue using your VocabTreasury account,
then you do not need to do anything;
_both_ your account _and_ all your data stored therein will be deleted.

If you do not even remember creating a VocabTreasury account,
then it is actually possible that somebody else created an account using your email address.
That could mean that
somebody has obtained and used your email address without your permission or consent.
One way that could have happened is via a data breach.
While it is entirely up to you,
it is _highly recommended_ that
you visit haveibeenpwned[dot]com in your web browser
( or simply click on https://haveibeenpwned.com/ ),
and go on use that website to check whether
your personal data has been compromised via a data breach.
    


[
To rectify the fault described in (b) above:

- please disregard all previous messages
  that you received from our email address over the last few days;

- if you wish to retain and continue using your VocabTreasury account,
  please read and act upon the instructions that are provided below.
]



Dear {u.username},

Thank you for using VocabTreasury.
We hope you have found that both helpful and enjoyable.

A new version of VocabTreasury was released recently.
As part of that release,
we have taken a step towards ensuring more robust security for your user account.
In particular:
from now on, VocabTreasury can be used
only by registered users who also confirm their email addresses.

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
    -L \\
    -H "Content-Type: application/json" \\
    -X POST \\
    {url_for(
        'api_blueprint.confirm_email_address',
        token=email_address_confirmation_token,
        _external=True,
    )}
```

We hope
that you will confirm your email address at your earliest convenience,
and that you will continue using VocabTreasury in the future.
We are looking forward to bringing out new features
that will make your language learning more enjoyable!

Do you have questions about the required email-address confirmation?
Please get in touch with us by sending a message to the following email address:
{app.config['EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING']}

Sincerely,
The VocabTreasury Team

ATTENTION:
If you do not confirm your email address within {app.config["DAYS_FOR_EMAIL_ADDRESS_CONFIRMATION"]} days of receiving this message,
_both_ your account _and_ all your data stored therein will be deleted.
After your account and data have been deleted,
it will be impossible to recover them.
            """

            send_email(
                msg_sender,
                msg_recipients,
                msg_subject,
                msg_body,
            )

            time.sleep(args.time_to_sleep)
