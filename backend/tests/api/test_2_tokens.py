import json
import base64

from unittest.mock import patch

from itsdangerous import TimedJSONWebSignatureSerializer
from flask import current_app

from tests import TestBasePlusUtilities


class Test_01_IssueToken(TestBasePlusUtilities):
    """
    Test the request responsible for issuing a JSON Web Signature token for a user,
    who has authenticated herself successfully as part of that same request.
    """

    def setUp(self):
        super().setUp()

        # Create one User resource.
        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._user_id = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

        # Compute a valid token for the User resource, which was created just now.
        token_serializer = TimedJSONWebSignatureSerializer(
            current_app.config["SECRET_KEY"], expires_in=3600
        )
        token = token_serializer.dumps({"user_id": self._user_id}).decode("utf-8")
        self._expected_body = {"token": token}

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to issue a(n access) token
        without providing Basic Auth credentials.
        """

        rv = self.client.post("/api/tokens")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

    def test_2_unconfirmed_user(self):
        # Arrange.
        # Note that
        # the `User` resource identified by `self._user_id` has not been confirmed.

        # Act.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/1",
            headers={
                "Authorization": authorization,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "Your account has not been confirmed."
                    " Please confirm your account and re-issue the same HTTP request."
                ),
            },
        )

    def test_3_issue_token(self):
        """
        Ensure that a(n access) token gets issued for the user,
        who is authenticated by the issued request's header.
        """

        # Arrange.
        self.util_confirm_user(self._user_id)

        # Act.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        basic_auth = "Basic " + b_a_c
        rv = self.client.post("/api/tokens", headers={"Authorization": basic_auth})

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)

        # Assert.
        # fmt: off
        '''
        At first sight, it might seem that
        the next code-block should be replaced by the single statement,
        which is currently located within the `try`-statement.
        
        Unfortunately, that would not work as expected 100% of the time.
        The reason for that is hinted at by the content of the `except`-statement,
        and that reason can be summarized as follows:
            the endpoint handler relies on a _Timed_JSONWebSignatureSerializer,
            which means that,
            if the execution of the endpoint handler takes more than 1 s,
            then
            (a) the observed and expected headers will not be equal to each other, and
            (b) the observed and expected cryptographic signatures will not be
                equal to each other.
        
        For that reason, the next code-block utilizes the `try`-`except` construct
        so that, even if the `try`-block's assertion fails,
        the `except`-block will make another less-stringent-but-nevertheless-meaningful
        assertion.
        '''
        # fmt: on
        try:
            self.assertEqual(body, self._expected_body)
        except AssertionError as e:
            header, payload, cryptographic_signature = body["token"].split(".")
            h_expected, p_expected, c_s_expected = self._expected_body["token"].split(
                "."
            )

            print()
            for name, value, value_expected in zip(
                ["header", "payload", "cryptographic signature"],
                [header, payload, cryptographic_signature],
                [h_expected, p_expected, c_s_expected],
            ):
                print(f"{name}s equal?   {value == value_expected}")
                print(f"{name} observed: {value}")
                print(f"{name} expected: {value_expected}")

            self.assertEqual(payload, p_expected)

    def test_4_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to issue a(n access) token
        by providing an incorrect set of Basic Auth credentials.
        """

        # Arrange.
        self.util_confirm_user(self._user_id)

        # Act.
        wrong_basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        wrong_b_a_c = base64.b64encode(
            wrong_basic_auth_credentials.encode("utf-8")
        ).decode("utf-8")
        wrong_authorization = "Authorization " + wrong_b_a_c
        rv = self.client.post(
            "/api/tokens",
            headers={"Authorization": wrong_authorization},
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )


class Test_02_GetUserProfile(TestBasePlusUtilities):
    """
    Test the request responsible for getting the User Profile resource,
    which is associated with a given User resource.
    """

    def setUp(self):
        super().setUp()

        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._user_id = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible for a user to get her own User Profile resource
        without providing a Bearer-Token Auth credential.
        """

        rv = self.client.get("/api/user-profile")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": (
                    "Authentication in the Bearer-Token Auth format is required."
                ),
            },
        )

    def test_2_unconfirmed_user(self):
        # Arrange.
        # Note that
        # the `User` resource identified by `self._user_id` has not been confirmed.
        authorization = "Bearer use-mock-to-treat-this-as-valid-token"

        # Act.
        with patch(
            "src.TimedJSONWebSignatureSerializer.loads"
        ) as serializer_loads_mock:
            serializer_loads_mock.return_value = {"user_id": self._user_id}

            rv = self.client.get(
                "/api/user-profile",
                headers={
                    "Authorization": authorization,
                },
            )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "Your account has not been confirmed."
                    " Please confirm your account and re-issue the same HTTP request."
                ),
            },
        )

    def test_3_get_user_profile(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to fetch her own User Profile resource.
        """

        # Arrange.
        self.util_confirm_user(self._user_id)

        # Issue an access token for the user.
        basic_auth_credentials = "john.doe@protonmail.com" + ":" + "123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        rv_1 = self.client.post(
            "/api/tokens",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Basic " + b_a_c,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        token = body_1["token"]

        # Fetch the user's own User Profile resource.
        rv_2 = self.client.get(
            "/api/user-profile", headers={"Authorization": "Bearer " + token}
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2, {"id": 1, "username": "jd", "email": "john.doe@protonmail.com"}
        )
