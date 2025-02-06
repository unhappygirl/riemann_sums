
from flask import *

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("static/node_modules/mathquill/build/mathquill.css")
def evaluatex():
    return render_template("index.html")
@app.route("static/node_modules/mathquill/build/mathquill.css")
def mathquill():
    return render_template("index.html")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/favicon.ico")
def icon():
    return open("./favicon.ico", "rb").read()

if __name__ == "__main__":
    app.run("0.0.0.0", 8000)