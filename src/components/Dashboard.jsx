import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OCSC International Education Expo 2024</h1>
      <h2 style={styles.subtitle}>Event Check-In System</h2>
      <div style={styles.buttonContainer}>
        <button
          onClick={() => navigate("/scanner")}
          style={styles.button}
          aria-label="Scan QR Code"
        >
          📱
        </button>
        <button
          onClick={() => navigate("/download")}
          style={styles.button}
          aria-label="Download List"
        >
          💾
        </button>
      </div>
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
    borderRadius: "15px",
    marginTop: "20px",
    textAlign: "center",
  },
  title: {
    fontSize: "clamp(24px, 5vw, 32px)",
    color: "#2c3e50",
    marginBottom: "20px",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: "clamp(16px, 2vw, 18px)",
    color: "#2c3e50",
    marginBottom: "40px",
    fontWeight: "600",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(20px, 4vw, 40px)",
    margin: "0 auto",
    flexWrap: "wrap",
  },
  button: {
    width: "clamp(100px, 20vw, 150px)",
    height: "clamp(100px, 20vw, 150px)",
    fontSize: "clamp(24px, 5vw, 48px)",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "clamp(10px, 2vw, 20px)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
};

export default Dashboard;
