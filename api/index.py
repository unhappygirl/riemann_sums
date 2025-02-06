
from flask import *

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/favicon.ico")
def icon():
    return open("api/favicon.ico", "rb").read()

if __name__ == "__main__":
    app.run("0.0.0.0", 8000)