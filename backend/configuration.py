import os

from dotenv import find_dotenv, load_dotenv


dotenv_path = find_dotenv()
load_dotenv(dotenv_path=dotenv_path)


CONFIGURATION_4_BACKEND = os.environ.get("CONFIGURATION_4_BACKEND")
print("CONFIGURATION_4_BACKEND:", CONFIGURATION_4_BACKEND)
EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING = os.environ.get(
    "EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING"
)
EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING = os.environ.get(
    "EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING"
)

if CONFIGURATION_4_BACKEND in {"development", "production"}:
    for env_var_name in (
        "MYSQL_HOST",
        "MYSQL_PORT",
        "MYSQL_USER",
        "MYSQL_PASSWORD",
        "MYSQL_DATABASE",
    ):
        env_var_value = os.environ.get(env_var_name)
        if env_var_value is None and bool(os.environ.get("TESTING")) is False:
            raise ValueError(
                f"failed to find an environment variable called '{env_var_name}'"
            )
        print(env_var_name)

    if (
        EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING is None
        and bool(os.environ.get("TESTING")) is False
    ):
        raise ValueError(
            f"failed to find an environment variable called 'EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING'"
        )
    print("EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING")

    if (
        EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING is None
        and bool(os.environ.get("TESTING")) is False
    ):
        raise ValueError(
            f"failed to find an environment variable called 'EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING'"
        )
    print("EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING")


class Config:
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get("SECRET_KEY")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_PASSWORD')}"
        f"@{os.environ.get('MYSQL_HOST')}:{os.environ.get('MYSQL_PORT')}"
        f"/{os.environ.get('MYSQL_DATABASE')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = os.environ.get("MAIL_PORT")
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    ADMINS = [
        EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_SENDING,
    ]
    EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING = os.environ.get(
        "EMAIL_ADDRESS_OF_ADMINISTRATOR_FOR_RECEIVING"
    )

    DAYS_FOR_EMAIL_ADDRESS_CONFIRMATION = int(
        os.environ.get("DAYS_FOR_EMAIL_ADDRESS_CONFIRMATION")
    )
    MINUTES_FOR_TOKEN_VALIDITY = int(os.environ.get("MINUTES_FOR_TOKEN_VALIDITY"))
    MINUTES_FOR_PASSWORD_RESET = int(os.environ.get("MINUTES_FOR_PASSWORD_RESET"))

    SERVER_NAME = None


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    SERVER_NAME = os.environ.get("SERVER_NAME")


class TestingConfig(Config):
    TESTING = True
    SECRET_KEY = "testing-secret-key"

    SQLALCHEMY_DATABASE_URI = "sqlite://"


name_2_configuration = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
