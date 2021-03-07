from vocab_treasury import db, bcrypt, create_app
from vocab_treasury.models import User, Example


def main():
    app = create_app()

    with app.app_context():
        db.create_all()

        # '''
        plaintext_password_1 = 'testing'
        password_hash_1 = bcrypt.generate_password_hash(plaintext_password_1).decode(
            'utf-8'
        )
        u_1 = User(
            username='du',
            email='DeployedUser@test.com',
            password=password_hash_1
        )
        db.session.add(u_1)
        db.session.commit()

        plaintext_password_2 = 'a'
        password_hash_2 = bcrypt.generate_password_hash(plaintext_password_2).decode(
            'utf-8'
        )
        u_2 = User(
            username='jd',
            email='john.doe@gmail.com',
            password=password_hash_2
        )

        plaintext_password_3 = 'b'
        password_hash_3 = bcrypt.generate_password_hash(plaintext_password_3).decode(
            'utf-8'
        )
        u_3 = User(
            username='ms',
            email='mary.smith@yahoo.com',
            password=password_hash_3
        )
        
        db.session.add(u_2)
        db.session.add(u_3)
        db.session.commit()
        # '''

        u_2_example_1 = Example(
            new_word='lautanen',
            content='Lautasella on spagettia.',
            content_translation='There is pasta on the plate.',
            user_id=u_2.id
        )
        db.session.add(u_2_example_1)

        u_1_examples = (
            {'source_language': 'l-1', 'new_word': 'ABC', 'content': 'PQR', 'content_translation': 'XYZ'},
            {'source_language': 'l-2', 'new_word': 'ABC', 'content': 'XYZ', 'content_translation': 'PQR'},
            {'source_language': 'l-3', 'new_word': 'PQR', 'content': 'ABC', 'content_translation': 'XYZ'},
            {'source_language': 'l-4', 'new_word': 'PQR', 'content': 'XYZ', 'content_translation': 'ABC'},
            {'source_language': 'l-5', 'new_word': 'XYZ', 'content': 'ABC', 'content_translation': 'PQR'},
            {'source_language': 'l-6', 'new_word': 'XYZ', 'content': 'PQR', 'content_translation': 'ABC'},
        )
        for i, e_i in enumerate(u_1_examples):
            kwargs_i = {k: v for k, v in e_i.items()}
            kwargs_i['user_id'] = u_1.id
            u_1_example_i = Example(**kwargs_i)
            db.session.add(u_1_example_i)

        u_2_example_2 = Example(
            source_language='German',
            new_word='sich (A) zurechtfinden',
            content='Ich finde mich gar nicht mehr zurecht...',
            content_translation="I can't manage anymore.",
            user_id=u_2.id
        )
        db.session.add(u_2_example_2)
        
        db.session.commit()


if __name__ == '__main__':
    main()
