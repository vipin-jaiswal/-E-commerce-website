const { spawn } = require("child_process");
const path = require("path");

const runPython = (imagePath) => {
  return new Promise((resolve, reject) => {
    // Path to predict.py
    const pythonScript = path.join(__dirname, "../../AI-models/predict.py");

    // Change "python" to "py" if that's how you run Python on Windows
    const python = spawn("python", [pythonScript, imagePath]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(error || "Python script failed");
      }

      try {
        resolve(JSON.parse(output));
      } catch (err) {
        reject("Invalid JSON returned from predict.py");
      }
    });
  });
};

module.exports = runPython;