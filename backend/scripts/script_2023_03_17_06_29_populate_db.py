import datetime
import os
import sys

from src import db, flsk_bcrpt, create_app
from src.models import User, Example


if __name__ == "__main__":
    app = create_app(
        name_of_configuration="production",
    )

    with app.app_context():
        email_1_real = os.environ.get("EMAIL_1")
        email_2_real = os.environ.get("EMAIL_2")
        if email_1_real is None or email_2_real is None:
            sys.exit(
                datetime.datetime.utcnow().strftime("%Y-%m-%d, %H:%M:%S UTC")
                + " - Environment variables called 'EMAIL_1' and 'EMAIL_2' must be specified:"
                + " crashing..."
            )

        # Create `User`s with real email addresses.
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
