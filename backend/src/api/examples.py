from flask import request, jsonify, url_for, current_app

from src import db
from src.models import Example
from src.auth import token_auth
from src.api import api_bp


@api_bp.route("/examples", methods=["POST"])
@token_auth.login_required
def create_example():
    if request.headers["Content-Type"] != "application/json":
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    'Your request set the "Content-Type" header'
                    ' to a value different from "application/json".'
                ),
            }
        )
        r.status_code = 400
        return r

    source_language = request.json.get("source_language")
    new_word = request.json.get("new_word")
    content = request.json.get("content")
    content_translation = request.json.get("content_translation")

    for field, value in (
        ("new_word", new_word),
        ("content", content),
    ):
        if value is None or value == "":
            r = jsonify(
                {
                    "error": "Bad Request",
                    "message": (
                        f"Your request body did not specify a value for '{field}'"
                    ),
                }
            )
            r.status_code = 400
            return r

    e = Example(
        user_id=token_auth.current_user().id,
        source_language=source_language,
        new_word=new_word,
        content=content,
        content_translation=content_translation,
    )
    db.session.add(e)
    db.session.commit()

    e_dict = e.to_dict()
    r = jsonify(e_dict)
    r.status_code = 201
    r.headers["Location"] = url_for("api_blueprint.get_example", example_id=e.id)
    return r


@api_bp.route("/examples", methods=["GET"])
@token_auth.login_required
def get_examples():
    """
    If the client wants to specify:
    - how many resources it wants at a time,
      it can incorporate `per_page` into its request;
    - which page of the paginated query results it wants,
      it can incorporate `page` into its request.

    Importantly, this function enforces that
    the "page size" (= the value of `per_page`) never be larger than 100,
    with the reason for this restriction being
    that we do not want to task the server too much.
    """
    examples_query = Example.query.filter_by(user_id=token_auth.current_user().id)
    query_param_kwargs = {}
    new_word = request.args.get("new_word")
    if new_word:
        examples_query = examples_query.filter(
            Example.new_word.like("%" + new_word + "%")
        )
        query_param_kwargs["new_word"] = new_word
    content = request.args.get("content")
    if content:
        examples_query = examples_query.filter(
            Example.content.like("%" + content + "%")
        )
        query_param_kwargs["content"] = content
    content_translation = request.args.get("content_translation")
    if content_translation:
        examples_query = examples_query.filter(
            Example.content_translation.like("%" + content_translation + "%")
        )
        query_param_kwargs["content_translation"] = content_translation

    examples_query = examples_query.order_by(Example.id.desc())

    per_page = min(
        100,
        request.args.get("per_page", default=10, type=int),
    )
    page = request.args.get("page", default=1, type=int)
    examples_collection = Example.to_collection_dict(
        examples_query,
        per_page,
        page,
        "api_blueprint.get_examples",
        **query_param_kwargs,
    )
    return examples_collection


@api_bp.route("/examples/<int:example_id>", methods=["GET"])
@token_auth.login_required
def get_example(example_id):
    example = Example.query.get(example_id)
    if example is None or example.user_id != token_auth.current_user().id:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id)
                ),
            }
        )
        r.status_code = 404
        return r
    return example.to_dict()


@api_bp.route("/examples/<int:example_id>", methods=["PUT"])
@token_auth.login_required
def edit_example(example_id):
    if request.headers["Content-Type"] != "application/json":
        r = jsonify(
            {
                "error": "Bad Request",
                "message": (
                    'Your request set the "Content-Type" header'
                    ' to a value different from "application/json".'
                ),
            }
        )
        r.status_code = 400
        return r

    example = Example.query.get(example_id)
    if example is None or example.user_id != token_auth.current_user().id:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id)
                ),
            }
        )
        r.status_code = 404
        return r

    source_language = request.json.get("source_language")
    new_word = request.json.get("new_word")
    content = request.json.get("content")
    content_translation = request.json.get("content_translation")

    if source_language is not None:
        example.source_language = source_language
    if new_word is not None:
        example.new_word = new_word
    if content is not None:
        example.content = content
    if content_translation is not None:
        example.content_translation = content_translation

    db.session.add(example)
    db.session.commit()

    return example.to_dict()


@api_bp.route("/examples/<int:example_id>", methods=["DELETE"])
@token_auth.login_required
def delete_example(example_id):
    example = Example.query.get(example_id)
    if example is None or example.user_id != token_auth.current_user().id:
        r = jsonify(
            {
                "error": "Not Found",
                "message": (
                    "Your User doesn't have an Example resource with an ID of "
                    + str(example_id)
                ),
            }
        )
        r.status_code = 404
        return r

    db.session.delete(example)
    db.session.commit()

    return "", 204
