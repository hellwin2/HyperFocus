from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models import User
from app.core import security

def test_register_user(client: TestClient, db_session: Session):
    response = client.post(
        "/api/v1/register",
        json={"email": "newuser@example.com", "password": "newpassword123", "name": "New User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    
    # Verify in DB
    user = db_session.exec(select(User).where(User.email == "newuser@example.com")).first()
    assert user is not None
    assert security.verify_password("newpassword123", user.hashed_password)

def test_login_access_token(client: TestClient, sample_user: User):
    login_data = {
        "username": sample_user.email,
        "password": "testpassword", # Assuming sample_user fixture uses this password
    }
    response = client.post("/api/v1/login/access-token", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    assert tokens["token_type"] == "bearer"

def test_use_access_token(client: TestClient, sample_user: User):
    # 1. Login
    login_data = {
        "username": sample_user.email,
        "password": "testpassword",
    }
    response = client.post("/api/v1/login/access-token", data=login_data)
    access_token = response.json()["access_token"]
    
    # 2. Access protected endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == sample_user.email
