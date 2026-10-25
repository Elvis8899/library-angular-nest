#!/usr/bin/env python3
"""The deploy hook: CI's deploy job calls https://<DOMAIN>/hooks/deploy, which
nginx sends here, and this runs `make dockerDeploy` on the server.

A service on the host, not a container, so a deploy restarting the stack
doesn't stop it (installed by `make serverHook`). Both routes need
.docker/.env's DEPLOY_TOKEN as a Bearer token:

- POST /hooks/deploy?ref=<commit>: deploys that commit (the one CI tested; a
  full id, nothing else is taken) in the background, one deploy at a time. A
  call during a deploy is queued for right after it, the latest commit
  winning. Answers 202 at once.
- GET /hooks/deploy/status: whether a deploy is running or queued, how the
  last one ended and the end of the log (.docker/deploy.log).

And for Prometheus, without a token: GET /metrics, the same state as metrics
(Grafana's "Deploy failed" and "Deploy stuck" alerts). Not under /hooks/, so
nginx never sends it here: only the Docker network reaches it, like the API's
metrics port.
"""

import calendar
import hmac
import http.server
import json
import os
import pathlib
import re
import subprocess
import threading
import time
import urllib.parse

REPO = pathlib.Path(__file__).resolve().parent.parent
LOG = REPO / ".docker" / "deploy.log"
DEPLOYED = REPO / ".docker" / ".deployed"
# The Docker network's gateway, which nginx reaches and the internet doesn't
HOST, PORT = os.environ.get("DEPLOY_HOOK_ADDRESS", "172.18.0.1:9010").split(":")
COMMIT = re.compile(r"[0-9a-f]{40}")
# The line a deploy ends with in the log
FINISHED = re.compile(r"^=== (\S+) exit (-?\d+)$")
# The log keeps about its last 200 kB once it passes 1 MB
LOG_LIMIT, LOG_KEEP = 1_000_000, 200_000

state = {
    "running": False,
    "queued": None,
    "ref": None,
    "result": None,
    "started": None,
    "finished": None,
    "deployed": None,
}
lock = threading.Lock()


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def token():
    """Read on every request, so a new token applies without a restart."""
    for line in (REPO / ".docker" / ".env").read_text().splitlines():
        name, _, value = line.partition("=")
        if name.strip() == "DEPLOY_TOKEN":
            return value.strip().strip("'\"")
    return ""


def trim_log():
    if LOG.exists() and LOG.stat().st_size > LOG_LIMIT:
        LOG.write_bytes(LOG.read_bytes()[-LOG_KEEP:])


def log_tail(lines=60):
    if not LOG.exists():
        return ""
    return "\n".join(LOG.read_text(errors="replace").splitlines()[-lines:])


def last_finished():
    """How the last deploy in the log ended, so a restart of the hook (the
    server rebooting) doesn't forget a failure: (result, finished) or Nones."""
    if not LOG.exists():
        return None, None
    for line in reversed(LOG.read_text(errors="replace").splitlines()):
        match = FINISHED.match(line)
        if match:
            return ("ok" if match[2] == "0" else "failed"), match[1]
    return None, None


def epoch(timestamp):
    return calendar.timegm(time.strptime(timestamp, "%Y-%m-%dT%H:%M:%SZ"))


def metrics():
    """The state in Prometheus' text format; a value not known yet is left out."""
    with lock:
        current = dict(state)
    lines = [
        "# HELP deploy_running Whether a deploy is running (1) or not (0).",
        "# TYPE deploy_running gauge",
        f"deploy_running {int(current['running'])}",
    ]
    if current["running"] and current["started"]:
        lines += [
            "# HELP deploy_started_timestamp_seconds When the running deploy started.",
            "# TYPE deploy_started_timestamp_seconds gauge",
            f"deploy_started_timestamp_seconds {epoch(current['started'])}",
        ]
    if current["result"]:
        lines += [
            "# HELP deploy_last_success Whether the last finished deploy succeeded (1) or failed (0).",
            "# TYPE deploy_last_success gauge",
            f"deploy_last_success {int(current['result'] == 'ok')}",
        ]
    if current["finished"]:
        lines += [
            "# HELP deploy_last_finished_timestamp_seconds When the last deploy finished.",
            "# TYPE deploy_last_finished_timestamp_seconds gauge",
            f"deploy_last_finished_timestamp_seconds {epoch(current['finished'])}",
        ]
    return "\n".join(lines) + "\n"


def deploy(ref):
    """Runs the deploys: this one, then whatever was queued meanwhile."""
    while True:
        trim_log()
        with LOG.open("a") as log:
            log.write(f"\n=== {now()} make dockerDeploy REF={ref}\n")
            log.flush()
            code = subprocess.call(
                ["make", "dockerDeploy", f"REF={ref}"],
                cwd=REPO,
                stdout=log,
                stderr=subprocess.STDOUT,
            )
            log.write(f"=== {now()} exit {code}\n")
        deployed = DEPLOYED.read_text().strip() if DEPLOYED.exists() else None
        with lock:
            state.update(
                result="ok" if code == 0 else "failed",
                finished=now(),
                deployed=deployed,
            )
            ref = state["queued"]
            if ref is None:
                state["running"] = False
                return
            state.update(queued=None, ref=ref, started=now(), finished=None)


class Hook(http.server.BaseHTTPRequestHandler):
    def answer(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def authorized(self):
        expected = token()
        given = self.headers.get("Authorization", "")
        # Constant time, and never with an empty token
        return bool(expected) and hmac.compare_digest(
            given.encode(), f"Bearer {expected}".encode()
        )

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if url.path != "/hooks/deploy":
            return self.answer(404, {"error": "not found"})
        if not self.authorized():
            return self.answer(401, {"error": "unauthorized"})
        ref = urllib.parse.parse_qs(url.query).get("ref", [""])[0]
        if not COMMIT.fullmatch(ref):
            return self.answer(422, {"error": "ref must be a full commit id"})
        with lock:
            if state["running"]:
                state["queued"] = ref
                return self.answer(202, {"queued": ref})
            state.update(running=True, ref=ref, started=now(), finished=None)
        threading.Thread(target=deploy, args=(ref,), daemon=True).start()
        return self.answer(202, {"started": ref})

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/metrics":
            data = metrics().encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if path != "/hooks/deploy/status":
            return self.answer(404, {"error": "not found"})
        if not self.authorized():
            return self.answer(401, {"error": "unauthorized"})
        with lock:
            body = dict(state)
        body["log"] = log_tail()
        return self.answer(200, body)

    def log_message(self, format, *args):
        # The deploys go to .docker/deploy.log; requests to the service's journal
        print(f"{self.address_string()} {format % args}", flush=True)


if __name__ == "__main__":
    state["result"], state["finished"] = last_finished()
    state["deployed"] = DEPLOYED.read_text().strip() if DEPLOYED.exists() else None
    http.server.ThreadingHTTPServer((HOST, int(PORT)), Hook).serve_forever()
