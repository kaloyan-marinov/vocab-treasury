import json
from unittest.mock import patch
import base64
import jwt

from typing import Optional

from flask import url_for, current_app

from src import User, Example
from tests import TestBasePlusUtilities, UserResource
from src.constants import ACCESS


class TestBaseForExampleResources_1(TestBasePlusUtilities):
    def util_create_user(self, username, email, password):
        # Create one `User` resource and confirm it.
        u_r: UserResource = super().util_create_user(
            username,
            email,
            password,
            should_confirm_email_address=True,
        )

        # Issue an access token for the `User` resource, which was created just now.
        basic_auth_credentials = email + ":" + password
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        basic_auth = "Basic " + b_a_c
        rv_2 = self.client.post(
            "/api/tokens",
            headers={
                "Content-Type": "application/json",
                "Authorization": basic_auth,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)

        return UserResource(
            u_r.id,
            u_r.username,
            u_r.email,
            u_r.password,
            u_r.is_confirmed,
            body_2["token"],
        )


class Test_01_CreateExample(TestBaseForExampleResources_1):
    """Test the request responsible for creating a new `Example` resource."""

    def setUp(self):
        super().setUp()

        # Create one `User` resource.
        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._u_r_1: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

        # Prepare a JSON payload, which is required for creating an `Example` resource
        # associated with the above-created `User` resource.
        self._example_data = {
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        self._example_data_str = json.dumps(self._example_data)

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to create an `Example` resource
        without providing a Bearer-Token Auth credential.
        """

        # Act.
        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
        )

        # Assert.
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

    def test_2_missing_content_type(self):
        """
        Ensure that it is impossible to create an `Example` resource
        without providing a 'Content-Type: application/json' header.
        """

        # Act.
        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
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
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            },
        )

    def test_3_incomplete_request_body(self):
        """
        Ensure that it is impossible to create an `Example` resource
        without providing a value for each required field/key in the request body.
        """

        for field in ("new_word", "content"):
            # Arrange.

            # Attempt to create an `Example` resource
            # without providing a value for `field` in the request body.
            data_dict = {k: v for k, v in self._example_data.items() if k != field}
            data_str = json.dumps(data_dict)

            # Act.
            rv = self.client.post(
                "/api/examples",
                data=data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + self._u_r_1.token,
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
                        f"Your request body did not specify a value for '{field}'"
                    ),
                },
            )

            # (Reach directly into the application's persistence layer to)
            # Ensure that no `Example` resources have been created.
            examples = Example.query.all()
            self.assertEqual(len(examples), 0)

    def test_4_create_example(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to edit create an `Example` resource.
        """

        # Act.
        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 201)
        self.assertEqual(
            rv.headers["Location"],
            "http://localhost/api/examples/1",
        )
        self.assertEqual(
            body,
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that an `Example` resource has been created successfully.
        examples = Example.query.all()
        self.assertEqual(len(examples), 1)
        self.assertEqual(examples[0].user_id, 1)

        self.assertEqual(repr(examples[0]), "Example(1, osallistua [+ MIHIN])")

    def test_5_incorrect_token_auth(self):
        """
        Ensure that it is impossible to create a new `Example` resource
        by providing an incorrect Bearer-Token Auth credential.
        """
        # Arrange.
        wrong_authorization = "Bearer " + self._u_r_1.token + "-wrong"

        # Act.
        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": wrong_authorization,
            },
        )

        # Assert.
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

    def test_6_expired_token(self):
        """
        Ensure that it is impossible to create an `Example` resource
        by providing an expired Bearer Token.
        """

        # Act.

        # Simulate a request, in which a client provides an expired Bearer Token.
        with patch(
            "src.auth.jwt.decode",
            side_effect=jwt.ExpiredSignatureError("forced via mocking/patching"),
        ):
            rv = self.client.post(
                "/api/examples",
                data=self._example_data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + self._u_r_1.token,
                },
            )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach into the application's persistence layer to)
        # Ensure that the simulated request didn't create any new `Example` resources.
        examples = Example.query.all()
        self.assertEqual(len(examples), 0)

    def test_7_token_signature_was_tampered_with(self):
        """
        Ensure that
        it is impossible to create an `Example` resource by providing a Bearer Token,
        whose cryptographic signature has been tampered with.
        """

        # Act.

        # Simulate a request, in which a client provides a Bearer Token,
        # whose cryptographic signature has been tampered with.
        with patch(
            "src.auth.jwt.decode",
            side_effect=jwt.DecodeError("forced via mocking/patching"),
        ):
            rv = self.client.post(
                "/api/examples",
                data=self._example_data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + self._u_r_1.token,
                },
            )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach into the application's persistence layer to)
        # Ensure that the simulated request didn't create any new `Example` resources.
        examples = Example.query.all()
        self.assertEqual(len(examples), 0)

    def test_8_token_for_nonexistent_user(self):
        """
        Ensure that
        it is impossible to create an `Example` resource by providing a Bearer Token,
        whose payload specifies a non-existent user ID.
        """

        # Arrange.
        # +
        # Act.

        # Simulate a request, in which a client provides a Bearer Token,
        # whose payload specifies a non-existent user ID.
        nonexistent_user_id = 17
        with patch(
            "src.auth.jwt.decode",
            return_value={
                "purpose": ACCESS,
                "user_id": nonexistent_user_id,
            },
        ):
            rv = self.client.post(
                "/api/examples",
                data=self._example_data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + self._u_r_1.token,
                },
            )

        # Assert.
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

        # (Reach into the application's persistence layer to)
        # Ensure that the simulated request didn't create any new Example resources.
        examples = Example.query.all()
        self.assertEqual(len(examples), 0)


