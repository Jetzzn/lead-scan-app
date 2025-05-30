import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserScanData,
  clearUserData,
  getUserDetailedData,
} from "../utils/airtableUtils";
import PopupDetail from "./PopupDetail";

function DownloadList({ username }) {
  const [userData, setUserData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    loadData();
  }, [username, navigate]);

  const loadData = async () => {
    if (username) {
      try {
        setLoading(true);
        const data = await getUserScanData(username);
        console.log("Loaded data:", data);
        setUserData(data);
      } catch (error) {
        console.error("Error loading data:", error);
        alert("Failed to load scanned data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    if (userData.length === 0) return;

    try {
      setLoading(true);

      const detailedDataPromises = userData.map((user) =>
        getUserDetailedData(user.id)
      );
      const detailedUsers = await Promise.all(detailedDataPromises);

      const headers = [
        "ID",
        "First name",
        "Last name",
        "Email",
        "Phone Number",
        "Organization",
        "Scan Time",
      ];

      let csvContent = "\uFEFF";
      csvContent += headers.join(",") + "\n";

      detailedUsers.forEach((user, index) => {
        const scanTime = userData[index].scanTimestamp;
        const row = [
          user.id,
          escapeCsvValue(user["First name"] || ""),
          escapeCsvValue(user["Last name"] || ""),
          escapeCsvValue(user["Email"] || ""),
          escapeCsvValue(user["Phone Number"] || ""),
          escapeCsvValue(user["Organization"] || ""), // Added Organization field
          escapeCsvValue(new Date(scanTime).toLocaleString()),
        ];
        csvContent += row.join(",") + "\n";
      });

      function escapeCsvValue(value) {
        if (value === null || value === undefined) return '""';
        return '"' + String(value).replace(/"/g, '""') + '"';
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const date = new Date().toISOString().slice(0, 10);
        link.setAttribute(
          "download",
          `in2it_expo_leads_${username}_${date}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating detailed CSV:", error);
      alert("Failed to generate detailed CSV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to clear all scanned data?")) {
      try {
        await clearUserData(username);
        setUserData([]);
        alert("All your scanned data has been cleared.");
      } catch (error) {
        console.error("Error clearing data:", error);
        alert("Failed to clear data. Please try again.");
      }
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = userData.filter((user) =>
    Object.values(user).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowClick = async (userId, scanTimestamp) => {
    try {
      setLoading(true);
      const detailedData = await getUserDetailedData(userId);
      setSelectedUser({ ...detailedData, scanTimestamp });
      setShowPopup(true);
    } catch (error) {
      console.error("Error fetching detailed user data:", error);
      alert("Failed to load detailed user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser(null);
  };

  const goToScanner = () => {
    navigate("/scanner");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Your Scanned QR Code Data</h2>
      {username ? (
        <>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.buttonContainer}>
            <button onClick={goToScanner} style={styles.scannerButton}>
              Back to Scanner
            </button>
            {filteredData.length > 0 && (
              <>
                <button onClick={handleDownload} style={styles.downloadButton}>
                  Download CSV
                </button>
                <button onClick={clearAllData} style={styles.clearButton}>
                  Clear All Data
                </button>
              </>
            )}
          </div>

          {loading ? (
            <p style={styles.loadingMessage}>Loading...</p>
          ) : paginatedData.length > 0 ? (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>ID</th>
                      <th style={styles.tableHeader}>First Name</th>
                      <th style={styles.tableHeader}>Last Name</th>
                      <th style={styles.tableHeader}>Email</th>
                      <th style={styles.tableHeader}>Phone</th>
                      <th style={styles.tableHeader}>Organization</th>
                      <th style={styles.tableHeader}>Scan Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((user, index) => (
                      <tr
                        key={user.id}
                        style={{
                          ...(index % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd),
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          handleRowClick(user.id, user.scanTimestamp)
                        }
                      >
                        <td style={styles.tableCell}>{user.id}</td>
                        <td style={styles.tableCell}>{user["First name"]}</td>
                        <td style={styles.tableCell}>{user["Last name"]}</td>
                        <td style={styles.tableCell}>{user["Email"]}</td>
                        <td style={styles.tableCell}>{user["Phone Number"]}</td>
                        <td style={styles.tableCell}>{user["Organization"]}</td>
                        <td style={styles.tableCell}>
                          {new Date(user.scanTimestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={styles.paginationContainer}>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === page
                          ? styles.activePaginationButton
                          : {}),
                      }}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              {showPopup && selectedUser && (
                <PopupDetail
                  selectedUser={selectedUser}
                  closePopup={closePopup}
                />
              )}
            </>
          ) : (
            <p style={styles.noDataMessage}>
              No scanned data available or no matches found for your search.
            </p>
          )}
        </>
      ) : (
        <p style={styles.loginMessage}>
          Please log in to view your scanned data.
        </p>
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
    marginBottom: "4vh",
    textAlign: "center",
    fontWeight: "600",
  },
  searchContainer: {
    position: "relative",
    marginBottom: "4vh",
    width: "100%",
  },
  searchInput: {
    width: "97%",
    padding: "12px 20px",
    borderRadius: "25px",
    border: "1px solid #bdc3c7",
    fontSize: "clamp(14px, 4vw, 16px)",
    backgroundColor: "#f5f5f5",
    transition: "all 0.3s ease",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "20px",
    gap: "15px",
    flexWrap: "wrap",
  },
  scannerButton: {
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
  downloadButton: {
    padding: "12px 25px",
    fontSize: "clamp(14px, 2.5vw, 16px)",
    backgroundColor: "#4BD1A0",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
  },
  clearButton: {
    padding: "12px 25px",
    fontSize: "clamp(14px, 2.5vw, 16px)",
    backgroundColor: "#FF4040",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
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
  loadingMessage: {
    textAlign: "center",
    fontSize: "clamp(16px, 3vw, 18px)",
    color: "#7f8c8d",
  },
  noDataMessage: {
    textAlign: "center",
    fontSize: "clamp(16px, 3vw, 18px)",
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  loginMessage: {
    textAlign: "center",
    fontSize: "clamp(16px, 3vw, 18px)",
    color: "#7f8c8d",
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  paginationButton: {
    padding: "8px 12px",
    border: "1px solid #3498db",
    backgroundColor: "white",
    color: "#3498db",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "all 0.3s ease",
  },
  activePaginationButton: {
    backgroundColor: "#3498db",
    color: "white",
  },
};

export default DownloadList;
