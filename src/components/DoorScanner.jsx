import React, { useState, useCallback, useEffect } from "react";
import QRScannerComponent from "./QRScannerComponent";
import {
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
  MapPin,
} from "lucide-react";

function DoorScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [key, setKey] = useState(0);
  const [facingMode, setFacingMode] = useState("environment");
  const [stats, setStats] = useState({
    totalCheckins: 0,
    todayCheckins: 0,
    doorStats: {},
  });
  const [recentScans, setRecentScans] = useState([]);
  const [selectedDoor, setSelectedDoor] = useState("");

  // รายการประตูที่สามารถเลือกได้
  const doorOptions = [
    { value: "Main Entrance", label: "Main Entrance" },
    { value: "Side Door A", label: "Side Door A" },
    { value: "Side Door B", label: "Side Door B" },
    { value: "Emergency Exit", label: "Emergency Exit" },
    { value: "VIP Entrance", label: "VIP Entrance" },
    { value: "Staff Entrance", label: "Staff Entrance" },
  ];

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
    setKey((prevKey) => prevKey + 1);
  }, []);

  const handleScan = useCallback(
    async (data) => {
      if (data && isScanning) {
        if (!selectedDoor) {
          setError("Please select a door first!");
          return;
        }

        setIsScanning(false);
        const scannedId = data.text;
        setScanResult(scannedId);

        try {
          const alreadyCheckedIn = await checkIfUserAlreadyCheckedIn(
            scannedId,
            selectedDoor
          );

          if (alreadyCheckedIn) {
            setError(
              `User ID ${scannedId} has already checked in at ${selectedDoor} on ${new Date(
                alreadyCheckedIn.checkInTime
              ).toLocaleString()}`
            );
            setTimeout(resetScanner, 3000);
            return;
          }

          await storeDoorScanData(scannedId, selectedDoor);

          setSuccess(
            `Check-in successful! User ID: ${scannedId} at ${selectedDoor}`
          );
          setError(null);

          setRecentScans((prev) => [
            {
              id: scannedId,
              userId: scannedId,
              doorName: selectedDoor,
              time: new Date().toISOString(),
            },
            ...prev.slice(0, 49), // Keep up to 50 records
          ]);

          setStats((prev) => ({
            ...prev,
            todayCheckins: prev.todayCheckins + 1,
            totalCheckins: prev.totalCheckins + 1,
            doorStats: {
              ...prev.doorStats,
              [selectedDoor]: (prev.doorStats[selectedDoor] || 0) + 1,
            },
          }));

          setTimeout(resetScanner, 3000);
        } catch (err) {
          console.error("Error processing door scan:", err);
          setError(`Failed to process check-in: ${err.message}`);
          setTimeout(resetScanner, 3000);
        }
      }
    },
    [isScanning, selectedDoor, resetScanner]
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
    <div className="scanner-container">
      <div className="scanner-header">
        <h1>
          <DoorOpen className="icon" />
          Door Check-In System
        </h1>
        <p>Scan QR Code at a selected door</p>
      </div>

      <div className="scanner-panel">
        <div className="door-select-area">
          <label>
            <MapPin className="icon-small" />
            Choose Door:
          </label>
          <select
            value={selectedDoor}
            onChange={(e) => setSelectedDoor(e.target.value)}
          >
            <option value="">-- Select --</option>
            {doorOptions.map((door) => (
              <option key={door.value} value={door.value}>
                {door.label}
              </option>
            ))}
          </select>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="number">{stats.todayCheckins}</div>
            <div className="label">Today's Check-ins</div>
          </div>
          <div className="stat-card">
            <div className="number">{stats.totalCheckins}</div>
            <div className="label">Total Check-ins</div>
          </div>
          <div className="stat-card">
            <div className="number">{stats.uniqueUsers}</div>
            <div className="label">Unique Users</div>
          </div>
          <button className="refresh-btn" onClick={refreshStats}>
            <RefreshCcw className="icon-small" />
            Refresh Stats
          </button>
        </div>

        <div className="scanner-area">
          <QRScannerComponent
            key={key}
            delay={500}
            onError={handleError}
            onScan={handleScan}
            facingMode={facingMode}
          />

          {error && (
            <div className="message error">
              <XCircle /> {error}
            </div>
          )}
          {success && (
            <div className="message success">
              <CheckCircle /> {success}
              <p>{new Date().toLocaleString()}</p>
            </div>
          )}
          {scanResult && !error && !success && (
            <div className="message processing">
              <LoaderCircle className="spin" />
              Processing: {scanResult}
            </div>
          )}
        </div>

        <div className="controls">
          <button onClick={toggleCamera}>
            <Camera className="icon-small" />
            Switch Camera
          </button>
          <button onClick={resetScanner}>
            <RotateCcw className="icon-small" />
            Reset
          </button>
        </div>

        {recentScans.length > 0 && (
          <div className="recent-checkins">
            <h3>Recent Check-ins</h3>
            <ul>
              {recentScans.slice(0, 5).map((scan, idx) => (
                <li key={scan.id + idx}>
                  <span>User: {scan.userId}</span>
                  <span>{scan.doorName}</span>
                  <span>{new Date(scan.time).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CSS in JS */}
      <style>{`
        .scanner-container {
          font-family: 'Segoe UI', sans-serif;
          padding: 30px;
          background: #f9fbfc;
          min-height: 100vh;
        }

        .scanner-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .scanner-header h1 {
          font-size: 32px;
          color: #2c3e50;
        }

        .scanner-header p {
          color: #7f8c8d;
        }

        .scanner-panel {
          background: #fff;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          max-width: 800px;
          margin: auto;
        }

        .door-select-area {
          margin-bottom: 20px;
        }

        .door-select-area label {
          font-weight: bold;
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          color: #34495e;
        }

        .door-select-area select {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccd6dd;
        }

        .stats-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 25px;
          align-items: center;
        }

        .stat-card {
          background: #f0f4f8;
          border-radius: 10px;
          padding: 15px 20px;
          flex: 1;
          min-width: 150px;
          text-align: center;
        }

        .stat-card .number {
          font-size: 28px;
          font-weight: bold;
          color: #2ecc71;
        }

        .stat-card .label {
          color: #7f8c8d;
          font-size: 13px;
        }

        .refresh-btn {
          background: #2980b9;
          color: #fff;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .scanner-area {
          text-align: center;
          margin-bottom: 25px;
        }

        .message {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 500;
        }

        .message.success {
          background: #eafaf1;
          color: #27ae60;
        }

        .message.error {
          background: #fdecea;
          color: #c0392b;
        }

        .message.processing {
          background: #fff6e3;
          color: #f39c12;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .controls button {
          padding: 10px 20px;
          background: #34495e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .recent-checkins {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-top: 30px;
        }

        .recent-checkins h3 {
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .recent-checkins ul {
          list-style: none;
          padding: 0;
        }

        .recent-checkins li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e4e8;
          font-size: 14px;
        }

        .icon {
          vertical-align: middle;
          margin-right: 8px;
        }

        .icon-small {
          vertical-align: middle;
          margin-right: 6px;
        }

        @media (max-width: 600px) {
          .stats-grid {
            flex-direction: column;
          }

          .controls {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default DoorScanner;
