import unittest


from vocab_treasury import create_app


class FlaskTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        # according to https://www.patricksoftwareblog.com/testing-a-flask-application-using-pytest/ ,
        # "This parameter must be disabled for the tests to run"
        # (see also https://www.reddit.com/r/learnpython/comments/5d94gn/flask_unittest_form_submission_select_field/)
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.tester = self.app.test_client(self)

    def test_login_1(self):
        """Ensure that login behaves correctly with the correct credentials."""
        response = self.tester.post('/login',
                                    data={'email': 'DeployedUser@test.com',
                                          'password': 'testing'},
                                    follow_redirects=True)
        self.assertIn(b'YOU HAVE JUST LOGGED IN.', response.data)

    def test_login_2(self):
        """Ensure that login behaves correctly with incorrect credentials."""
        response = self.tester.post('/login',
                                    data={'email': 'DeployedUser@test.com',
                                          'password': 'this is a wrong password on purpose'},
                                    follow_redirects=True)
        self.assertIn(b'LOGIN UNSUCCESSFUL. PLEASE CHECK YOUR EMAIL AND PASSWORD.', response.data)

    def test_logout(self):
        """Ensure that logout behaves correctly."""
        # note that adding `@login_required` to the tested route's handler makes the commented-out block below necessary
        '''
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        '''
        response = self.tester.get('/logout',
                                   content_type='html/text',
                                   follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'YOU HAVE SUCCESSFULLY LOGGED OUT.', response.data)

    def test_own_vocabtreasury_1(self):
        """Ensure that the own-vocabtreasury route requires a log-in."""
        response = self.tester.get('/own-vocabtreasury',
                                   follow_redirects=True)
        # I have yet to find out why the checked-for text appears when using Firefox's "Inspect Element"
        # but not when using Firefox's "View Page Source"
        self.assertIn(b'Please log in to access this page.', response.data)

    def test_own_vocabtreasury_2(self):
        """Ensure that, after a successful log-in, the user's existing examples are displayed."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        response = self.tester.get('/own-vocabtreasury')
        self.assertEqual(200, response.status_code)
        self.assertIn('Pyydän anteeksi, en aikonut häiritä.', response.data.decode('utf-8'))

    def test_search_query_1(self):
        """Ensure that the search functionality requires a log-in."""
        with self.subTest('make a GET request'):
            response = self.tester.get('/own-vocabtreasury/search',
                                       follow_redirects=True)
            self.assertIn(b'Please log in to access this page.', response.data)

        with self.subTest('make a POST request'):
            response = self.tester.post('/own-vocabtreasury/search',
                                        data={'search': 'pasta on the plate'},
                                        follow_redirects=True)
            self.assertIn(b'Please log in to access this page.', response.data)

    def test_search_query_2(self):
        """Ensure that, after a successful log-in, the user can access the search functionality."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        response = self.tester.get('/own-vocabtreasury/search')
        self.assertEqual(200, response.status_code)
        self.assertIn(b'SEARCH IN "TRANSLATION" FOR:', response.data)

    def test_search_query_3(self):
        """Ensure that, after a successful log-in, the user can use the search functionality."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        response = self.tester.post('/own-vocabtreasury/search',
                                    data={'search': 'pasta on the plate'},
                                    follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'Lautasella on spagettia.', response.data)

    def test_search_results_1(self):
        """Ensure that viewing search results and running a new query require a log-in."""
        query = 'pasta on the plate'
        with self.subTest('make a GET request'):
            response = self.tester.get(f'/own-vocabtreasury/search/{query}',
                                       follow_redirects=True)
            self.assertIn(b'Please log in to access this page.', response.data)

        with self.subTest('make a POST request'):
            response = self.tester.post(f'/own-vocabtreasury/search/{query}',
                                        data={'search': 'excuse me'},
                                        follow_redirects=True)
            self.assertIn(b'Please log in to access this page.', response.data)

    def test_search_results_2(self):
        """Ensure that, after a successful log-in, the user can view search results."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        response = self.tester.get('/own-vocabtreasury/search/pasta on the plate',
                                   follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn(b'Lautasella on spagettia.', response.data)

    def test_search_results_3(self):
        """Ensure that, after a successful log-in, the user can use the search functionality
        from the results of a previous search."""
        __ = self.tester.post('/login',
                              data={'email': 'DeployedUser@test.com',
                                    'password': 'testing'},
                              follow_redirects=True)
        response = self.tester.post('/own-vocabtreasury/search/pasta on the plate',
                                    data={'search': 'excuse me'},
                                    follow_redirects=True)
        self.assertEqual(200, response.status_code)
        self.assertIn('Pyydän anteeksi, en aikonut häiritä.', response.data.decode('utf-8'))
