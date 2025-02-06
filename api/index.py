
from flask import *

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/favicon.ico")
def icon():
    return open("api/favicon.ico", "rb").read()

@app.route('/npm/<file>') 
def serve_module(file):
    return send_from_directory("/api/static/node_modules", file)

if __name__ == "__main__":
    app.run("0.0.0.0", 8000)