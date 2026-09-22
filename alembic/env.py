from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool

from database import engine, Base

import models
import auth_models


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ------------------------------------------------------------
# SQLAlchemy metadata
# ------------------------------------------------------------

target_metadata = Base.metadata


# ------------------------------------------------------------
# Protect existing database tables that are not represented
# by the SQLAlchemy metadata.
#
# Alembic must NOT interpret those tables as deleted.
# ------------------------------------------------------------

def include_object(
    object,
    name,
    type_,
    reflected,
    compare_to,
):
    if type_ == "table" and reflected and compare_to is None:
        return False

    return True


# ------------------------------------------------------------
# Offline migrations
# ------------------------------------------------------------

def run_migrations_offline():

    context.configure(
        url=str(engine.url),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


# ------------------------------------------------------------
# Online migrations
# ------------------------------------------------------------

def run_migrations_online():

    with engine.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


# ------------------------------------------------------------
# Entry point
# ------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
