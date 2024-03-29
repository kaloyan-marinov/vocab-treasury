import datetime

from flask import url_for

from src import db


class PaginatedAPIMixin(object):
    """
    This is a "mixin" class, which implements generic functionality for
    generating a representation for a collection of resources.
    """

    @staticmethod
    def to_collection_dict(query, per_page, page, endpoint, **kwargs):
        pagination_obj = query.paginate(page=page, per_page=per_page, error_out=False)

        link_to_self = url_for(endpoint, per_page=per_page, page=page, **kwargs)
        link_to_next = (
            url_for(endpoint, per_page=per_page, page=page + 1, **kwargs)
            if pagination_obj.has_next
            else None
        )
        link_to_prev = (
            url_for(endpoint, per_page=per_page, page=page - 1, **kwargs)
            if pagination_obj.has_prev
            else None
        )
        link_to_first = url_for(endpoint, per_page=per_page, page=1, **kwargs)
        link_to_last = (
            url_for(endpoint, per_page=per_page, page=pagination_obj.pages, **kwargs)
            if pagination_obj.pages > 0
            else None
        )

        resource_representations = {
            "items": [resource.to_dict() for resource in pagination_obj.items],
            "_meta": {
                "total_items": pagination_obj.total,
                "per_page": per_page,
                "total_pages": pagination_obj.pages,
                "page": page,
            },
            "_links": {
                "self": link_to_self,
                "next": link_to_next,
                "prev": link_to_prev,
                "first": link_to_first,
                "last": link_to_last,
            },
        }
        return resource_representations


class User(PaginatedAPIMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(32), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_confirmed = db.Column(db.Boolean)

    examples = db.relationship(
        "Example",
        lazy="dynamic",
        backref="user",
    )
    email_address_changes = db.relationship(
        "EmailAddressChange",
        lazy="dynamic",
        backref="user",
    )

    def to_dict(self):
        """Export `self` to a dict, which omits any and all sensitive information."""
        return {"id": self.id, "username": self.username}

    def __repr__(self):
        return f"User({self.id}, {self.username})"


class Example(PaginatedAPIMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Note that the next statement passes a function - not its invocation! -
    # to the `default` keyword argument.
    # Also, you always want to use UTC
    # when saving date+time to a DB (so they're consistent).
    created = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    # Note that the string within the next statement uses a lower-case "u".
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    source_language = db.Column(db.String(32), default="Finnish")
    new_word = db.Column(db.String(128), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_translation = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "source_language": self.source_language,
            "new_word": self.new_word,
            "content": self.content,
            "content_translation": self.content_translation,
        }

    def __repr__(self):
        return f"Example({self.id}, {self.new_word})"


class EmailAddressChange(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False,
    )

    # old_email
    old = db.Column(db.String(128), nullable=False)
    # new_email
    new = db.Column(db.String(128), nullable=False)

    created = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
    )

    def __repr__(self):
        return f"EmailAddressChange({self.id})"
