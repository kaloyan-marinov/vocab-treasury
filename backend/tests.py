import unittest
import json
import base64
import os
from werkzeug.security import check_password_hash
from itsdangerous import TimedJSONWebSignatureSerializer


TESTING_SECRET_KEY = "testing-secret-key"
os.environ["SECRET_KEY"] = TESTING_SECRET_KEY
os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite://"


from backend.vocab_treasury import app, db, User, Example


app.config["TESTING"] = True


class TestBase(unittest.TestCase):
    def setUp(self):
        db.drop_all()  # just in case
        db.create_all()
        self.client = app.test_client()

    def tearDown(self):
        db.drop_all()


class Test_1_CreateUser(TestBase):
    """"Test the request responsible for creating a new User resource."""

    def setUp(self):
        self.data_dict = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        self.data_str = json.dumps(self.data_dict)
        super().setUp()

    def test_1_missing_content_type(self):
        """
        Ensure that it is impossible to create a User resource
        without providing a 'Content-Type: application/json' header.
        """

        # Attempt to create a User resource
        # without providing a 'Content-Type: application/json' header.
        rv = self.client.post("api/users", data=self.data_str)

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

        # (Reach directly into the application's persistence layer to)
        # Ensure that no User resources have been created.
        users = User.query.all()
        self.assertEqual(len(users), 0)

    def test_2_incomplete_request_body(self):
        """
        Ensure that it is impossible to create a User resource
        without providing a value for each required field/key in the request body.
        """

        for field in ("username", "email", "password"):
            with self.subTest():
                # Attempt to create a User resource
                # without providing a value for `field` in the request body.
                data_dict = {k: v for k, v in self.data_dict.items() if k != field}
                data_str = json.dumps(data_dict)
                rv = self.client.post(
                    "/api/users",
                    data=data_str,
                    headers={"Content-Type": "application/json"},
                )

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
                # Ensure that no User resources have been created.
                users = User.query.all()
                self.assertEqual(len(users), 0)

    def test_3_create_user(self):
        """Ensure that it is possible to create a new User resource."""

        # Create a new User resource.
        rv = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 201)
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "jd",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that a User resource has been created successfully.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "123"))

    def test_4_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to create a User resource,
        which has the same email as an existing User resource.
        """

        # Create one User resource.
        rv_0 = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to create a second User resource with the same email as the User
        # resource that was created just now.
        data = {
            "username": "different-username",
            "email": "john.doe@protonmail.com",
            "password": "different-password",
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users", data=data_str, headers={"Content-Type": "application/json"}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the attempt has not created a second User resource.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "123"))

    def test_5_prevent_duplication_of_usernames(self):
        """
        Ensure that it is impossible to create a User resource,
        which has the same username as an existing User resource.
        """

        # Create one User resource.
        rv_0 = self.client.post(
            "/api/users",
            data=self.data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to create a second User resource with the same username as the User
        # resource that was created just now.
        data = {
            "username": "jd",
            "email": "different-email@protonmail.com",
            "password": "different-password",
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same username as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the attempt has not created a second User resource.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "123"))


class Test_2_GetUsers(TestBase):
    """"Test the request responsible for getting all existing User resources."""

    def test_1_empty_database(self):
        """
        Ensure that, when the database doesn't contain any User resources,
        getting all User resources doesn't return any.
        """

        # Get all User resources.
        rv = self.client.get("/api/users")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(body, {"users": []})

    def test_2_nonempty_database(self):
        """
        Ensure that, when the database contains some User resources,
        it is possible to get all User resources.
        """

        # Create one User resource.
        data_0 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
        )

        # Get all User resources.
        rv = self.client.get("/api/users")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "users": [
                    {
                        "id": 1,
                        "username": "jd",
                    }
                ]
            },
        )


class Test_3_GetUser(TestBase):
    """Test the request responsible for getting one specific User resource."""

    def test_1_nonexistent_user(self):
        """
        Ensure that
        attempting to get a User resource, which doesn't exist, returns a 404.
        """
        rv = self.client.get("/api/users/1")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 404)
        self.assertEqual(
            body,
            {
                "error": "Not Found",
                "message": "There doesn't exist a User resource with an id of 1",
            },
        )

    def test_2_user_that_exists(self):
        """
        Ensure that, when the database contains some User resources,
        it is possible to get a specific User resource.
        """

        # Create one User resource.
        data_0 = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str_0 = json.dumps(data_0)
        rv_0 = self.client.post(
            "/api/users",
            data=data_str_0,
            headers={"Content-Type": "application/json"},
        )

        # Get the User resource that was created just now.
        rv = self.client.get("/api/users/1")

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "jd",
            },
        )


