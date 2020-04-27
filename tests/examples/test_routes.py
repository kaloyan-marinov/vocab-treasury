import unittest

from flask_login import current_user
from markupsafe import escape

from vocab_treasury import create_app
from vocab_treasury.models import db, Example
from vocab_treasury.utils import random_string


class FlaskTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        # according to https://www.patricksoftwareblog.com/testing-a-flask-application-using-pytest/ ,
        # "This parameter must be disabled for the tests to run"
        # (see also https://www.reddit.com/r/learnpython/comments/5d94gn/flask_unittest_form_submission_select_field/)
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.tester = self.app.test_client(self)

    def test_example_1(self):
        """Ensure that the example route requires a log-in."""
        example_id = 134
        response = self.tester.get(f'/example/{example_id}',
                                   follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'Please log in to access this page.', response.data)

        # implement the pattern in (https://flask.palletsprojects.com/en/1.1.x/tutorial/tests/ >> `tests/test_auth.py`)
        rv = self.tester.get(f'/example/{example_id}')
        u = 'http://localhost/login/?next=' + escape(f'/example/{example_id}')
        self.assertTrue(u, rv.headers['Location'])

    def test_example_2(self):
        """Ensure that, after a successful log-in, the user can view a specific example in his/her own VocabTreasury."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        example_id = 134
        response = self.tester.get(f'/example/{example_id}',
                                   follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'You have selected the following Example from your Own VocabTreasury:', response.data)
        self.assertIn(b'Lautasella on spagettia.', response.data)

    def test_example_3(self):
        """Ensure that, after a successful log-in, the user can't view an example from another user's VocabTreasury."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        example_id = 1
        response = self.tester.get(f'/example/{example_id}',
                                   follow_redirects=True)
        self.assertEqual(403, response.status_code)

    def test_new_example_1(self):
        """Ensure that the route for recording a new example requires a log-in."""
        response = self.tester.get('/example/new',
                                   follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'Please log in to access this page.', response.data)

    def test_new_example_2(self):
        """Ensure that, after a successful log-in, the user can record a new example."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)

        source_language = 'test_' + random_string(10)
        payload = {'author': current_user,
                   'source_language': source_language,
                   'new_word': random_string(10),
                   'content': random_string(10),
                   'content_translation': random_string(10)}
        response = self.tester.post('/example/new',
                                    data=payload,
                                    follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'YOUR NEW EXAMPLE HAS BEEN RECORDED!', response.data)

        with self.app.app_context():
            Example.query.filter_by(source_language=source_language).delete()
            db.session.commit()

    def test_delete_example_1(self):
        """Ensure that the route for deleting an example requires a log-in."""
        test_user_id = 3
        with self.app.app_context():
            e = Example.query.filter_by(user_id=test_user_id).order_by(Example.id).all()[-1]
            print(e.content)
        response = self.tester.post(f'/example/{e.id}/delete')
        # I have find out why the response status-code is what it is
        # instead of something in the 400s, which is what I would expect it to be
        self.assertEqual(302, response.status_code)

    def test_delete_example_2(self):
        """Ensure that, after a successful log-in, the user cannot delete examples belonging to another user."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        another_test_user_id = 2
        with self.app.app_context():
            last_e = Example.query.filter_by(user_id=another_test_user_id).order_by(Example.id).all()[-1]

        response = self.tester.post(f'/example/{last_e.id}/delete')
        self.assertEqual(403, response.status_code)

    def test_delete_example_3(self):
        """Ensure that, after a successful log-in, the user can delete examples in his/her own VocabTreasury."""
        test_user_id = 3
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)

        # record a new example
        source_language = 'test_' + random_string(10)
        example_payload = {'user_id': test_user_id,
                           'source_language': source_language,
                           'new_word': 'lautanen',
                           'content': 'Lautasella on spagettia.',
                           'content_translation': 'There is pasta on the plate.'}
        with self.app.app_context():
            e = Example(**example_payload)
            db.session.add(e)
            db.session.commit()
            added_e = Example.query.filter_by(user_id=test_user_id).order_by(Example.id).all()[-1]

        response = self.tester.post(f'/example/{added_e.id}/delete',
                                    follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(escape(f'YOUR EXAMPLE "{added_e.content}" HAS BEEN DELETED!'),
                      response.get_data(as_text=True))

    def test_edit_example_1(self):
        """Ensure that the route for editing a recorded example requires a log-in."""
        example_id = 134
        response = self.tester.post(f'/example/{example_id}/edit',
                                    follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'Please log in to access this page.', response.data)

    def test_edit_example_2(self):
        """Ensure that, after a successful log-in, the user cannot edit examples belonging to another user."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        another_test_user_id = 2
        with self.app.app_context():
            e = Example.query.filter_by(user_id=another_test_user_id).order_by(Example.id).all()[-1]

        response = self.tester.get(f'/example/{e.id}/edit',
                                   follow_redirects=True)
        self.assertEqual(403, response.status_code)

    def test_edit_example_3(self):
        """Ensure that, after a successful log-in,
        the user can access the page for editing an example in his/her own VocabTreasury.
        """
        test_user_id = 3
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'})
        with self.app.app_context():
            e = Example.query.filter_by(user_id=test_user_id).first()
        response = self.tester.get(f'/example/{e.id}/edit',
                                   follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'EDIT EXISTING EXAMPLE', response.data)

    def test_edit_example_4(self):
        """
        Ensure that, after a successful log-in, the user can edit an example in his/her own VocabTreasury.
        """
        test_user_id = 3
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)

        # record a new example
        example_payload = {'user_id': test_user_id,
                           'source_language': 'test_Finnish',
                           'new_word': 'lautanen',
                           'content': 'Lautasella on spagettia.',
                           'content_translation': 'There is pasta on the plate.'}
        with self.app.app_context():
            e = Example(**example_payload)
            db.session.add(e)
            db.session.commit()
            e = Example.query.filter_by(user_id=test_user_id).order_by(Example.id).all()[-1]

        # edit the example
        update_payload = {k: '[updated] ' + v for k, v in example_payload.items() if isinstance(v, str)}
        update_payload['user_id'] = test_user_id
        response = self.tester.post(f'/example/{e.id}/edit',
                                    data=update_payload,
                                    follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'YOUR EXAMPLE HAS BEEN EDITED!', response.data)

        # remove the example
        with self.app.app_context():
            Example.query.filter_by(id=e.id).delete()
            db.session.commit()
