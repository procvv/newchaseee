# Chase Bank 4 Mobile

This project is a Flask app that can be deployed to Render as a Python web service.

## Local run

```powershell
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Render deployment

This repo includes a `render.yaml` Blueprint for Render.

Render settings:

- Runtime: `Python`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Health Check Path: `/healthz`

### Deploy steps

1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Render, click `New` -> `Blueprint`.
3. Connect the repository that contains this project.
4. Render will detect `render.yaml` and create the web service.
5. After deploy finishes, open the generated `onrender.com` URL on your phone.

## Notes

- The app already binds to `0.0.0.0` and respects the `PORT` environment variable for local/server compatibility.
- The PWA install flow works best over HTTPS, which Render provides automatically on `onrender.com`.
