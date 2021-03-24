import unittest
import json
from unittest.mock import patch


from backend.vocab_treasury import app, users


class TestApp(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_get_users(self):
        rv = self.client.get("/api/users")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "1": {
                    "id": "1",
                    "username": "jd",
                    "email": "john.doe@gmail.com",
                    "password": "123",
                },
                "2": {
                    "id": "2",
                    "username": "ms",
                    "email": "mary.smith@yahoo.com",
                    "password": "456",
                },
            },
        )

    def test_get_user(self):
        rv = self.client.get("/api/users/1")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(
            body,
            {
                "id": "1",
                "username": "jd",
                "email": "john.doe@gmail.com",
                "password": "123",
            },
        )

    def test_create_user(self):
        data = {
            "username": "fl",
            "email": "first.last@protonmail.com",
            "password": "789",
        }
        data_str = json.dumps(data)

        # Attempt to create a User resource without providing a
        # 'Content-Type: application/json' header.
        rv = self.client.post("api/users", data=data_str)

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

        # Create a User resource.
        mock_of_extra_user = {
            "17": {
                "id": "17",
                "username": "eu",
                "email": "extra.user@mock.com",
                "password": "10,11,12",
            },
        }
        with patch.dict(
            "backend.vocab_treasury.users", values=mock_of_extra_user
        ) as users_mock:
            rv_1 = self.client.post(
                "/api/users",
                data=data_str,
                headers={"Content-Type": "application/json"},
            )
            rv_2 = self.client.get("/api/users")

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        self.assertEqual(rv_1.status_code, 201)
        self.assertEqual(
            body_1,
            {
                "id": "18",
                "username": "fl",
                "email": "first.last@protonmail.com",
                "password": "789",
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 200)
        self.assertEqual(
            body_2,
            {
                "1": {
                    "id": "1",
                    "username": "jd",
                    "email": "john.doe@gmail.com",
                    "password": "123",
                },
                "2": {
                    "id": "2",
                    "username": "ms",
                    "email": "mary.smith@yahoo.com",
                    "password": "456",
                },
                "17": {
                    "id": "17",
                    "username": "eu",
                    "email": "extra.user@mock.com",
                    "password": "10,11,12",
                },
                "18": {
                    "id": "18",
                    "username": "fl",
                    "email": "first.last@protonmail.com",
                    "password": "789",
                },
            },
        )

        rv_3 = self.client.get("/api/users")
        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(
            body_3,
            {
                "1": {
                    "id": "1",
                    "username": "jd",
                    "email": "john.doe@gmail.com",
                    "password": "123",
                },
                "2": {
                    "id": "2",
                    "username": "ms",
                    "email": "mary.smith@yahoo.com",
                    "password": "456",
                },
            },
        )

    def test_edit_user(self):
        data = {"username": "JD", "email": "JOHN.DOE@GMAIL.COM", "password": "!@#"}
        data_str = json.dumps(data)

        with patch.dict("backend.vocab_treasury.users") as users_mock:
            # Attempt to edit a User resource without providing a
            # 'Content-Type: application/json' header.
            rv_1 = self.client.put("/api/users/1", data=data_str)

            # Attempt to edit a User resource that doesn't exist.
            rv_2 = self.client.put(
                "/api/users/17",
                data=data_str,
                headers={"Content-Type": "application/json"},
            )

            # Edit a User resource.
            rv_3 = self.client.put(
                "/api/users/1",
                data=data_str,
                headers={"Content-Type": "application/json"},
            )

        body_str_1 = rv_1.get_data(as_text=True)
        body_1 = json.loads(body_str_1)
        self.assertEqual(rv_1.status_code, 400)
        self.assertEqual(
            body_1,
            {
                "error": "Bad Request",
                "message": 'Your request did not include a "Content-Type: application/json" header.',
            },
        )

        body_str_2 = rv_2.get_data(as_text=True)
        body_2 = json.loads(body_str_2)
        self.assertEqual(rv_2.status_code, 404)
        self.assertEqual(
            body_2,
            {
                "error": "Not Found",
                "message": "There doesn't exist a User resource with an id of 17",
            },
        )

        body_str_3 = rv_3.get_data(as_text=True)
        body_3 = json.loads(body_str_3)
        self.assertEqual(rv_3.status_code, 200)
        self.assertEqual(
            body_3,
            {
                "id": "1",
                "username": "JD",
                "email": "JOHN.DOE@GMAIL.COM",
                "password": "!@#",
            },
        )
