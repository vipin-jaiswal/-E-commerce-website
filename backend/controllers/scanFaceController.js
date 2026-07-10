const fs = require("fs");
const runPython = require("../utils/pythonRunner");

const scanFace = async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Run AI model
    const result = await runPython(req.file.path);

    // Clean up the temp file now that prediction is done
    fs.unlink(req.file.path, () => {});

    return res.status(200).json({
      success: true,
      disease: result.disease,
      confidence: result.confidence,
    });

  } catch (error) {
    console.error("Prediction Error:", error);

    // Still clean up the temp file on failure
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({
      success: false,
      message: "Prediction failed",
    });
  }
};

module.exports = {
  scanFace,
};
