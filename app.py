from flask import Flask, render_template, request, jsonify
import zlib

app = Flask(__name__)


# Home page
@app.route("/")
def index():
    return render_template("index.html")


# CRC-32 calculation
@app.route("/calculate_crc32", methods=["POST"])
def calculate_crc32():

    try:
        file = request.files.get("file")

        if not file:
            return jsonify({
                "success": False,
                "error": "No file received"
            }), 400

        # Read uploaded file as binary
        file_data = file.read()

        # Calculate CRC-32 using Python
        crc_value = zlib.crc32(file_data) & 0xffffffff

        # Convert to 8-digit hexadecimal
        crc32 = format(crc_value, "08X")

        return jsonify({
            "success": True,
            "crc32": crc32
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Start Flask
if __name__ == "__main__":
    app.run(debug=True)