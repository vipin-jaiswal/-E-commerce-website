import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import * as faceapi from "face-api.js";
import { Camera, UploadCloud, RefreshCw } from "lucide-react";

const videoConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: "user",
};

// Camera container + face-frame geometry (kept in sync with the SVG overlay below)
const CONTAINER_WIDTH = 700;
const CONTAINER_HEIGHT = 394;
const OVAL_CX = CONTAINER_WIDTH / 2;
const OVAL_CY = CONTAINER_HEIGHT / 2;
const OVAL_RX = 95;
const OVAL_RY = 160;

export default function FaceScan() {
  const location = useLocation();
  // mode comes from Header's popup navigation state:
  // "camera" -> webcam, "upload" -> file upload box (defaults to "camera")
  const initialMode = location.state?.mode === "upload" ? "upload" : "camera";

  const [mode, setMode] = useState(initialMode);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null); // { disease, confidence }
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isAligned, setIsAligned] = useState(false);

  const detectionIntervalRef = useRef(null);
  const autoCapturedRef = useRef(false);

  // Load the face detection model once on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("[FaceScan] Loading face detection models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        console.log("[FaceScan] Models loaded successfully.");
        setModelsLoaded(true);
      } catch (err) {
        console.error("[FaceScan] Failed to load face detection models:", err);
      }
    };
    loadModels();
  }, []);

  // Run live face detection while the camera is active, to know when
  // the user's face is aligned inside the frame (turns it green), and
  // auto-capture once alignment is detected.
  useEffect(() => {
    const clearDetectionLoop = () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };

    if (mode !== "camera" || !modelsLoaded || cameraError) {
      setIsAligned(false);
      clearDetectionLoop();
      return clearDetectionLoop;
    }

    detectionIntervalRef.current = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) {
        console.log("[FaceScan] Video not ready yet, readyState:", video?.readyState);
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (!detection) {
          console.log("[FaceScan] No face detected");
          setIsAligned(false);
          return;
        }

        const { box } = detection;

        // Map detection box (native video pixels) to the displayed
        // container's coordinate space. This assumes videoConstraints'
        // aspect ratio matches the container's (both 16:9), so no
        // object-fit cropping offset needs to be accounted for.
        const scaleX = CONTAINER_WIDTH / video.videoWidth;
        const scaleY = CONTAINER_HEIGHT / video.videoHeight;

        const centerX = (box.x + box.width / 2) * scaleX;
        const centerY = (box.y + box.height / 2) * scaleY;
        const faceHeight = box.height * scaleY;

        const dx = centerX - OVAL_CX;
        const dy = centerY - OVAL_CY;
        const withinOval =
          (dx * dx) / (OVAL_RX * OVAL_RX) + (dy * dy) / (OVAL_RY * OVAL_RY) <=
          1;

        // Also make sure the face is reasonably close/large, not tiny
        // and technically "inside" the oval by coincidence.
        const goodSize = faceHeight > OVAL_RY * 0.9;
        const aligned = withinOval && goodSize;

        console.log("[FaceScan] detection", {
          videoNative: { w: video.videoWidth, h: video.videoHeight },
          box,
          centerX,
          centerY,
          faceHeight,
          withinOval,
          goodSize,
        });

        setIsAligned(aligned);

        // Auto-capture once: only if aligned, not already captured this
        // session, not mid-scan, and no image/result currently showing.
        if (
          aligned &&
          !autoCapturedRef.current &&
          !loading &&
          !image &&
          !prediction
        ) {
          autoCapturedRef.current = true;
          console.log("[FaceScan] Auto-capturing aligned face");
          capture();
        }
      } catch (err) {
        console.error("[FaceScan] detection error:", err);
      }
    }, 300);

    return clearDetectionLoop;
  }, [mode, modelsLoaded, cameraError, loading, image, prediction]);

  const sendToServer = async (blob) => {
    setLoading(true);
    setPrediction(null);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("image", blob, "face.jpg");

      const response = await axios.post(
        "http://localhost:5000/api/scan-face",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setPrediction({
          disease: response.data.disease,
          confidence: response.data.confidence,
        });
      } else {
        setErrorMsg(response.data.message || "Prediction failed");
      }
    } catch (error) {
      console.log(error);
      // Show the backend's actual error message when available
      const backendMsg = error.response?.data?.message;
      setErrorMsg(backendMsg || "Prediction failed. Please try again.");
    }

    setLoading(false);
  };

  // ---- Webcam capture ----
  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      alert("Unable to capture image.");
      return;
    }

    setImage(imageSrc);

    const blob = await (await fetch(imageSrc)).blob();
    sendToServer(blob);
  };

  // ---- Image upload ----
  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);
    sendToServer(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const resetScan = () => {
    setImage(null);
    setPrediction(null);
    setErrorMsg("");
    autoCapturedRef.current = false;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setCameraError("");
    setIsAligned(false);
    resetScan();
  };

  const handleCameraError = (err) => {
    console.error("Camera error:", err);
    const name = err?.name || "";

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      setCameraError(
        "Camera access was blocked. Please allow camera permission in your browser settings and reload."
      );
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      setCameraError("No camera was found on this device.");
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      setCameraError(
        "Your camera is already in use by another app or browser tab."
      );
    } else if (name === "OverconstrainedError") {
      setCameraError("Your camera doesn't support the requested resolution.");
    } else {
      setCameraError("Unable to access the camera. Please check permissions and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">AI Face Scanner</h1>

      {/* Mode toggle */}
      <div className="flex bg-white rounded-full shadow p-1 mb-6">
        <button
          onClick={() => switchMode("camera")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full transition ${
            mode === "camera"
              ? "bg-pink-600 text-white"
              : "text-slate-600 hover:text-pink-600"
          }`}
        >
          <Camera size={18} />
          Camera
        </button>

        <button
          onClick={() => switchMode("upload")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full transition ${
            mode === "upload"
              ? "bg-pink-600 text-white"
              : "text-slate-600 hover:text-pink-600"
          }`}
        >
          <UploadCloud size={18} />
          Upload
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {mode === "camera" ? (
          <>
            <div className="relative w-[700px] h-[394px] overflow-hidden rounded-xl bg-black">
              {cameraError ? (
                <div className="w-full h-full flex items-center justify-center p-6 text-center text-red-300 text-sm">
                  {cameraError}
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    onUserMediaError={handleCameraError}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  {/* Face frame guide overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <svg
                      width="220"
                      height="340"
                      viewBox="0 0 220 340"
                      className="drop-shadow-lg"
                    >
                      <ellipse
                        cx="110"
                        cy="170"
                        rx="95"
                        ry="160"
                        fill="none"
                        stroke={isAligned ? "#22c55e" : "#ffffff"}
                        strokeOpacity={isAligned ? "1" : "0.85"}
                        strokeWidth={isAligned ? "5" : "3"}
                        strokeDasharray={isAligned ? "0" : "10 8"}
                        style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                      />
                    </svg>
                  </div>

                  <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-sm font-medium drop-shadow text-white">
                    {isAligned
                      ? "Face aligned ✓"
                      : "Align your face within the frame"}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={capture}
              disabled={!!cameraError}
              className="mt-6 w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl flex justify-center items-center gap-2"
            >
              <Camera size={20} />
              Capture Face
            </button>
          </>
        ) : (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="
                w-[700px]
                h-[400px]
                border-2 border-dashed border-pink-300
                rounded-xl
                flex flex-col items-center justify-center
                gap-3
                cursor-pointer
                hover:border-pink-500 hover:bg-pink-50
                transition
              "
            >
              <UploadCloud size={48} className="text-pink-500" />
              <p className="text-slate-600 font-medium">
                Click to browse or drag &amp; drop an image here
              </p>
              <p className="text-slate-400 text-sm">
                JPG, PNG — clear front-facing photo works best
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {loading && <p className="mt-6 text-blue-600 text-lg">Scanning...</p>}

      {errorMsg && !loading && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 w-[350px] text-center">
          {errorMsg}
        </div>
      )}

      {prediction && !loading && (
        <div className="mt-6 bg-white shadow-lg rounded-xl p-6 w-[350px] text-center">
          <h2 className="text-2xl font-bold text-green-600">Prediction</h2>
          <p className="text-xl mt-3 font-semibold">{prediction.disease}</p>
          <p className="text-slate-500 mt-1">
            Confidence: {prediction.confidence}%
          </p>
        </div>
      )}

      {image && (
        <div className="mt-6 flex flex-col items-center">
          <h3 className="font-semibold mb-2">
            {mode === "camera" ? "Captured Image" : "Uploaded Image"}
          </h3>

          <img
            src={image}
            alt="Face"
            className="rounded-xl shadow-lg w-60"
          />

          <button
            onClick={resetScan}
            className="mt-4 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
