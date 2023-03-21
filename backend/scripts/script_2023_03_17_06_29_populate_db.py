"""
- launch a terminal instance

- specify an environment variable called 'EMAIL_1',
  as described in `./README.md`

- specify an environment variable called 'EMAIL_2',
  as described in `./README.md`

- execute this script by issuing
  ```
  (venv) backend $ PYTHONPATH=. \
    python \
    scripts/script_2023_03_17_06_29_populate_db.py
  ```
"""

import datetime
import os
import logging

from src import db, flsk_bcrpt, create_app
from src.models import User, Example


logger = logging.getLogger(__name__)

logger.setLevel(logging.DEBUG)

handler_1 = logging.StreamHandler()
handler_1.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"),
)

logger.addHandler(handler_1)


if __name__ == "__main__":
    app = create_app(
        name_of_configuration="production",
    )

    with app.app_context():
        # TODO: (2023/03/21, 07:24)
        #       consider refactoring this code-block
        #       based on the suggestion made by the comment at
        #       https://stackoverflow.com/questions/60435406/which-exception-should-be-raised-when-a-required-environment-variable-is-missing#comment106913452_60435527
        email_1_real = os.environ.get("EMAIL_1")
        email_2_real = os.environ.get("EMAIL_2")
        if email_1_real is None or email_2_real is None:
            msg = (
                "Environment variables called 'EMAIL_1' and 'EMAIL_2' must be"
                " specified: crashing..."
            )
            logger.error(msg)
            raise ValueError(
                datetime.datetime.utcnow().strftime("%Y-%m-%d, %H:%M:%S UTC")
                + " - "
                + msg
            )

        # Create `User`s with real email addresses.
        logger.info("Create `User`s with real email addresses.")

        u_1_real = User(
            username=email_1_real.split("@")[0],
            email=email_1_real,
            password_hash=flsk_bcrpt.generate_password_hash("123").decode("utf-8"),
            is_confirmed=True,
        )

        u_2_real = User(
            username=email_2_real.split("@")[0],
            email=email_2_real,
            password_hash=flsk_bcrpt.generate_password_hash("234").decode("utf-8"),
            is_confirmed=False,
        )

        db.session.add(u_1_real)
        db.session.add(u_2_real)
        db.session.commit()

        # Create `User`s with fake (= invalid = non-existent) email addresses.
        logger.info(
            "Create `User`s with fake (= invalid = non-existent) email addresses."
        )

        email_3_fake = "abc@def.ghi"
        u_3_fake = User(
            username=email_3_fake.split("@")[0],
            email=email_3_fake,
            password_hash=flsk_bcrpt.generate_password_hash("345").decode("utf-8"),
            is_confirmed=False,
        )

        email_4_fake = "this-does-not-even-resemble-an-email-address"
        u_4_fake = User(
            username="username-4",
            email=email_4_fake,
            password_hash=flsk_bcrpt.generate_password_hash("456").decode("utf-8"),
            is_confirmed=False,
        )

        db.session.add(u_3_fake)
        db.session.add(u_4_fake)
        db.session.commit()

        # Create `Example`s for the `User`s with real email addresses.
        logger.info("Create `Example`s for the `User`s with real email addresses.")

        e_1 = Example(
            user_id=u_1_real.id,
            new_word="word-1",
            content="This is how to use 'word-1' in a sentence.",
        )

        e_2 = Example(
            user_id=u_2_real.id,
            new_word="word-2",
            content="This is how to use 'word-2' in a sentence.",
        )

        db.session.add(e_1)
        db.session.add(e_2)
        db.session.commit()

        # It is (or, at minimum, _should_ be) very much impossible
        # for the database to contain `Example` resources,
        # which are associated with any unconfirmed `User`
        # (and much less so with an unconfirmed `User`
        # whose email address is a fake one!).
        # Nevertheless, go on to pretend that
        # several rogue `User`s have somehow managed
        # to create `Example` resources of their own
        # without having confirmed their accounts beforehand.
        logger.info(
            "Create `Example`s for the `User`s with fake (= invalid = non-existent) email addresses."
        )

        e_3 = Example(
            user_id=u_3_fake.id,
            new_word="word-3",
            content="This is how to use 'word-3' in a sentence.",
        )

        e_4 = Example(
            user_id=u_4_fake.id,
            new_word="word-4",
            content="This is how to use 'word-4' in a sentence.",
        )

        db.session.add(e_3)
        db.session.add(e_4)
        db.session.commit()
