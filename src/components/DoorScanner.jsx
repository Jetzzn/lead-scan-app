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
            <span>Switch Camera</span>
          </button>
          <button onClick={resetScanner}>
            <RotateCcw className="icon-small" />
            <span>Reset</span>
          </button>
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
            <span className="refresh-text">Refresh Stats</span>
          </button>
        </div>
        {recentScans.length > 0 && (
          <div className="recent-checkins">
            <h3>Recent Check-ins</h3>
            <ul>
              {recentScans.slice(0, 5).map((scan, idx) => (
                <li key={scan.id + idx}>
                  <span className="user-info">User: {scan.userId}</span>
                  <span className="door-info">{scan.doorName}</span>
                  <span className="time-info">
                    {new Date(scan.time).toLocaleTimeString()}
                  </span>
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
          padding: 20px;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .scanner-header p {
          color: #7f8c8d;
          margin-top: 10px;
        }

        .scanner-panel {
          background: #fff;
          padding: 25px;
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
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #ccd6dd;
          font-size: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: #f0f4f8;
          border-radius: 10px;
          padding: 15px;
          text-align: center;
        }

        .stat-card .number {
          font-size: 24px;
          font-weight: bold;
          color: #2ecc71;
        }

        .stat-card .label {
          color: #7f8c8d;
          font-size: 12px;
          margin-top: 5px;
        }

        .refresh-btn {
          background: #2980b9;
          color: #fff;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          min-height: 44px;
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
          font-size: 14px;
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
          padding: 12px 20px;
          background: #34495e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          min-height: 44px;
          flex: 1;
          justify-content: center;
        }

        .recent-checkins {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-top: 30px;
        }

        .recent-checkins h3 {
          margin-bottom: 15px;
          color: #2c3e50;
          font-size: 18px;
        }

        .recent-checkins ul {
          list-style: none;
          padding: 0;
        }

        .recent-checkins li {
          display: flex;
          flex-direction: column;
          padding: 12px 0;
          border-bottom: 1px solid #e0e4e8;
          font-size: 14px;
          gap: 4px;
        }

        .recent-checkins li:last-child {
          border-bottom: none;
        }

        .user-info {
          font-weight: bold;
          color: #2c3e50;
        }

        .door-info {
          color: #3498db;
        }

        .time-info {
          color: #7f8c8d;
          font-size: 12px;
        }

        .icon {
          width: 20px;
          height: 20px;
        }

        .icon-small {
          width: 16px;
          height: 16px;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .scanner-container {
            padding: 15px;
          }

          .scanner-header h1 {
            font-size: 24px;
          }

          .scanner-header p {
            font-size: 14px;
          }

          .scanner-panel {
            padding: 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .stat-card {
            padding: 12px;
          }

          .stat-card .number {
            font-size: 20px;
          }

          .stat-card .label {
            font-size: 11px;
          }

          .refresh-btn {
            grid-column: 1 / -1;
            padding: 10px;
          }

          .controls {
            flex-direction: column;
            gap: 10px;
          }

          .controls button {
            padding: 14px 20px;
            font-size: 16px;
          }

          .message {
            font-size: 13px;
            padding: 10px;
            text-align: left;
          }

          .recent-checkins {
            padding: 15px;
          }

          .recent-checkins h3 {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .scanner-container {
            padding: 10px;
          }

          .scanner-header h1 {
            font-size: 20px;
            flex-direction: column;
            gap: 5px;
          }

          .scanner-panel {
            padding: 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .stat-card {
            padding: 10px;
          }

          .door-select-area select {
            padding: 14px;
            font-size: 16px;
          }

          .controls button {
            padding: 16px 20px;
            font-size: 16px;
          }

          .refresh-text {
            display: none;
          }

          .controls button span {
            font-size: 14px;
          }

          .recent-checkins {
            padding: 12px;
          }

          .recent-checkins li {
            padding: 10px 0;
          }
        }

        @media (max-width: 360px) {
          .scanner-header h1 {
            font-size: 18px;
          }

          .scanner-panel {
            padding: 12px;
          }

          .controls button {
            padding: 14px 16px;
            font-size: 14px;
          }

          .controls button span {
            display: none;
          }

          .message {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}

export default DoorScanner;
