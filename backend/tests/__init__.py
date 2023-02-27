import unittest

from src import db, create_app


class TestBase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(name_of_configuration="testing")

        self.app_context = self.app.app_context()
        self.app_context.push()

        db.drop_all()  # just in case
        db.create_all()

        self.client = self.app.test_client()

    def tearDown(self):
        db.drop_all()

        self.app_context.pop()
