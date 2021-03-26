import unittest
import json
import base64
import os


os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite://"


from backend.vocab_treasury import app, db, User


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

    def test_1_require_content_type(self):
        """
        Ensure that it is impossible to create a User resource
        without providing a 'Content-Type: application/json' header.

        # TODO: consider renaming this method to test_1_missing_content_type
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

        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 0)

    def test_2_create_user(self):
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

        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )

    def test_3_prevent_duplication_of_emails(self):
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

        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )


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
        self.assertEqual(body, {})

        # fmt: off
        # TODO: remove this
        '''
        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 0)
        '''
        # fmt: on

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
                "1": {
                    "id": 1,
                    "username": "jd",
                }
            },
        )

        # fmt: off
        #
        # TODO: remove this
        '''
        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = users[0]
        self.assertEqual(
            {a: getattr(user, a) for a in ['id', 'username', 'email', 'password']},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )
        '''
        # fmt: on


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
        self.data = {"username": "JD", "email": "JOHN.DOE@GMAIL.COM", "password": "!@#"}
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

    def test_1_require_basic_auth(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing Basic Auth credentials.

        TODO: consider renaming this method to test_1_missing_basic_auth
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

        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )

    def test_2_require_content_type(self):
        """
        Ensure that it is impossible to edit a User resource
        without providing a 'Content-Type: application/json' header.

        # TODO: consider renaming this method to test_1_missing_content_type
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

        # Reach directly in the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        user = User.query.get(1)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )

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

        # Reach directly into the application's persistence layer.
        users = User.query.all()
        self.assertEqual(len(users), 2)
        user = User.query.get(2)
        self.assertEqual(
            {a: getattr(user, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@yahoo.com",
                "password": "456",
            },
        )

    # fmt: off
    #
    # TODO: the implementation of `edit_user()`
    #       allows only the authenticated user to edit only his/her corresponding
    #       User resource, which makes it pointless to test whether attempting to edit
    #       a non-existent User resource gets rejected by the backend application
    #
    #       so, remove this test altogether
    '''
    def test_4_nonexistent_user(self):
        """
        Ensure that
        attempting to edit a User resource that doesn't exist returns a 404.

        TODO: consider removing this test altogether, because:

            1) its description contradicts its actual status-code assertion

            2) it is somewhat pointless, since the implementation of `edit_user()`
               allows only the authenticated user to edit only his/her corresponding
               User resource
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Identify a non-existent User resource.
        nonexistent_user_id = 17

        user = User.query.get(nonexistent_user_id)
        self.assertIsNone(user)

        # Attempt to edit a User resource that doesn't exist.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_4 = self.client.put(
            f"/api/users/{nonexistent_user_id}",
            data=self.data_str,
            headers={
                "Content-Type": "application/json",
                "Authorization": authorization,
            },
        )

        body_str_4 = rv_4.get_data(as_text=True)
        body_4 = json.loads(body_str_4)
        self.assertEqual(rv_4.status_code, 403)
        self.assertEqual(
            body_4,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to edit any User resource different from your"
                    " own."
                ),
            },
        )
    '''
    # fmt: on

    def test_5_edit_the_authenticated_user(self):
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
        # Get the edited User resource.
        users = User.query.all()
        self.assertEqual(len(users), 1)
        edited_u = User.query.get(1)
        self.assertEqual(
            {a: getattr(edited_u, a) for a in ["id", "username", "email", "password"]},
            {
                "id": 1,
                "username": "JD",
                "email": "JOHN.DOE@GMAIL.COM",
                "password": "!@#",
            },
        )

        # fmt: off
        #
        # TODO: remove this
        '''
        # Get the edited User resource
        # (by having the test client issue an HTTP request).
        rv_6 = self.client.get("/api/users/1")

        body_str_6 = rv_6.get_data(as_text=True)
        body_6 = json.loads(body_str_6)
        self.assertEqual(rv_6.status_code, 200)
        self.assertEqual(body_6, {"id": 1, "username": "JD"})
        '''
        # fmt: on

    def test_6_prevent_duplication_of_emails(self):
        """
        Ensure that it is impossible to edit a User resource in such a way
        that two different User resources would end up having the same email.
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
            {
                a: getattr(targeted_u, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )

    def test_7_incorrect_basic_auth(self):
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
            {
                a: getattr(targeted_u, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )


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

    def test_1_require_basic_auth(self):
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
            {
                a: getattr(targeted_u, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )

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
            {
                a: getattr(targeted_u, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 2,
                "username": "ms",
                "email": "mary.smith@yahoo.com",
                "password": "456",
            },
        )

    # fmt: off
    #
    # TODO: the implementation of `delete_user()`
    #       allows only the authenticated user to delete only his/her corresponding
    #       User resource, which makes it pointless to test whether attempting to delete
    #       a non-existent User resource gets rejected by the backend application
    #
    #       so, remove this test altogether
    '''
    def test_3_nonexistent_user(self):
        """
        Ensure that
        attempting to delete a User resource that doesn't exist returns a 404.

        TODO: consider removing this test altogether, because:

            1) its description contradicts its actual status-code assertion

            2) it is somewhat pointless, since the implementation of `delete_user()`
               allows only the authenticated user to delete only his/her corresponding
               User resource
        """
        # Create one User resource.
        data = {
            "username": "jd",
            "email": "john.doe@protonmail.com",
            "password": "123",
        }
        data_str = json.dumps(data)

        rv = self.client.post(
            "/api/users",
            data=data_str,
            headers={"Content-Type": "application/json"},
        )

        # Attempt to delete a User resource that doesn't exist.
        basic_auth_credentials = "john.doe@protonmail.com:123"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c

        rv_3 = self.client.delete(
            "/api/users/17", headers={"Authorization": authorization}
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 403)
        self.assertEqual(
            body_3,
            {
                "error": "Forbidden",
                "message": (
                    "You are not allowed to delete any User resource different from"
                    " your own."
                ),
            },
        )
    '''
    # fmt: on

    def test_4_delete_the_authenticated_user(self):
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

    def test_5_incorrect_basic_auth(self):
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
        basic_auth_credentials = "mary.smith@yahoo.com:wrong-password"
        b_a_c = base64.b64encode(basic_auth_credentials.encode("utf-8")).decode("utf-8")
        authorization = "Basic " + b_a_c
        rv = self.client.delete(
            "/api/users/2", headers={"Authorization": authorization}
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
            {
                a: getattr(targeted_u, a)
                for a in ["id", "username", "email", "password"]
            },
            {
                "id": 1,
                "username": "jd",
                "email": "john.doe@protonmail.com",
                "password": "123",
            },
        )
