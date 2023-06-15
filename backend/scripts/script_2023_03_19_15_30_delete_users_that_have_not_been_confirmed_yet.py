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
  # Dry run:

  (venv) backend $ PYTHONPATH=. \
    python \
    scripts/script_2023_03_19_15_30_delete_users_that_have_not_been_confirmed_yet.py \
    --dry-run=True

  # Dry run:

  (venv) backend $ PYTHONPATH=. \
    python \
    scripts/script_2023_03_19_15_30_delete_users_that_have_not_been_confirmed_yet.py

  # Actual run:

  (venv) backend $ PYTHONPATH=. \
    python \
    scripts/script_2023_03_19_15_30_delete_users_that_have_not_been_confirmed_yet.py \
    --dry-run=
  ```
"""

import argparse
import logging

from src import create_app, db
from src.models import User, Example


logger = logging.getLogger(__name__)

logger.setLevel(logging.DEBUG)

handler_1 = logging.StreamHandler()
handler_1.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"),
)

logger.addHandler(handler_1)


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(
        prog=__name__,
    )
    arg_parser.add_argument(
        "--dry-run",
        default=True,
        type=bool,
    )

    args = arg_parser.parse_args()
    logger.debug("args.dry_run = %s", args.dry_run)

    app = create_app(
        name_of_configuration="production",
    )

    with app.app_context():
        users = User.query.filter(
            (User.is_confirmed == None) | (User.is_confirmed == False)
        )
        # fmt: off
        '''
        print(f"{users.count() = }")
         user_17 = User.query.get(17)
        print(f"{user_17 = }")
        print(f"{user_17.is_confirmed = }")
        print(type(user_17.is_confirmed))
        '''
        # fmt: on

        for u in users:
            logger.info("processing %s", repr(u))

            examples = Example.query.filter_by(user_id=u.id)

            n_examples = examples.count()
            logger.info("- has %s Example resources", n_examples)

            if n_examples > 0:
                logger.info("- ...")
                for e in examples:
                    logger.info("- processing %s", repr(e))

                    if args.dry_run is False:
                        db.session.delete(e)

            if args.dry_run is False:
                db.session.delete(u)
                db.session.commit()
