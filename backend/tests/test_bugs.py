import pytest
from unittest.mock import patch
from app.models.bug import BugStatus, SeverityLevel


class TestGetBugs:
    def test_list_bugs_empty(self, client):
        response = client.get("/api/bugs/")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_bugs_with_data(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db)
        create_test_bug(db)

        response = client.get("/api/bugs/")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_filter_by_severity(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, severity=SeverityLevel.CRITICAL, module="auth")
        create_test_bug(db, severity=SeverityLevel.LOW, module="ui")

        response = client.get("/api/bugs/?severity=CRITICAL")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["severity"] == "Critical"

    def test_filter_by_status(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, status=BugStatus.OPEN)
        create_test_bug(db, status=BugStatus.RESOLVED)

        response = client.get("/api/bugs/?status=OPEN")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "Open"

    def test_filter_by_module(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, module="auth")
        create_test_bug(db, module="payments")

        response = client.get("/api/bugs/?module=auth")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["module"] == "auth"

    def test_combined_filters(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, severity=SeverityLevel.CRITICAL, module="auth")
        create_test_bug(db, severity=SeverityLevel.CRITICAL, module="payments")
        create_test_bug(db, severity=SeverityLevel.LOW, module="auth")

        response = client.get("/api/bugs/?severity=CRITICAL&module=auth")
        assert response.status_code == 200
        assert len(response.json()) == 1


class TestCreateBug:
    def test_create_bug_success(self, client, mock_ollama):
        with patch("app.routers.bugs.classify_bug", mock_ollama):
            response = client.post("/api/bugs/", json={
                "raw_description": "Login button not working when I click it",
            })

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Login button not working"
        assert data["severity"] == "High"
        assert data["module"] == "auth"
        assert data["status"] == "Open"
        assert data["is_duplicate"] is False

    def test_create_bug_with_context(self, client, mock_ollama):
        with patch("app.routers.bugs.classify_bug", mock_ollama):
            response = client.post("/api/bugs/", json={
                "raw_description": "Button broken",
                "context": {
                    "browser": "Chrome 120",
                    "operating_system": "macOS 14",
                    "current_url": "https://example.com/login",
                    "screen_resolution": "1920x1080",
                },
            })

        assert response.status_code == 201
        data = response.json()
        assert data["browser"] == "Chrome 120"
        assert data["operating_system"] == "macOS 14"
        assert data["current_url"] == "https://example.com/login"

    def test_create_bug_with_reporter(self, client, mock_ollama):
        with patch("app.routers.bugs.classify_bug", mock_ollama):
            response = client.post("/api/bugs/", json={
                "raw_description": "Something broke",
                "reporter_name": "Anderson",
                "reporter_email": "anderson@test.com",
                "source_app": "my-app",
            })

        assert response.status_code == 201
        data = response.json()
        assert data["reporter_name"] == "Anderson"
        assert data["reporter_email"] == "anderson@test.com"
        assert data["source_app"] == "my-app"

    def test_create_bug_empty_description_fails(self, client):
        response = client.post("/api/bugs/", json={"raw_description": ""})
        assert response.status_code >= 400

    def test_create_bug_ollama_error(self, client):
        with patch("app.routers.bugs.classify_bug", side_effect=Exception("Ollama down")):
            response = client.post("/api/bugs/", json={
                "raw_description": "Something is broken",
            })

        assert response.status_code == 500
        assert "Ollama" in response.json()["detail"]

    def test_duplicate_detection(self, client, db, mock_ollama):
        from tests.conftest import create_test_bug
        create_test_bug(db, title="Login button not working", module="auth", is_duplicate=False)

        with patch("app.routers.bugs.classify_bug", mock_ollama):
            response = client.post("/api/bugs/", json={
                "raw_description": "Login button not working when I click it",
            })

        assert response.status_code == 201
        data = response.json()
        assert data["is_duplicate"] is True
        assert data["duplicate_of_id"] is not None

    def test_preview_endpoint(self, client, mock_ollama):
        with patch("app.routers.bugs.classify_bug", mock_ollama):
            response = client.post("/api/bugs/preview", json={
                "raw_description": "Login button not working",
            })

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Login button not working"
        assert data["is_duplicate"] is False


class TestGetBugById:
    def test_get_existing_bug(self, client, db):
        from tests.conftest import create_test_bug
        bug = create_test_bug(db)

        response = client.get(f"/api/bugs/{bug.id}")
        assert response.status_code == 200
        assert response.json()["id"] == str(bug.id)

    def test_get_nonexistent_bug(self, client):
        response = client.get("/api/bugs/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404


class TestUpdateStatus:
    def test_update_status_success(self, client, db):
        from tests.conftest import create_test_bug
        bug = create_test_bug(db)

        response = client.patch(f"/api/bugs/{bug.id}/status", json={"status": "OPEN"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Open"

    def test_update_status_nonexistent_bug(self, client):
        response = client.patch(
            "/api/bugs/00000000-0000-0000-0000-000000000000/status",
            json={"status": "OPEN"},
        )
        assert response.status_code == 404
