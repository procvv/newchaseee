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

@app.route("/")
def home():
    return render_template("home.html", balance=balance, transactions=transactions[:3], active_page="accounts")

@app.route("/deposit", methods=["GET", "POST"])
def deposit():
    global balance
    if request.method == "POST":
        amount = float(request.form["amount"])
        balance += amount
        return redirect(f"/receipt?amount={amount}")
    return render_template("deposit.html", active_page="accounts")

@app.route("/receipt")
def receipt():
    amount = float(request.args.get("amount"))
    now = datetime.now()
    last4 = random.randint(1000, 9999)
    tx_id = random.randint(100000000000, 999999999999)

    return render_template("receipt.html",
                           amount=amount,
                           date=now.strftime("%m/%d/%Y %H:%M"),
                           last4=last4,
                           tx_id=tx_id,
                           active_page="accounts")


@app.route("/transactions")
def transactions_page():
    return render_template("transactions.html", transactions=transactions, balance=balance, active_page="transactions")


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