class Test_4_EditUser(TestBase):
    """Test the request responsible for editing a specific User resource."""

    def setUp(self):
        self.data = {
            "username": "JD",
            "email": "JOHN.DOE@PROTONMAIL.COM",
            "password": "!@#",
        }
        self.data_str = json.dumps(self.data)
        super().setUp()

    def _create_user(self, username, email, password):
        data = {
            "username": username,
            "email": email,
            "password": password,
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing Basic Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to edit the User resource, which was created just now,
        # without prodiving Basic Auth credentials.
        rv = self.client.put("/api/users/1", data=self.data_str)

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

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "123"))

    def test_2_missing_content_type(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing a 'Content-Type: application/json' header.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to edit the User resource, which was created just now,
        # without prodiving a 'Content-Type: application/json' header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1", data=self.data_str, headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "123"))

    def test_3_prevent_editing_of_another_user(self):
        """
        Ensure that it is impossible to edit a User resource,
        which does not correspond to
        the user authenticated by the issued request's header.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to edit a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/2",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 403)
        self.assertEqual(
            body,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to edit any User resource different from your"
                    " own."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        user = User.query.get(2)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@yahoo.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "456"))

    def test_4_edit_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to edit his/her corresponding User resource.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Edit the User resource that was created just now.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": 1,
                "username": "JD",
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, got edited successfully.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        edited_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(edited_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "JD",
                "email": "JOHN.DOE@PROTONMAIL.COM",
            },
        )
        self.assertTrue(check_password_hash(edited_u.password_hash, "!@#"))

    def test_5_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to edit a User resource in such a way
        that two different User resources would end up having the same email.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to edit the 1st User resource in such a way that
        # its email should be end up being identical to the 2nd User resource's email.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data = {"email": "mary.smith@yahoo.com"}
        data_str = json.dumps(data)

        rv = self.client.put(
            "/api/users/1",
            data=data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same email as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        targeted_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(targeted_u.password_hash, "123"))

    def test_6_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        by providing an incorrect set of Basic Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to edit a User resource
        # by providing an incorrect set of Basic Auth credentials.
        basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.put(
            "/api/users/1",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

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

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get edited.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        targeted_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(targeted_u.password_hash, "123"))

    def test_7_prevent_duplication_of_usernames(self):
        """
        Ensure that it is impossible to edit a User resource in such a way
        that two different User resources would end up having the same username.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to edit the 1st User resource in such a way that
        # its username would end up being identical to the 2nd User resource's username.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        data = {"username": "ms"}
        data_str = json.dumps(data)

        rv = self.client.put(
            "/api/users/1",
            data=data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 400)
        self.assertEqual(
            body,
            {
                "error": "Bad Request",
                "message": (
                    "There already exists a User resource with the same username as the"
                    " one you provided."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the attempt has not created a second User resource.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(user.password_hash, "123"))


class Test_5_DeleteUser(TestBase):
    """Test the request responsible for deleting a specific User resource."""

    def _create_user(self, username, email, password):
        data = {
            "username": username,
            "email": email,
            "password": password,
        }
        data_str = json.dumps(data)
        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

    def test_1_missing_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource without providing Basic
        Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to delete the User resource, which was created just now,
        # without prodiving Basic Auth credentials.
        rv = self.client.delete("/api/users/1")

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

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get deleted.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        targeted_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(targeted_u.password_hash, "123"))

    def test_2_prevent_deleting_of_another_user(self):
        """
        Ensure that it is impossible to edit a User resource,
        which does not correspond to
        the user authenticated by the issued request's header.
        """

        # Create two User resources.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._create_user(username="ms", email="mary.smith@yahoo.com", password="456")

        # Attempt to delete a User resource, which does not correspond to
        # the user authenticated by the issued request's header.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/2", headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 403)
        self.assertEqual(
            body,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to delete any User resource different from"
                    " your own."
                ),
            },
        )

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get deleted.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        targeted_u = User.query.get(2)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@yahoo.com",
            },
        )
        self.assertTrue(check_password_hash(targeted_u.password_hash, "456"))

    def test_3_delete_the_authenticated_user(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to delete his/her corresponding User resource.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Delete a User resource.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/1", headers={"Authorization": authorization}
        )

        body_str = rv.get_data(as_text=True)
        self.assertEqual(rv.status_code, 204)
        self.assertEqual(body_str, "")

        # (Reach directly into the application's persistence layer to)
        # Ensure that the targeted User resource has indeed been deleted.
        users = User.query.all()
        self.assertEqual(len(users), 0)

    def test_4_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to delete a User resource
        by providing an incorrect set of Basic Auth credentials.
        """

        # Create one User resource.
        self._create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Attempt to delete a User resource
        # by providing an incorrect set of Basic Auth credentials.
        basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/1", headers={"Authorization": authorization}
        )

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

        # (Reach directly into the application's persistence layer to)
        # Ensure that the User resource, which was targeted, did not get deleted.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        targeted_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(targeted_u, a) for a in ["id", "username", "email"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
            },
        )
        self.assertTrue(check_password_hash(targeted_u.password_hash, "123"))


class Test_6_IssueToken(TestBase):
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
        user_data_str = json.dumps(user_data)
        rv = self.client.post(
            "/api/users",
            data=user_data_str,
            headers={
                "Content-Type": "application/json",
            },
        )

        # Compute a valid token for the User resource, which was created just now.
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        user_id = body["id"]

        token_serializer = TimedJSONWebSignatureSerializer(
            TESTING_SECRET_KEY, expires_in=3600
        )
        token = token_serializer.dumps({"user_id": user_id}).decode("utf-8")
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
        self.assertEquals(
            body,
            {
                "error": "Unauthorized",
                "message": "Authentication in the Basic Auth format is required.",
            },
        )

    def test_2_issue_token(self):
        """
        Ensure that a(n access) token gets issued for the user,
        who is authenticated by the issued request's header.
        """

        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        basic_auth = "Basic " + b_a_c
        rv = self.client.post("/api/tokens", headers={"Authorization": basic_auth})

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(body, self._expected_body)

    def test_3_incorrect_basic_auth(self):
        """
        Ensure that it is impossible to issue a(n access) token
        by providing an incorrect set of Basic Auth credentials.
        """

        wrong_basic_auth_credentials = "john.doe@protonmail.com:wrong-password"
        wrong_b_a_c = base64.b64encode(
            wrong_basic_auth_credentials.encode("utf-8")
        ).decode("utf-8")
        wrong_authorization = "Authorization " + wrong_b_a_c
        rv = self.client.post(
            "/api/tokens",
            headers={"Authorization": wrong_authorization},
        )

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


class TestBaseForExampleResources(TestBase):
    def create_user(self, username, email, password):
        # Create one User resource.
        data_1 = {
            "username": username,
            "email": email,
            "password": password,
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/users",
            data=data_str_1,
            headers={"Content-Type": "application/json"},
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)

        # Issue an access token for the user, which was created just now.
        basic_auth_credentials = email + ":" + password
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        basic_auth = "Basic " + b_a_c
        rv_2 = self.client.post(
            "/api/tokens",
            headers={"Content-Type": "application/json", "Authorization": basic_auth},
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        token_auth = "Bearer " + body_2["token"]

        return body_1, token_auth


class Test_7_CreateExample(TestBaseForExampleResources):
    """Test the request responsible for creating a new Example resource."""

    def setUp(self):
        super().setUp()

        # Create one User resource.
        user_dict, self._token_auth = self.create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )

        # Prepare a JSON payload, which is required for creating an Example resource
        # associated with the above-created User resource.
        self._example_data = {
            "user_id": user_dict["id"],
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        self._example_data_str = json.dumps(self._example_data)

    def test_1_missing_token_auth(self):
        """
        Ensure that it is impossible to create an Example resource
        without providing a Bearer-Token Auth credential.
        """

        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
        )

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
        Ensure that it is impossible to create an Example resource
        without providing a 'Content-Type: application/json' header.
        """

        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={"Authorization": self._token_auth},
        )

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
        Ensure that it is impossible to create an Example resource
        without providing a value for each required field/key in the request body.
        """

        for field in ("new_word", "content"):
            # Attempt to create an Example resource
            # without providing a value for `field` in the request body.
            data_dict = {k: v for k, v in self._example_data.items() if k != field}
            data_str = json.dumps(data_dict)
            rv = self.client.post(
                "/api/examples",
                data=data_str,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": self._token_auth,
                },
            )

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
            # Ensure that no Example resources have been created.
            examples = Example.query.all()
            self.assertEqual(len(examples), 0)

    def test_4_create_example(self):
        """
        Ensure that the user, who is authenticated by the issued request's header,
        is able to edit create an Example resource.
        """

        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._token_auth,
            },
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 201)
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
        # Ensure that an Example resource has been created successfully.
        examples = Example.query.all()
        self.assertEqual(len(examples), 1)
        self.assertEqual(examples[0].user_id, 1)

    def test_5_incorrect_token_auth(self):
        """
        Ensure that it is impossible to create a new Example resource
        by providing an incorrect Bearer-Token Auth credential.
        """

        wrong_authorization = self._token_auth + "-wrong"
        rv = self.client.post(
            "/api/examples",
            data=self._example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": wrong_authorization,
            },
        )

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


class Test_8_GetExamples(TestBaseForExampleResources):
    """
    Test the request responsible for getting all Example resources,
    which are associated with a given User resource.
    """

    def setUp(self):
        super().setUp()

        # Create one User resource.
        user_dict, self._token_auth = self.create_user(
            username="jd", email="john.doe@protonmail.com", password="123"
        )
        self._user_id = user_dict["id"]

    def test_1_no_examples_exist(self):
        """
        Given a user who doesn't have any Example resources of her own,
        ensure that, when that user requests all resources,
        she doesn't get any.
        """

        rv = self.client.get(
            "/api/examples", headers={"Authorization": self._token_auth}
        )

        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(body, {"examples": []})

    def test_2_some_examples_exist(self):
        """
        Given a user who has nonzero Example resources of her own,
        ensure that, when that user requests all resources,
        she gets all of her own resources.
        """

        # Create one Example resource.
        example_data = {
            "user_id": self._user_id,
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        example_data_str = json.dumps(example_data)
        rv_1 = self.client.post(
            "/api/examples",
            data=example_data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._token_auth,
            },
        )

        # Get all Example resources that are associated with the only existing user.
        rv_2 = self.client.get(
            "/api/examples", headers={"Authorization": self._token_auth}
        )

        body_2_str = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_2_str)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2,
            {
                "examples": [
                    {
                        "id": 1,
                        "source_language": "Finnish",
                        "new_word": "osallistua [+ MIHIN]",
                        "content": "Kuka haluaa osallistua kilpailuun?",
                        "content_translation": "Who wants to participate in the competition?",
                    }
                ]
            },
        )

    def test_3_access_only_own_examples(self):
        """
        Ensure that each user can get all of her own Example resources,
        but cannot get any of the Example resources that belong to another user.
        """

        # Create a second User resource.
        user_dict_2, token_auth_2 = self.create_user(
            username="ms", email="mary.smith@yahoo.com", password="456"
        )

        # Create one Example resource for the first user.
        data_1 = {
            "user_id": self._user_id,
            "source_language": "Finnish",
            "new_word": "osallistua [+ MIHIN]",
            "content": "Kuka haluaa osallistua kilpailuun?",
            "content_translation": "Who wants to participate in the competition?",
        }
        data_str_1 = json.dumps(data_1)
        rv_1 = self.client.post(
            "/api/examples",
            data=data_str_1,
            headers={
                "Content-Type": "application/json",
                "Authorization": self._token_auth,
            },
        )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        example_id_1 = body_1["id"]

        # Create one Example resource for the second user.
        data_2 = {
            "user_id": user_dict_2["id"],
            "source_language": "Finnish",
            "new_word": "kieli",
            "content": "Mitä kieltä sinä puhut?",
            "content_translation": "What languages do you speak?",
        }
        data_str_2 = json.dumps(data_2)
        rv_2 = self.client.post(
            "/api/examples",
            data=data_str_2,
            headers={"Content-Type": "application/json", "Authorization": token_auth_2},
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        example_id_2 = body_2["id"]

        # Ensure that the 2nd user can get all of her own Example resources,
        # but cannot get any of the Example resources that belong to another user.
        rv_3 = self.client.get("/api/examples", headers={"Authorization": token_auth_2})

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 200)
        example_ids_of_user_2 = {e["id"] for e in body_3["examples"]}
        self.assertEqual(
            example_ids_of_user_2,
            {2},
        )
        self.assertEqual(
            {1}.intersection(example_ids_of_user_2),
            set(),
        )