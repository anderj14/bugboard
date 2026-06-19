from app.models.bug import BugStatus, SeverityLevel
from datetime import datetime, timezone


class TestMetricsSummary:
    def test_summary_empty(self, client):
        response = client.get("/api/metrics/summary")
        assert response.status_code == 200
        data = response.json()
        assert data == {"total": 0, "open": 0, "resolved": 0, "critical": 0}

    def test_summary_with_data(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, status=BugStatus.OPEN)
        create_test_bug(db, status=BugStatus.RESOLVED)
        create_test_bug(db, severity=SeverityLevel.CRITICAL)

        response = client.get("/api/metrics/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["open"] == 2
        assert data["resolved"] == 1
        assert data["critical"] == 1


class TestMetricsBySeverity:
    def test_by_severity_empty(self, client):
        response = client.get("/api/metrics/by-severity")
        assert response.status_code == 200
        assert response.json() == []

    def test_by_severity_with_data(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, severity=SeverityLevel.CRITICAL)
        create_test_bug(db, severity=SeverityLevel.CRITICAL)
        create_test_bug(db, severity=SeverityLevel.LOW)

        response = client.get("/api/metrics/by-severity")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        severity_map = {item["severity"]: item["count"] for item in data}
        assert severity_map["Critical"] == 2
        assert severity_map["Low"] == 1


class TestMetricsByModule:
    def test_by_module_empty(self, client):
        response = client.get("/api/metrics/by-module")
        assert response.status_code == 200
        assert response.json() == []

    def test_by_module_with_data(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, module="auth")
        create_test_bug(db, module="auth")
        create_test_bug(db, module="ui")

        response = client.get("/api/metrics/by-module")
        assert response.status_code == 200
        data = response.json()
        module_map = {item["module"]: item["count"] for item in data}
        assert module_map["auth"] == 2
        assert module_map["ui"] == 1


class TestMetricsByStatus:
    def test_by_status_empty(self, client):
        response = client.get("/api/metrics/by-status")
        assert response.status_code == 200
        assert response.json() == []

    def test_by_status_with_data(self, client, db):
        from tests.conftest import create_test_bug
        create_test_bug(db, status=BugStatus.OPEN)
        create_test_bug(db, status=BugStatus.OPEN)
        create_test_bug(db, status=BugStatus.RESOLVED)

        response = client.get("/api/metrics/by-status")
        assert response.status_code == 200
        data = response.json()
        status_map = {item["status"]: item["count"] for item in data}
        assert status_map["Open"] == 2
        assert status_map["Resolved"] == 1


class TestMetricsTimeline:
    def test_timeline_empty(self, client):
        response = client.get("/api/metrics/timeline")
        assert response.status_code == 200
        assert response.json() == []

    def test_timeline_with_data(self, client, db):
        from tests.conftest import create_test_bug
        from app.models.bug import Bug
        import uuid

        today = datetime.now(timezone.utc).date()
        bug = Bug(
            id=uuid.uuid4(),
            raw_description="Test",
            title="Test",
            severity=SeverityLevel.LOW,
            module="ui",
            status=BugStatus.OPEN,
            created_at=datetime(today.year, today.month, today.day, 12, 0, 0, tzinfo=timezone.utc),
        )
        db.add(bug)
        db.commit()

        response = client.get("/api/metrics/timeline")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["count"] >= 1
