import os
import random
from datetime import datetime

from flask import Flask, make_response, redirect, render_template, request, send_from_directory

app = Flask(__name__)

starting_balance = 0.00
starting_transactions = []
app_name = "Northstar Bank"
withdraw_providers = ["Cash App", "Venmo", "Apple Pay"]
add_money_decline_cookie = "northstar_add_money_last_declined"

@app.route("/")
def home():
    return render_template("home.html", balance=starting_balance, transactions=starting_transactions[:3], active_page="accounts", app_name=app_name)


@app.route("/card")
def card_page():
    return render_template("card.html", active_page="card", app_name=app_name)

@app.route("/deposit", methods=["GET", "POST"])
def deposit():
    if request.method == "POST":
        amount = float(request.form["amount"])
        check_image = request.files.get("check_image")
        if not check_image or not check_image.filename:
            return render_template(
                "deposit.html",
                active_page="accounts",
                app_name=app_name,
                error="Add a check photo to continue.",
                form_data=request.form
            )
        occurred_at = datetime.now().isoformat(timespec="seconds")
        receipt_id = random.randint(100000000000, 999999999999)
        return redirect(f"/receipt?amount={amount}&source=check&receipt_id={receipt_id}&occurred_at={occurred_at}")
    return render_template("deposit.html", active_page="accounts", app_name=app_name, error=None, form_data={})


@app.route("/add-money", methods=["GET", "POST"])
def add_money():
    if request.method == "POST":
        amount = float(request.form["amount"])
        card_number = "".join(ch for ch in request.form["card_number"] if ch.isdigit())
        expiry = request.form["expiry"]
        cvv = request.form["cvv"]
        holder_name = request.form["holder_name"]

        if len(card_number) != 16:
            return render_template(
                "add_money.html",
                active_page="accounts",
                app_name=app_name,
                error="Card number must be exactly 16 digits.",
                form_data=request.form
            )

        occurred_at = datetime.now().isoformat(timespec="seconds")
        receipt_id = random.randint(100000000000, 999999999999)
        last_declined = request.cookies.get(add_money_decline_cookie) == "1"
        should_decline = (not last_declined) and random.random() < 0.55
        status = "declined" if should_decline else "approved"
        response = make_response(redirect(
            f"/receipt?amount={amount}&source=card&last4={card_number[-4:]}&holder_name={holder_name}"
            f"&receipt_id={receipt_id}&occurred_at={occurred_at}&status={status}"
        ))
        response.set_cookie(
            add_money_decline_cookie,
            "1" if should_decline else "0",
            max_age=60 * 60 * 24 * 365,
            samesite="Lax"
        )
        return response

    return render_template("add_money.html", active_page="accounts", app_name=app_name, error=None, form_data={})

@app.route("/receipt")
def receipt():
    amount = float(request.args.get("amount"))
    occurred_at = request.args.get("occurred_at")
    now = datetime.fromisoformat(occurred_at) if occurred_at else datetime.now()
    last4 = request.args.get("last4") or random.randint(1000, 9999)
    tx_id = request.args.get("receipt_id") or random.randint(100000000000, 999999999999)
    source = request.args.get("source", "deposit")
    holder_name = request.args.get("holder_name", "Holder Name ")
    status = request.args.get("status", "approved").lower()
    if status not in {"approved", "declined"}:
        status = "approved"

    return render_template("receipt.html",
                           amount=amount,
                           date=now.strftime("%m/%d/%Y %H:%M"),
                           occurred_at=now.isoformat(timespec="seconds"),
                           last4=last4,
                           tx_id=tx_id,
                           source=source,
                           holder_name=holder_name,
                           status=status,
                           active_page="accounts",
                           app_name=app_name)


@app.route("/transactions")
def transactions_page():
    return render_template("transactions.html", transactions=starting_transactions, balance=starting_balance, active_page="transactions", app_name=app_name)


@app.route("/withdraw")
def withdraw_page():
    return render_template(
        "withdraw.html",
        balance=starting_balance,
        transactions=starting_transactions,
        providers=withdraw_providers,
        active_page="accounts",
        app_name=app_name
    )


@app.route("/profile")
def profile_page():
    return render_template("profile.html", active_page="profile", app_name=app_name)


@app.route("/healthz")
def healthz():
    return {"status": "ok"}, 200


@app.route("/manifest.webmanifest")
def manifest():
    return send_from_directory("static", "manifest.webmanifest", mimetype="application/manifest+json")


@app.route("/service-worker.js")
def service_worker():
    response = send_from_directory("static", "service-worker.js", mimetype="application/javascript")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Service-Worker-Allowed"] = "/"
    return response

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
