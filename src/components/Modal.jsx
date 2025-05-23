import React from "react";

const Modal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.heading}>Scanned User Data</h3>
        <div style={styles.content}>
          <div style={styles.field}>
            <span style={styles.label}>ID:</span>
            <span style={styles.value}>{user.id}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>First Name:</span>
            <span style={styles.value}>{user["First name"]}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Last Name:</span>
            <span style={styles.value}>{user["Last name"]}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Email:</span>
            <span style={styles.value}>{user.Email}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Phone:</span>
            <span style={styles.value}>{user["Phone Number"]}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Organization:</span>
            <span style={styles.value}>In2it</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Scanned At:</span>
            <span style={styles.value}>{new Date().toLocaleString()}</span>
          </div>
        </div>
        <div style={styles.successMessage}>
          <span style={styles.checkIcon}>✓</span> Scan Successful
        </div>
        <button onClick={onClose} style={styles.closeButton}>
          Continue Scanning
        </button>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    width: "90%",
    maxWidth: "400px",
    padding: "30px",
    textAlign: "left",
  },
  heading: {
    color: "#2c3e50",
    fontSize: "24px",
    marginBottom: "20px",
    textAlign: "center",
    fontWeight: 600,
  },
  content: {
    marginBottom: "25px",
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
  },
  field: {
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#7f8c8d",
    fontSize: "16px",
    fontWeight: 600,
  },
  value: {
    color: "#34495e",
    fontSize: "16px",
  },
  successMessage: {
    backgroundColor: "#e8f4ff",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    marginBottom: "20px",
    color: "#28a745",
    fontWeight: "bold",
    fontSize: "18px",
  },
  checkIcon: {
    marginRight: "8px",
    fontSize: "20px",
  },
  closeButton: {
    width: "100%",
    padding: "12px 15px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    transition: "background-color 0.3s ease",
  },
};

export default Modal;
