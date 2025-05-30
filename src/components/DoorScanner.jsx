import React, { useState, useCallback, useEffect } from "react";
import QRScannerComponent from "./QRScannerComponent";
import {
  getUserById,
  storeDoorScanData,
  checkIfUserAlreadyCheckedIn,
  getDoorScanStats,
} from "../utils/airtableUtils";
import {
  DoorOpen,
  RefreshCcw,
  Camera,
  RotateCcw,
  CheckCircle,
  XCircle,
  LoaderCircle,
} from "lucide-react";

function DoorScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scannedUser, setScannedUser] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [key, setKey] = useState(0);
  const [facingMode, setFacingMode] = useState("environment");
  const [stats, setStats] = useState({ totalCheckins: 0, todayCheckins: 0 });
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getDoorScanStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const resetScanner = useCallback(() => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);
    setSuccess(null);
    setScannedUser(null);
    setKey((prevKey) => prevKey + 1);
  }, []);

  const handleScan = useCallback(
    async (data) => {
      if (data && isScanning) {
        setIsScanning(false);
        const scannedId = data.text;
        setScanResult(scannedId);

        try {
          const alreadyCheckedIn = await checkIfUserAlreadyCheckedIn(scannedId);

          if (alreadyCheckedIn) {
            setError(
              `This person has already checked in at ${new Date(
                alreadyCheckedIn.checkInTime
              ).toLocaleString()}`
            );
            setTimeout(resetScanner, 3000);
            return;
          }

          const user = await getUserById(scannedId);
          await storeDoorScanData(user);

          setScannedUser(user);
          setSuccess(`Welcome ${user["First name"]} ${user["Last name"]}!`);
          setError(null);

          setRecentScans((prev) => [
            {
              id: user.id,
              name: `${user["First name"]} ${user["Last name"]}`,
              email: user.Email,
              time: new Date().toISOString(),
            },
            ...prev.slice(0, 4),
          ]);

          setStats((prev) => ({
            ...prev,
            todayCheckins: prev.todayCheckins + 1,
            totalCheckins: prev.totalCheckins + 1,
          }));

          setTimeout(resetScanner, 3000);
        } catch (err) {
          console.error("Error processing door scan:", err);
          setError(`Failed to process check-in: ${err.message}`);
          setTimeout(resetScanner, 3000);
        }
      }
    },
    [isScanning, resetScanner]
  );

  const handleError = useCallback((err) => {
    console.error(err);
    setError("Error scanning QR code. Please try again.");
    setTimeout(() => setError(null), 3000);
  }, []);

  const toggleCamera = () => {
    setFacingMode((prevMode) =>
      prevMode === "environment" ? "user" : "environment"
    );
    setKey((prevKey) => prevKey + 1);
  };

  const refreshStats = () => {
    loadStats();
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">
          <DoorOpen
            size={28}
            style={{ verticalAlign: "middle", marginRight: 8 }}
          />
          Door Check-In System
        </h1>
        <p className="subtitle">Scan QR code to check in to the event</p>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-number">{stats.todayCheckins}</div>
          <div className="stat-label">Today's Check-ins</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.totalCheckins}</div>
          <div className="stat-label">Total Check-ins</div>
        </div>
        <button className="button" onClick={refreshStats}>
          <RefreshCcw
            size={18}
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
          Refresh
        </button>
      </div>

      <div className="scanner">
        <QRScannerComponent
          key={key}
          delay={500}
          onError={handleError}
          onScan={handleScan}
          facingMode={facingMode}
        />

        {error && (
          <div className="error">
            <XCircle
              size={16}
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            {error}
          </div>
        )}
        {success && (
          <div className="success">
            <CheckCircle
              size={16}
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />{" "}
            {success}
            {scannedUser && (
              <div className="user-info">
                <p>
                  <strong>Name:</strong> {scannedUser["First name"]}{" "}
                  {scannedUser["Last name"]}
                </p>
                <p>
                  <strong>Email:</strong> {scannedUser.Email}
                </p>
                <p>
                  <strong>Organization:</strong>{" "}
                  {scannedUser["Organization"] || "N/A"}
                </p>
                <p>
                  <strong>Check-in Time:</strong> {new Date().toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
        {scanResult && !error && !success && (
          <div className="processing">
            <LoaderCircle
              size={16}
              className="spin"
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />{" "}
            Processing: {scanResult}
          </div>
        )}
      </div>

      <div className="controls">
        <button className="button" onClick={toggleCamera}>
          <Camera
            size={18}
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
          Switch Camera ({facingMode === "environment" ? "Back" : "Front"})
        </button>

        <button className="button" onClick={resetScanner}>
          <RotateCcw
            size={18}
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
          Reset Scanner
        </button>
      </div>

      {recentScans.length > 0 && (
        <div className="recent">
          <h3>Recent Check-ins</h3>
          {recentScans.map((scan, index) => (
            <div key={scan.id + index} className="recent-item">
              <div>
                <div className="recent-name">{scan.name}</div>
                <div className="recent-email">{scan.email}</div>
              </div>
              <div className="recent-time">
                {new Date(scan.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Position the QR code within the camera frame</li>
          <li>Wait for the scan to complete</li>
          <li>Each person can only check in once</li>
          <li>Contact support if you have any issues</li>
        </ul>
      </div>

      <style>{`
        .container {
          font-family: 'Segoe UI', sans-serif;
          background: #f4f6f8;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: white;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .title {
          font-size: 32px;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        .subtitle {
          font-size: 18px;
          color: #7f8c8d;
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .stat {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          min-width: 120px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #27ae60;
        }
        .stat-label {
          font-size: 12px;
          color: #7f8c8d;
        }
        .scanner {
          max-width: 500px;
          margin: auto;
          text-align: center;
        }
        .error {
          color: #e74c3c;
          background: #fdecea;
          padding: 10px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .success {
          color: #2ecc71;
          background: #eafaf1;
          padding: 10px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .processing {
          color: #f39c12;
          background: #fff3cd;
          padding: 10px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .user-info {
          margin-top: 10px;
          font-size: 14px;
        }
        .controls {
          text-align: center;
          margin: 20px 0;
        }
        .button {
          background: #3498db;
          color: white;
          padding: 10px 20px;
          margin: 5px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .recent {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-top: 30px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        .recent-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #ecf0f1;
        }
        .recent-name {
          font-weight: 600;
          color: #2c3e50;
        }
        .recent-email {
          font-size: 13px;
          color: #7f8c8d;
        }
        .recent-time {
          font-size: 13px;
          color: #2980b9;
        }
        .instructions {
          background: white;
          padding: 20px;
          border-radius: 12px;
          max-width: 600px;
          margin: 30px auto;
        }
        .instructions ul {
          padding-left: 20px;
        }
        .instructions li {
          font-size: 14px;
          margin-bottom: 6px;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
  }
      `}</style>
    </div>
  );
}

export default DoorScanner;
