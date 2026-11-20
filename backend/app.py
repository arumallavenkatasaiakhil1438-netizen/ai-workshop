import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from postgrest import APIError
from supabase import Client, create_client

load_dotenv()

app = Flask(__name__)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
supabase: Client | None = (
    create_client(supabase_url, supabase_key)
    if supabase_url and supabase_key
    else None
)


@app.after_request
def add_cors_headers(response):
    """Allow browser clients from any origin to call this API."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Events API", "endpoints": [
        "GET /api/events",
        "GET /api/events/<id>",
        "POST /api/registrations",
        "GET /api/me/registrations?user_id=<uuid>",
        "GET /api/events/<id>/registrations",
    ]})


@app.route("/api/events", methods=["GET"])
def list_events():
    try:
        result = supabase.table("events").select("*").execute()
        return jsonify(result.data)
    except APIError as error:
        return jsonify({"error": error.message}), 500


@app.route("/api/events/<event_id>", methods=["GET"])
def get_event(event_id):
    try:
        result = (
            supabase.table("events")
            .select("*")
            .eq("id", event_id)
            .maybe_single()
            .execute()
        )
        if result.data is None:
            return jsonify({"error": "Event not found"}), 404
        return jsonify(result.data)
    except APIError as error:
        return jsonify({"error": error.message}), 400


@app.route("/api/registrations", methods=["POST"])
def create_registration():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    user_id = body.get("user_id")
    event_id = body.get("event_id")
    if not user_id or not event_id:
        return jsonify({"error": "user_id and event_id are required"}), 400

    try:
        event_result = (
            supabase.table("events")
            .select("id, capacity")
            .eq("id", event_id)
            .maybe_single()
            .execute()
        )
        event = event_result.data
        if event is None:
            return jsonify({"error": "Event not found"}), 404

        existing = (
            supabase.table("registrations")
            .select("id")
            .eq("user_id", user_id)
            .eq("event_id", event_id)
            .execute()
        )
        if existing.data:
            return jsonify({"error": "Already registered for this event"}), 409

        registrations = (
            supabase.table("registrations")
            .select("id")
            .eq("event_id", event_id)
            .execute()
        )
        capacity = event.get("capacity")
        if capacity is not None and len(registrations.data) >= capacity:
            return jsonify({"error": "Event is at capacity"}), 409

        created = (
            supabase.table("registrations")
            .insert({"user_id": user_id, "event_id": event_id})
            .execute()
        )
        return jsonify(created.data[0]), 201
    except APIError as error:
        # A unique constraint on (user_id, event_id) can catch concurrent duplicates.
        if getattr(error, "code", None) == "23505":
            return jsonify({"error": "Already registered for this event"}), 409
        return jsonify({"error": error.message}), 400


@app.route("/api/me/registrations", methods=["GET"])
def list_user_registrations():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter is required"}), 400

    try:
        result = (
            supabase.table("registrations")
            .select("*, events(*)")
            .eq("user_id", user_id)
            .execute()
        )
        return jsonify(result.data)
    except APIError as error:
        return jsonify({"error": error.message}), 400


@app.route("/api/events/<event_id>/registrations", methods=["GET"])
def list_event_registrations(event_id):
    try:
        event = (
            supabase.table("events")
            .select("id")
            .eq("id", event_id)
            .maybe_single()
            .execute()
        )
        if event.data is None:
            return jsonify({"error": "Event not found"}), 404

        result = (
            supabase.table("registrations")
            .select("*, users(*)")
            .eq("event_id", event_id)
            .execute()
        )
        return jsonify(result.data)
    except APIError as error:
        return jsonify({"error": error.message}), 400


if __name__ == "__main__":
    app.run(debug=True)
