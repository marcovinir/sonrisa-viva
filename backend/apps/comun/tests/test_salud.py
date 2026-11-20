def test_salud_responde_ok(client):
    r = client.get("/api/v1/salud/")
    assert r.status_code == 200
    assert r.json() == {"estado": "ok"}