class TestBaseForExampleResources_2(TestBaseForExampleResources_1):
    def util_create_example(
        self,
        access_token_for_specific_user: str,
        source_language,
        new_word,
        content,
        content_translation: Optional[str],
    ):
        example_data = {
            "source_language": source_language,
            "new_word": new_word,
            "content": content,
        }
        if content_translation is not None:
            example_data["content_translation"] = content_translation
        example_data_str = json.dumps(example_data)

        rv = self.client.post(
            "/api/examples",
            data=example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + access_token_for_specific_user,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        e = Example.query.get(body["id"])
        return e


class Test_02_GetExamples(TestBaseForExampleResources_2):
    """
    Test the request responsible for getting a list of `Example` resources,
    all of which are associated with a given User resource.
    """

    def setUp(self):
        super().setUp()

        # Create one `User` resource.
        user_data_1 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._u_r_1: UserResource = self.util_create_user(
            user_data_1["username"],
            user_data_1["email"],
            user_data_1["password"],
        )

    def test_1_no_examples_exist(self):
        """
        Given a `User` who doesn't have any `Example` resources of her own,
        ensure that, when that `User` requests a list of resources,
        she doesn't get any.
        """

        # Act.
        rv = self.client.get(
            "/api/examples",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        with current_app.test_request_context():
            _links_self = url_for("api_blueprint.get_examples", per_page=10, page=1)
        self.assertEqual(
            body,
            {
                "items": [],
                "_meta": {
                    "total_items": 0,
                    "per_page": 10,
                    "total_pages": 0,
                    "page": 1,
                },
                "_links": {
                    "self": _links_self,
                    "next": None,
                    "prev": None,
                    "first": _links_self,
                    "last": None,
                },
            },
        )

    def test_2_some_examples_exist(self):
        """
        Given a `User` who has nonzero `Example` resources of her own,
        ensure that, when that `User` requests a list of resources,
        she gets page 1 of her own resources.
        """

        # Arrange.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        e: Example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.
        # Get all `Example` resources that are associated with the only existing `User`.
        rv = self.client.get(
            "/api/examples",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        with current_app.test_request_context():
            _links_self = url_for("api_blueprint.get_examples", per_page=10, page=1)
        self.assertEqual(
            body,
            {
                "items": [
                    {
                        "id": 1,
                        "source_language": "Finnish",
                        "new_word": "osallistua [+ MIHIN]",
                        "content": "Kuka haluaa osallistua kilpailuun?",
                        "content_translation": "Who wants to participate in the competition?",
                    }
                ],
                "_meta": {
                    "total_items": 1,
                    "per_page": 10,
                    "total_pages": 1,
                    "page": 1,
                },
                "_links": {
                    "self": _links_self,
                    "next": None,
                    "prev": None,
                    "first": _links_self,
                    "last": _links_self,
                },
            },
        )

    def test_3_access_only_own_examples(self):
        """
        Ensure that each `User` can get a list of her own `Example` resources,
        but cannot get a list of another `User`'s `Example` resources.
        """

        # Arrange.

        # Create a second `User` resource.
        user_data_2 = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }
        u_r_2: UserResource = self.util_create_user(
            user_data_2["username"],
            user_data_2["email"],
            user_data_2["password"],
        )

        # Create one `Example` resource for the first `User`.
        source_language_1 = "Finnish"
        new_word_1 = "osallistua [+ MIHIN]"
        content_1 = "Kuka haluaa osallistua kilpailuun?"
        content_translation_1 = "Who wants to participate in the competition?"

        example_1 = self.util_create_example(
            self._u_r_1.token,
            source_language_1,
            new_word_1,
            content_1,
            content_translation_1,
        )

        # Create one `Example` resource for the second `User`.
        source_language_2 = "Finnish"
        new_word_2 = "kieli"
        content_2 = "Mitä kieltä sinä puhut?"
        content_translation_2 = "What languages do you speak?"

        example_2 = self.util_create_example(
            u_r_2.token,
            source_language_2,
            new_word_2,
            content_2,
            content_translation_2,
        )

        # Act.

        # Ensure that the 2nd `User` can get all of her own `Example` resources,
        # but cannot get any of the `Example` resources that belong to another `User`.
        rv_3 = self.client.get(
            "/api/examples",
            headers={
                "Authorization": "Bearer " + u_r_2.token,
            },
        )

        # Assert.
        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)

        self.assertEqual(rv_3.status_code, 200)

        example_ids_of_user_resource_2 = {example["id"] for example in body_3["items"]}
        self.assertEqual(
            example_ids_of_user_resource_2,
            {example_2.id},
        )
        example_ids_of_user_resource_1 = {example_1.id}
        self.assertEqual(
            example_ids_of_user_resource_2.intersection(example_ids_of_user_resource_1),
            set(),
        )

    def test_4_filter_own_resources(self):
        """
        Ensure that each `User` can get a filtered list of her own `Example` resources.
        """

        # Arrange.

        # Create own `Example` resources.
        source_language = "Finnish"
        list_of_example_data = [
            {"new_word": "123", "content": "456", "content_translation": "789"},
            {"new_word": "ABC", "content": "PQR", "content_translation": "XYZ"},
            {"new_word": "ABC", "content": "XYZ", "content_translation": "PQR"},
            {"new_word": "PQR", "content": "ABC", "content_translation": "XYZ"},
            {"new_word": "PQR", "content": "XYZ", "content_translation": "ABC"},
            {"new_word": "XYZ", "content": "ABC", "content_translation": "PQR"},
            {"new_word": "XYZ", "content": "PQR", "content_translation": "ABC"},
        ]

        for example_data in list_of_example_data:
            self.util_create_example(
                self._u_r_1.token,
                source_language,
                example_data["new_word"],
                example_data["content"],
                example_data["content_translation"],
            )

        # fmt: off
        query_param_dicts = (
            {'new_word': 'ABC', 'content': 'PQR', 'content_translation': 'XYZ'},

            {'new_word': 'ABC', 'content': 'PQR'},
            {'new_word': 'ABC',                   'content_translation': 'XYZ'},
            {                   'content': 'PQR', 'content_translation': 'XYZ'},

            {'new_word': 'ABC'},
            {                   'content': 'PQR'},
            {                                     'content_translation': 'XYZ'}
        )
        expected_id_sets = (
            {2},
            
            {2},
            {2},
            {2},

            {2, 3},
            {2, 7},
            {2, 4}
        )
        # fmt: on

        for query_param_dict, expected_id_set in zip(
            query_param_dicts, expected_id_sets
        ):
            # Act.
            query_param_str = "?" + "&".join(
                [k + "=" + v for k, v in query_param_dict.items()]
            )
            url = "/api/examples" + query_param_str
            rv = self.client.get(
                url,
                headers={
                    "Authorization": "Bearer " + self._u_r_1.token,
                },
            )

            body_str = rv.get_data(as_text=True)
            body = json.loads(body_str)

            # Assert.
            self.assertEqual({item["id"] for item in body["items"]}, expected_id_set)

    def test_5_pagination_of_filtered_resources(self):
        """
        Ensure that,
        when a `User` issues a request for a filtered list of her own `Example` resources,
        the response is paginated properly.
        """

        # Arrange.
        source_language = "Finnish"
        list_of_example_data = [{"new_word": x % 2, "content": x} for x in range(11)]
        content_translation = None
        for example_data in list_of_example_data:
            self.util_create_example(
                self._u_r_1.token,
                source_language,
                example_data["new_word"],
                example_data["content"],
                content_translation,
            )

        # Act.
        rv_2 = self.client.get(
            "/api/examples?per_page=2&page=2&new_word=1",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)

        # Assert.
        self.maxDiff = None
        self.assertEqual(
            {
                "_meta": {
                    "total_items": 5,
                    "per_page": 2,
                    "total_pages": 3,
                    "page": 2,
                },
                "_links": {
                    "self": "/api/examples?per_page=2&page=2&new_word=1",
                    "next": "/api/examples?per_page=2&page=3&new_word=1",
                    "prev": "/api/examples?per_page=2&page=1&new_word=1",
                    "first": "/api/examples?per_page=2&page=1&new_word=1",
                    "last": "/api/examples?per_page=2&page=3&new_word=1",
                },
                "items": [
                    {
                        "id": 6,
                        "source_language": "Finnish",
                        "new_word": "1",
                        "content": "5",
                        "content_translation": None,
                    },
                    {
                        "id": 8,
                        "source_language": "Finnish",
                        "new_word": "1",
                        "content": "7",
                        "content_translation": None,
                    },
                ],
            },
            body_2,
        )


class Test_03_GetExample(TestBaseForExampleResources_2):
    """Test the request responsible for getting a specific `Example` resource."""

    def setUp(self):
        super().setUp()

        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._u_r_1: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible for a user to get a specific resource of her own
        without providing a Bearer-Token Auth credential.
        """

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example_1 = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Attempt to get the Example resource, which was created just now,
        # without providing a Bearer-Token Auth credential.
        rv = self.client.get(f"/api/examples/{example_1.id}")

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that there is one user,
        # who has Example resources of her own.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        u = users[0]
        self.assertEqual(u.id, self._u_r_1.id)

        examples = Example.query.all()
        self.assertEqual(len(examples), 1)
        e = examples[0]
        self.assertEqual(e.user_id, u.id)

    def test_2_nonexistent_example(self):
        """
        Ensure that
        attempting to get an `Example` resource, which doesn't exist, returns a 404.
        """

        # Act.
        rv = self.client.get(
            "/api/examples/1",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": "Your User doesn't have an Example resource with an ID of 1",
            },
        )

    def test_3_example_that_exists(self):
        """Ensure that a user is able to get a specific `Example` resource of her own."""

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.
        rv = self.client.get(
            f"/api/examples/{example.id}",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_4_prevent_accessing_of_foreign_example(self):
        """
        Ensure that a `User` cannot get a specific `Example` resource,
        which belongs to a different `User`.
        """

        # Arrange.

        # Create a second `User` resource.
        user_data = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }
        u_r_2: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

        # Create one `Example` resource for the second `User`.
        source_language = "Finnish"
        new_word = "kieli"
        content = "Mitä kieltä sinä puhut?"
        content_translation = "What languages do you speak?"

        example_2 = self.util_create_example(
            u_r_2.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.
        rv = self.client.get(
            f"/api/examples/{example_2.id}",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_2.id)
                ),
            },
        )


class Test_04_EditExample(TestBaseForExampleResources_2):
    """Test the request responsible for editing a specific `Example` resource."""

    def setUp(self):
        super().setUp()

        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._u_r_1: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to edit a specific `Example` resource
        without providing a Bearer-Token Auth credential.
        """

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Attempt to edit the `Example` resource, which was created just now,
        # without providing a Bearer-Token Auth credential.
        data = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str = json.dumps(data)

        rv = self.client.put(
            f"/api/examples/{example.id}",
            data=data_str,
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the `Example` resource, which was targeted, didn't get edited.
        e = Example.query.get(example.id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example.id,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_2_missing_content_type(self):
        """
        Ensure that it is impossible to edit a specific `Example` resource
        without providing a 'Content-Type: application/json' header.
        """

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Attempt to edit the `Example` resource, which was created just now,
        # without providing a "Content-Type: application/json" header.
        data = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str = json.dumps(data)

        rv = self.client.put(
            f"/api/examples/{example.id}",
            data=data_str,
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
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
                    'Your request did not include a "Content-Type: application/json"'
                    " header."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)"
        # Ensure that the `Example` resource, which was targeted, didn't get edited.
        e = Example.query.get(example.id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example.id,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_3_edit_own_example(self):
        """
        Ensure that a `User` is able to edit a specific `Example` resource of her own.
        """

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Edit the `Example` resource, which was created just now.
        data = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str = json.dumps(data)

        rv = self.client.put(
            f"/api/examples/{example.id}",
            data=data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": example.id,
                "source_language": "English",
                "new_word": "participate [in sth]",
                "content": "Who wants to participate in the competition?",
                "content_translation": "Kuka haluaa osallistua kilpailuun?",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that
        # the `Example` resource, which was targeted, got edited successfully.
        e = Example.query.get(example.id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example.id,
                "source_language": "English",
                "new_word": "participate [in sth]",
                "content": "Who wants to participate in the competition?",
                "content_translation": "Kuka haluaa osallistua kilpailuun?",
            },
        )

    def test_4_prevent_editing_of_foreign_example(self):
        """
        Ensure that a `User` cannot edit a specific `Example` resource,
        which belongs to a different `User`.
        """

        # Arrange.

        # Create a second `User` resource.
        user_data = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }
        u_r_2: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

        # Create one `Example` resource for the second `User`.
        source_language_2 = "Finnish"
        new_word_2 = "kieli"
        content_2 = "Mitä kieltä sinä puhut?"
        content_translation_2 = "What languages do you speak?"

        example_2 = self.util_create_example(
            u_r_2.token,
            source_language_2,
            new_word_2,
            content_2,
            content_translation_2,
        )

        # Act.

        # Ensure that
        # the 1st `User` cannot edit a specific `Example` resource,
        # which belongs to the 2nd `User`.
        data = {
            "source_language": "English",
            "new_word": "participate [in sth]",
            "content": "Who wants to participate in the competition?",
            "content_translation": "Kuka haluaa osallistua kilpailuun?",
        }
        data_str = json.dumps(data)
        rv = self.client.put(
            f"/api/examples/{example_2.id}",
            data=data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_2.id)
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the `Example` resource, which was targeted, didn't get edited.
        e = Example.query.get(example_2.id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "kieli",
                "content": "Mitä kieltä sinä puhut?",
                "content_translation": "What languages do you speak?",
            },
        )


class Test_05_DeleteExample(TestBaseForExampleResources_2):
    """Test the request responsible for deleting a specific Example resource."""

    def setUp(self):
        super().setUp()

        user_data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._u_r_1: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to delete a specific `Example` resource
        without providing a Bearer-Token Auth credential.
        """

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Attempt to delete the `Example` resource, which was created just now,
        # without providing a Bearer-Token Auth credential.
        rv = self.client.delete(f"/api/examples/{example.id}")

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 401)
        self.assertEqual(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Bearer-Token Auth format is required.",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the `Example` resource, which was targeted, did not get deleted.
        e = Example.query.get(example.id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": example.id,
                "source_language": "Finnish",
                "new_word": "osallistua [+ MIHIN]",
                "content": "Kuka haluaa osallistua kilpailuun?",
                "content_translation": "Who wants to participate in the competition?",
            },
        )

    def test_2_delete_own_example(self):
        """
        Ensure that a `User` is able to delete a specific `Example` of her own.
        """

        # Arrange.

        # Create one `Example` resource.
        source_language = "Finnish"
        new_word = "osallistua [+ MIHIN]"
        content = "Kuka haluaa osallistua kilpailuun?"
        content_translation = "Who wants to participate in the competition?"

        example = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Delete the `Example` resource, which was created just now.
        rv_2 = self.client.delete(
            f"/api/examples/{example.id}",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str_2 = rv_2.get_data(as_text=True)

        self.assertEqual(rv_2.status_code, 204)
        self.assertEqual(body_str_2, "")

        # (Reach directly into the application's persistence layer to)
        # Ensure that the `Example` resource, which was targeted, got deleted
        # successfully.
        e = Example.query.get(example.id)
        self.assertIsNone(e)

    def test_3_prevent_deleting_of_foreign_example(self):
        """
        Ensure that a `User` cannot delete a specific `Example` resource,
        which belongs to a different `User`.
        """

        # Arrange.

        # Create a second `User` resource.
        user_data = {
            "username": "ms",
            "email": "mary.smith@protonmail.com",
            "password": "456",
        }
        u_r_2: UserResource = self.util_create_user(
            user_data["username"],
            user_data["email"],
            user_data["password"],
        )

        # Create one `Example` resource for the second `User`.
        source_language = "Finnish"
        new_word = "kieli"
        content = "Mitä kieltä sinä puhut?"
        content_translation = "What languages do you speak?"

        example_2 = self.util_create_example(
            u_r_2.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.

        # Ensure that
        # the 1st `User` cannot delete
        # a specific `Example` resource, which belongs to the 2nd `User`.
        rv = self.client.delete(
            f"/api/examples/{example_2.id}",
            headers={
                "Authorization": "Bearer " + self._u_r_1.token,
            },
        )

        # Assert.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)

        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_2.id)
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the Example resource, which was targeted, didn't get deleted.
        e = Example.query.get(example_2.id)
        self.assertEqual(
            e.to_dict(),
            {
                "id": 1,
                "source_language": "Finnish",
                "new_word": "kieli",
                "content": "Mitä kieltä sinä puhut?",
                "content_translation": "What languages do you speak?",
            },
        )


class Test_06_DeleteUserHavingResources(TestBaseForExampleResources_2):
    """
    Test the request responsible for deleting a specific `User` resource
    in the specific case where
    there exist resources (in other database models)
    that are associated with the targeted `User` resource.
    """

    def setUp(self):
        super().setUp()

        user_data_1 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self._u_r_1: UserResource = self.util_create_user(
            user_data_1["username"],
            user_data_1["email"],
            user_data_1["password"],
        )

    def test_1_prevent_deletion(self):
        # Arrange.
        source_language = "Finnish"
        new_word = "kieli"
        content = "Mitä kieltä sinä puhut?"
        content_translation = "What languages do you speak?"

        __ = self.util_create_example(
            self._u_r_1.token,
            source_language,
            new_word,
            content,
            content_translation,
        )

        # Act.
        basic_auth_credentials = f"{self._u_r_1.email}:{self._u_r_1.password}"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            f"/api/users/{self._u_r_1.id}",
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
                    "Your User resource cannot be deleted at this time,"
                    " because there exists at least one resource"
                    " that is associated with your User resource."
                ),
            },
        )

        users = User.query.filter_by(id=self._u_r_1.id)
        self.assertEqual(users.count(), 1)

        examples = Example.query.filter_by(user_id=self._u_r_1.id)
        self.assertEqual(examples.count(), 1)
