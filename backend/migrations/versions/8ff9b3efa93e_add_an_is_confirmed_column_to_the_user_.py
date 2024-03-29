"""add an is_confirmed column to the user table

Revision ID: 8ff9b3efa93e
Revises: 1107175adc5b
Create Date: 2023-03-05 12:32:46.871654

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8ff9b3efa93e'
down_revision = '1107175adc5b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('is_confirmed', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user', 'is_confirmed')
    # ### end Alembic commands ###
