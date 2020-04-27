from flask import (Blueprint,
                   flash, redirect, url_for, render_template, abort, request)
from flask_login import login_required, current_user

from vocab_treasury import db
from vocab_treasury.models import Example
from vocab_treasury.examples.forms import ExampleForm


examples = Blueprint('examples', __name__)


@examples.route('/example/new', methods=['GET', 'POST'])
@login_required
def new_example():
    form = ExampleForm()
    if form.validate_on_submit():
        kw = {'author': current_user,
              'new_word': form.new_word.data, 'content': form.content.data,
              'content_translation': form.content_translation.data}
        if form.source_language.data:
            kw['source_language'] = form.source_language.data
        example = Example(**kw)
        db.session.add(example)
        db.session.commit()
        flash('YOUR NEW EXAMPLE HAS BEEN RECORDED!')
        return redirect(url_for('main.home'))
    return render_template('record_example.html',
                           title='NEW EXAMPLE', form=form, legend='[legend-tag]: CREATE NEW EXAMPLE')


@examples.route('/example/<int:example_id>')
@login_required
def example(example_id):
    e = Example.query.get_or_404(example_id)  # alternatively: `example = Example.query.get(example_id) or first`
    if e.author != current_user:
        abort(403)  # HTTP response for a forbidden route

    return render_template('example.html', title=e.new_word, example=e)


@examples.route('/example/<int:example_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_example(example_id):
    example = Example.query.get_or_404(example_id)
    if example.author != current_user:
        abort(403)

    form = ExampleForm()
    if form.validate_on_submit():
        example.source_language = form.source_language.data
        example.new_word = form.new_word.data
        example.content = form.content.data
        example.content_translation = form.content_translation.data
        db.session.commit()
        flash('YOUR EXAMPLE HAS BEEN EDITED!', category='success')
        return redirect(url_for('examples.example', example_id=example_id))
    elif request.method == 'GET':
        form.source_language.data = example.source_language
        form.new_word.data = example.new_word
        form.content.data = example.content
        form.content_translation.data = example.content_translation
        return render_template('record_example.html',
                               title='EDIT EXAMPLE', form=form, legend='[legend-tag]: EDIT EXISTING EXAMPLE')


@examples.route('/example/<int:example_id>/delete', methods=['POST'])
@login_required
def delete_example(example_id):
    e = Example.query.get_or_404(example_id)
    if e.author != current_user:
        abort(403)

    db.session.delete(e)
    db.session.commit()
    flash(f'YOUR EXAMPLE "{e.content}" HAS BEEN DELETED!', category='success')
    return redirect(url_for('users.own_vocabtreasury'))
