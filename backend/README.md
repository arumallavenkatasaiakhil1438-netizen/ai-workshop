# Events API

Flask API backed by Supabase. The Render Blueprint in `render.yaml` describes a Python web service.

## Deploy on Render

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In Render, choose **New → Blueprint** and connect the repository. If this folder is inside a larger repository, set the Blueprint's root directory to `backend` (or the directory containing `render.yaml`).
3. Render reads `render.yaml` and prompts for `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Set them from the Supabase project API settings; do not commit `.env`.
4. Deploy the created `events-api` service. Render installs dependencies from `requirements.txt` and starts it with Gunicorn.

The API enables cross-origin requests from any origin and has no authentication or authorization. Routes that need a user accept `user_id` from the request, so callers can act as any user ID.

## Local run

Create a `.env` file with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then run:

```sh
python -m pip install -r requirements.txt
gunicorn app:app
```
