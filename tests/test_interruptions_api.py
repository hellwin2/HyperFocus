from datetime import datetime, timedelta, timezone

def test_create_session_and_interruption(auth_client, sample_user):
    """
    Flujo básico de la API con Auth:
    - Crea una sesión de trabajo (usa user del token)
    - Registra una interrupción (usa user del token)
    """
    # 1) Crear sesión
    resp_session = auth_client.post(
        "/api/v1/sessions/start",
        json={},
    )
    assert resp_session.status_code == 201
    session_data = resp_session.json()
    session_id = session_data["id"]
    assert session_data["end_time"] is None
    assert session_data["user_id"] == sample_user.id

    # 2) Crear interrupción dentro de esa sesión
    start = datetime.now(timezone.utc) - timedelta(minutes=5)
    end = datetime.now(timezone.utc)

    resp_interruption = auth_client.post(
        "/api/v1/interruptions/",
        json={
            "session_id": session_id,
            "type": "phone",
            "description": "WhatsApp messages",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )

    assert resp_interruption.status_code == 201
    interruption_data = resp_interruption.json()
    assert interruption_data["session_id"] == session_id
    assert interruption_data["user_id"] == sample_user.id
    # duración aprox 300s (5 minutos), dejamos margen
    assert 200 <= interruption_data["duration"] <= 400

def test_interruption_rejects_wrong_session(auth_client, client, db_session):
    """
    Comprueba que no se puede añadir interrupción a sesión de otro usuario.
    """
    # Crear otro usuario y su sesión manualmente
    from app.models import User, Session as WorkSession
    other_user = User(name="Other", email="other@example.com", hashed_password="x")
    db_session.add(other_user)
    db_session.commit()
    
    other_session = WorkSession(user_id=other_user.id, start_time=datetime.now(timezone.utc))
    db_session.add(other_session)
    db_session.commit()
    db_session.refresh(other_session)

    # Intentar añadir interrupción a esa sesión con auth_client (sample_user)
    start = datetime.now(timezone.utc) - timedelta(minutes=2)
    end = datetime.now(timezone.utc)

    resp_interruption = auth_client.post(
        "/api/v1/interruptions/",
        json={
            "session_id": other_session.id,
            "type": "noise",
            "description": "Noise test",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )

    # Debe fallar porque la sesión no pertenece al usuario logueado
    assert resp_interruption.status_code == 403
