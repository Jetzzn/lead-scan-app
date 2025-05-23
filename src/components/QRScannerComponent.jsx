import React, { useRef, useEffect, useState } from "react";
import QrScanner from "qr-scanner";

const QRScannerComponent = ({
  onScan,
  onError,
  delay = 500,
  facingMode = "environment",
}) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const lastScanTime = useRef(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const startScanner = async () => {
      try {
        // Create scanner instance
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const now = Date.now();
            if (now - lastScanTime.current > delay) {
              lastScanTime.current = now;
              if (onScan) {
                onScan({ text: result.data });
              }
            }
          },
          {
            onDecodeError: (error) => {
              // Silent error handling for continuous scanning
              console.debug("QR decode error:", error);
            },
            preferredCamera: facingMode,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 2,
          }
        );

        // Start scanning
        await scannerRef.current.start();
        setIsActive(true);
      } catch (error) {
        console.error("Error starting QR scanner:", error);
        if (onError) {
          onError(error);
        }
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [facingMode, delay, onScan, onError]);

  // Stop/start scanner when component active state changes
  useEffect(() => {
    if (scannerRef.current) {
      if (isActive) {
        scannerRef.current.start().catch(console.error);
      } else {
        scannerRef.current.stop();
      }
    }
  }, [isActive]);

  const handleVideoClick = () => {
    if (scannerRef.current) {
      setIsActive(!isActive);
    }
  };

  return (
    <div style={styles.container}>
      <video
        ref={videoRef}
        style={styles.video}
        onClick={handleVideoClick}
        playsInline
        muted
      />
      <div style={styles.overlay}>
        <div style={styles.scanArea}>
          <div style={{ ...styles.corner, ...styles.cornerTopLeft }} />
          <div style={{ ...styles.corner, ...styles.cornerTopRight }} />
          <div style={{ ...styles.corner, ...styles.cornerBottomLeft }} />
          <div style={{ ...styles.corner, ...styles.cornerBottomRight }} />
        </div>
        <div style={styles.instructions}>
          {isActive
            ? "Position QR code within the frame"
            : "Tap to resume scanning"}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    cursor: "pointer",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  scanArea: {
    position: "relative",
    width: "250px",
    height: "250px",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "10px",
  },
  corner: {
    position: "absolute",
    width: "20px",
    height: "20px",
    border: "3px solid #00ff00",
  },
  cornerTopLeft: {
    top: "-3px",
    left: "-3px",
    borderRight: "none",
    borderBottom: "none",
  },
  cornerTopRight: {
    top: "-3px",
    right: "-3px",
    borderLeft: "none",
    borderBottom: "none",
  },
  cornerBottomLeft: {
    bottom: "-3px",
    left: "-3px",
    borderRight: "none",
    borderTop: "none",
  },
  cornerBottomRight: {
    bottom: "-3px",
    right: "-3px",
    borderLeft: "none",
    borderTop: "none",
  },
  instructions: {
    marginTop: "20px",
    color: "white",
    fontSize: "16px",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "10px 20px",
    borderRadius: "20px",
  },
};

export default QRScannerComponent;
