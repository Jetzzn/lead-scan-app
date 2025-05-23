import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import QRScannerComponent from "./QRScannerComponent";
import {
  getUserById,
  storeUserScanData,
  getUserScanData,
} from "../utils/airtableUtils";
import Modal from "./Modal";

function Scanner({ username }) {
  const [scanResult, setScanResult] = useState(null);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [key, setKey] = useState(0);
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState("environment");

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadUserData();
  }, [username, navigate]);

  const loadUserData = async () => {
    try {
      const data = await getUserScanData(username);
      setUserData(data);
    } catch (error) {
      console.error("Error loading user data:", error);
      setError("Failed to load user data. Please try again.");
    }
  };

  const resetScanner = useCallback(() => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);
    setKey((prevKey) => prevKey + 1);
  }, []);

  const handleScan = useCallback(
    async (data) => {
      if (data && isScanning) {
        setIsScanning(false);
        const scannedId = data.text;
        setScanResult(scannedId);

        try {
          console.log(`Scanning QR code with ID: ${scannedId}`);
          const user = await getUserById(scannedId);

          // Try to store the scan data (this will check for duplicates)
          await storeUserScanData(username, user);

          // If successful, update the local data
          setUserData((prevData) => [
            {
              id: user.id,
              "First name": user["First name"],
              "Last name": user["Last name"],
              Email: user.Email,
              "Phone Number": user["Phone Number"],
              scanTimestamp: new Date().toISOString(),
            },
            ...prevData,
          ]);

          setError(null);
          setModalUser(user);
          setIsModalOpen(true);

          setTimeout(resetScanner, 3000);
        } catch (err) {
          console.error("Error fetching user data:", err);

          // Check if it's a duplicate scan error
          if (err.message.includes("already been scanned today")) {
            setError(`⚠️ ${err.message}`);
          } else {
            setError(`Failed to fetch user data: ${err.message}`);
          }

          setTimeout(resetScanner, 5000); // Longer timeout for error messages
        }
      }
    },
    [isScanning, username, resetScanner]
  );

  const handleError = useCallback(
    (err) => {
      console.error(err);
      setError("Error scanning QR code. Please try again.");
      setTimeout(resetScanner, 3000);
    },
    [resetScanner]
  );

  const toggleCamera = () => {
    setFacingMode((prevMode) =>
      prevMode === "environment" ? "user" : "environment"
    );
    setKey((prevKey) => prevKey + 1);
  };

  const goToDownloadList = () => {
    navigate("/download");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalUser(null);
    resetScanner();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>QR Code Scanner</h2>
      {username ? (
        <>
          <div style={styles.scannerContainer}>
            <QRScannerComponent
              key={key}
              delay={300}
              onError={handleError}
              onScan={handleScan}
              facingMode={facingMode}
            />
          </div>
          {error && (
            <p
              style={{
                ...styles.errorMessage,
                backgroundColor: error.includes("already been scanned")
                  ? "#fff3cd"
                  : "#f8d7da",
                color: error.includes("already been scanned")
                  ? "#856404"
                  : "#721c24",
                border: `1px solid ${
                  error.includes("already been scanned") ? "#ffeaa7" : "#f5c6cb"
                }`,
                borderRadius: "5px",
                padding: "10px",
                margin: "10px 0",
              }}
            >
              {error}
            </p>
          )}
          {scanResult && (
            <p style={styles.scanResult}>Last Scanned QR Code: {scanResult}</p>
          )}

          <div style={styles.buttonContainer}>
            <button onClick={goToDownloadList} style={styles.button}>
              Go to Download List
            </button>
            <button onClick={toggleCamera} style={styles.button}>
              Switch Camera
            </button>
          </div>

          {userData.length > 0 && (
            <div style={styles.scannedDataContainer}>
              <h3 style={styles.scannedDataHeading}>Scanned User Data:</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>ID</th>
                      <th style={styles.tableHeader}>First Name</th>
                      <th style={styles.tableHeader}>Last Name</th>
                      <th style={styles.tableHeader}>Email</th>
                      <th style={styles.tableHeader}>Organization</th>
                      <th style={styles.tableHeader}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.map((user, index) => (
                      <tr
                        key={index}
                        style={
                          index % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd
                        }
                      >
                        <td style={styles.tableCell}>{user.id}</td>
                        <td style={styles.tableCell}>{user["First name"]}</td>
                        <td style={styles.tableCell}>{user["Last name"]}</td>
                        <td style={styles.tableCell}>{user["Email"]}</td>
                        <td style={styles.tableCell}>In2it</td>
                        <td style={styles.tableCell}>
                          {new Date(user.scanTimestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p style={styles.loginMessage}>Please log in to use the scanner.</p>
      )}

      {isModalOpen && modalUser && (
        <Modal user={modalUser} onClose={closeModal} />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "clamp(20px, 5vw, 100px)",
    maxWidth: "1010px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    marginTop: "20px",
  },
  heading: {
    fontSize: "clamp(24px, 5vw, 32px)",
    color: "#2c3e50",
    marginBottom: "3vh",
    textAlign: "center",
    fontWeight: "600",
  },
  scannerContainer: {
    width: "100%",
    maxWidth: "500px",
    aspectRatio: "1 / 1",
    margin: "0 auto 3vh",
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginBottom: "2vh",
    fontSize: "clamp(14px, 2.5vw, 16px)",
  },
  scanResult: {
    textAlign: "center",
    marginBottom: "2vh",
    fontSize: "clamp(14px, 2.5vw, 16px)",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "3vh",
    gap: "2vh",
    flexWrap: "wrap",
  },
  button: {
    flex: "1 1 auto",
    padding: "12px 25px",
    fontSize: "clamp(14px, 2.5vw, 16px)",
    backgroundColor: "#3498db",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
  },
  scannedDataContainer: {
    marginTop: "3vh",
  },
  scannedDataHeading: {
    fontSize: "clamp(18px, 4vw, 22px)",
    textAlign: "center",
    marginBottom: "2vh",
  },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    marginBottom: "4vh",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    textAlign: "left",
    backgroundColor: "#ffffff",
    fontSize: "clamp(12px, 4vw, 14px)",
  },
  tableHeader: {
    backgroundColor: "#3498db",
    color: "#ffffff",
    padding: "15px 20px",
    fontSize: "clamp(14px, 2.5vw, 16px)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    whiteSpace: "nowrap",
  },
  tableRowEven: {
    backgroundColor: "#f8f9fa",
  },
  tableRowOdd: {
    backgroundColor: "#ffffff",
  },
  tableCell: {
    padding: "15px 20px",
    borderBottom: "1px solid #ecf0f1",
    fontSize: "clamp(12px, 2vw, 14px)",
    color: "#34495e",
    whiteSpace: "nowrap",
  },
  loginMessage: {
    textAlign: "center",
    fontSize: "clamp(16px, 3vw, 18px)",
    color: "#7f8c8d",
  },
};

export default Scanner;
