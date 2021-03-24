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
            # This code block:
            # (a) is not relevant or needed for testing the endpoint handler for POST
            #     requests to /api/users,
            # (b) belongs to a set of training wheels for understanding what the
            #     `patch.dict` context manager, which is used a few lines above,
            #     actually does.
            expected_value_of_users_mock = {
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
            }
            self.assertEqual(users_mock, expected_value_of_users_mock)
            self.assertEqual(users, expected_value_of_users_mock)

            rv = self.client.post(
                "/api/users",
                data=data_str,
                headers={"Content-Type": "application/json"},
            )

            # This code block:
            # (a) is not relevant or needed for testing the endpoint handler for POST
            #     requests to /api/users,
            # (b) belongs to a set of training wheels for understanding what the
            #     `patch.dict` context manager, which is used a few lines above,
            #     actually does.
            expected_value_of_users_mock.update(
                {
                    "18": {
                        "id": "18",
                        "username": "fl",
                        "email": "first.last@protonmail.com",
                        "password": "789",
                    }
                }
            )
            self.assertEqual(users_mock, expected_value_of_users_mock)
            self.assertEqual(users, expected_value_of_users_mock)

            rv_2 = self.client.get("/api/users")
            body_str_2 = rv_2.get_data(as_text=True)
            body_2 = json.loads(body_str_2)
            self.assertEqual(rv_2.status_code, 200)
            self.assertEqual(body_2, expected_value_of_users_mock)

        body_str = rv.get_data(as_text=True)
        self.assertEqual(rv.status_code, 201)

        rv = self.client.get("/api/users")
        body_str = rv.get_data(as_text=True)
        body = json.loads(body_str)
        self.assertEqual(body, users)
