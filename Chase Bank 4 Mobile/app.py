import os
import random
from datetime import datetime

from flask import Flask, redirect, render_template, request, send_from_directory

app = Flask(__name__)

balance = 255.00
transactions = [
    {"title": "Payroll deposit", "subtitle": "Today, 8:10 AM", "amount": "+$2,450.00", "positive": True, "category": "Income"},
    {"title": "Electric utility", "subtitle": "Yesterday, 6:42 PM", "amount": "-$84.17", "positive": False, "category": "Bills"},
    {"title": "Card purchase", "subtitle": "Yesterday, 1:15 PM", "amount": "-$19.48", "positive": False, "category": "Shopping"},
    {"title": "Coffee shop", "subtitle": "Monday, 9:03 AM", "amount": "-$6.85", "positive": False, "category": "Food"},
    {"title": "Cash App transfer", "subtitle": "Sunday, 4:21 PM", "amount": "-$120.00", "positive": False, "category": "Transfer"},
    {"title": "ATM deposit", "subtitle": "Saturday, 11:11 AM", "amount": "+$300.00", "positive": True, "category": "Deposit"},
]
app_name = "Northstar Bank"
withdraw_providers = ["Cash App", "Venmo", "Apple Pay"]

@app.route("/")
def home():
    return render_template("home.html", balance=balance, transactions=transactions[:3], active_page="accounts", app_name=app_name)


@app.route("/card")
def card_page():
    return render_template("card.html", active_page="card", app_name=app_name)

@app.route("/deposit", methods=["GET", "POST"])
def deposit():
    global balance
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
        balance += amount
        return redirect(f"/receipt?amount={amount}&source=check")
    return render_template("deposit.html", active_page="accounts", app_name=app_name, error=None, form_data={})


@app.route("/add-money", methods=["GET", "POST"])
def add_money():
    global balance
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

        balance += amount
        return redirect(
            f"/receipt?amount={amount}&source=card&last4={card_number[-4:]}&holder_name={holder_name}"
        )

    return render_template("add_money.html", active_page="accounts", app_name=app_name, error=None, form_data={})

@app.route("/receipt")
def receipt():
    amount = float(request.args.get("amount"))
    now = datetime.now()
    last4 = request.args.get("last4") or random.randint(1000, 9999)
    tx_id = random.randint(100000000000, 999999999999)
    source = request.args.get("source", "deposit")
    holder_name = request.args.get("holder_name", "Holder Name ")

    return render_template("receipt.html",
                           amount=amount,
                           date=now.strftime("%m/%d/%Y %H:%M"),
                           last4=last4,
                           tx_id=tx_id,
                           source=source,
                           holder_name=holder_name,
                           active_page="accounts",
                           app_name=app_name)


@app.route("/transactions")
def transactions_page():
    return render_template("transactions.html", transactions=transactions, balance=balance, active_page="transactions", app_name=app_name)


@app.route("/withdraw")
def withdraw_page():
    return render_template(
        "withdraw.html",
        balance=balance,
        transactions=transactions,
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
