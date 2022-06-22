from sys import argv
import sys
import flask
from flask import Flask, send_file, request, jsonify
import json
import random
import ast
import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.engine import Connection
from dataclasses import dataclass
import datetime


app = Flask(__name__, static_url_path="", static_folder="frontend/build")

database_url = os.getenv("DATABASE_URL")
if database_url:
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url.replace("postgres://", "postgresql://")
if len(argv) > 1 and argv[1] == "--use-secrets-file":
    url = open("secrets.txt", "r").read()[:-1]
    app.config["SQLALCHEMY_DATABASE_URI"] = url

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or "DEVELOPMENT SECRET KEY"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # get rid of warning

db: SQLAlchemy = SQLAlchemy(app)
session = db.session


def get_database_connection() -> Connection:
    return session.connection()


try:
    tokens = ast.literal_eval(open("./tokens.json").read())
except:
    tokens = []


@app.route("/tokens")
def get_tokens():
    return jsonify(tokens)


@app.route("/get_doc")
def get_doc():
    doc_choice_num = random.randint(0, 9999)

    return jsonify(
        {
            "docId": doc_choice_num,
            "tokens": json.load(open(__file__[:-6] + f"/docs/doc{doc_choice_num}.json")),
        }
    )


@app.route("/get_comparison")
def get_comparison():
    doc_choice_num = random.randint(0, 2486)
    return jsonify(json.load(open(__file__[:-6] + f"/comparisons/doc{doc_choice_num}.json")))


@app.route("/get_multi_comparison/<comparison_nb>")
def get_multi_comparison(comparison_nb):
    return jsonify(json.load(open(__file__[:-6] + f"/multi_comparisons/doc{comparison_nb}.json")))


@app.route("/")
def lm_game():
    return send_file(__file__[:-6] + "frontend/build/index.html")


@app.route("/whichone")
def whichone_game():
    return send_file(__file__[:-6] + "frontend/build/index.html")


@app.route("/whichonescored")
def whichone_game_scored():
    return send_file(__file__[:-6] + "frontend/build/index.html")


@dataclass
class LmGameGuess(db.Model):
    __tablename__ = "lm_game_guesses"
    id: int
    id = db.Column(db.Integer, primary_key=True)

    username: str
    username = db.Column(db.String, nullable=False)

    guess: str
    guess = db.Column(db.String, nullable=False)

    correct_answer: str
    correct_answer = db.Column(db.String, nullable=False)

    guessed_token_idx: int
    guessed_token_idx = db.Column(db.Integer, nullable=False)

    doc_id: int
    doc_id = db.Column(db.Integer, nullable=False)

    created_on = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_on = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


@app.route("/submit_guess", methods=["POST"])
def submit_guess():
    stuff = request.get_json()
    db.session.add(LmGameGuess(**stuff))
    db.session.commit()

    return "whatever"


@dataclass
class WhichOneGameGuess(db.Model):
    __tablename__ = "whichone_game_guesses"
    id: int
    id = db.Column(db.Integer, primary_key=True)

    username: str
    username = db.Column(db.String, nullable=False)

    guess: int  # X% that the correct one is the correct one
    guess = db.Column(db.String, nullable=False)

    reason: str
    reason = db.Column(db.String, nullable=False)

    comparison_id: int
    comparison_id = db.Column(db.Integer, nullable=False)

    created_on = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_on = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


@app.route("/submit_whichone_guess", methods=["POST"])
def submit_whichone_guess():
    stuff = request.get_json()
    db.session.add(WhichOneGameGuess(**stuff))
    db.session.commit()

    return "whatever"


@dataclass
class WhichOneScoredGameGuess(db.Model):
    __tablename__ = "whichonescored_game_guesses"
    id: int
    id = db.Column(db.Integer, primary_key=True)

    username: str
    username = db.Column(db.String, nullable=False)

    guess: float  # X% that the correct one is the correct one
    guess = db.Column(db.String, nullable=False)

    comparison_id: int
    comparison_id = db.Column(db.Integer, nullable=False)

    comparison_number: int
    comparison_number = db.Column(db.Integer, nullable=False)

    created_on = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_on = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


@app.route("/submit_whichone_scored_guess", methods=["POST"])
def submit_whichonescored_guess():
    stuff = request.get_json()
    print(stuff)
    db.session.add(WhichOneScoredGameGuess(**stuff))
    db.session.commit()

    return "whatever"


if __name__ == "__main__":
    # Threaded option to enable multiple instances for multiple user access support
    app.run(host="0.0.0.0", threaded=True, port=int(os.getenv("PORT", "5000")), debug=True)
