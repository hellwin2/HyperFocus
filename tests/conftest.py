from datetime import datetime, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import get_session
from app.models import User
from app.core.security import get_password_hash, create_access_token

# Base de datos de test en memoria
TEST_DATABASE_URL = "sqlite://"

engine_test = create_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@pytest.fixture(name="db_session")
def db_session_fixture():
    SQLModel.metadata.create_all(engine_test)
    with Session(engine_test) as session:
        yield session
    SQLModel.metadata.drop_all(engine_test)

@pytest.fixture(name="sample_user")
def sample_user_fixture(db_session: Session) -> User:
    user = User(
        name="Test User",
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(name="client")
def client_fixture(db_session: Session):
    def override_get_session():
        return db_session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(name="user_token_headers")
def user_token_headers_fixture(sample_user: User) -> dict:
    access_token = create_access_token(subject=sample_user.id)
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(name="auth_client")
def auth_client_fixture(client: TestClient, user_token_headers: dict):
    client.headers.update(user_token_headers)
    return client
