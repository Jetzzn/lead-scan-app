import React from "react";

const PopupDetail = ({ selectedUser, closePopup }) => {
  if (!selectedUser) return null;

  return (
    <div style={styles.popupOverlay} onClick={closePopup}>
      <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.popupHeader}>
          <h3 style={styles.popupTitle}>User Details</h3>
          <button onClick={closePopup} style={styles.closeButton}>
            ✕
          </button>
        </div>
        <div style={styles.popupVertical}>
          <div style={styles.popupSection}>
            <h4 style={styles.sectionHeader}>Personal Information</h4>
            <div style={styles.infoList}>
              <p>
                <strong>ID:</strong> {selectedUser.id || "-"}
              </p>
              <p>
                <strong>Name:</strong>{" "}
                {`${selectedUser["First name"] || "-"} ${
                  selectedUser["Last name"] || "-"
                }`}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser["Email"] || "-"}
              </p>
              <p>
                <strong>Gender:</strong> {selectedUser["Gender"] || "-"}
              </p>
              <p>
                <strong>Age:</strong> {selectedUser["Age"] || "-"}
              </p>
              <p>
                <strong>Scan Time:</strong>{" "}
                {selectedUser.scanTimestamp
                  ? new Date(selectedUser.scanTimestamp).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>
          <div style={styles.popupSection}>
            <h4 style={styles.sectionHeader}>Educational Background</h4>
            <div style={styles.infoList}>
              <p>
                <strong>Institution:</strong>{" "}
                {selectedUser["Name of institution"] || "-"}
              </p>
              <p>
                <strong>GPA:</strong> {selectedUser["GPA"] || "-"}
              </p>
              <p>
                <strong>Highest Education:</strong>{" "}
                {selectedUser["Your highest education level"] || "-"}
              </p>
            </div>
          </div>
          <div style={styles.popupSection}>
            <h4 style={styles.sectionHeader}>Study Abroad Plans</h4>
            <div style={styles.infoList}>
              <p>
                <strong>Year of Study Abroad:</strong>{" "}
                {selectedUser["Year of going to study abroad"] || "-"}
              </p>
              <p>
                <strong>Field of Study Interest:</strong>{" "}
                {selectedUser["Field of study"] || "-"}
              </p>
              <p>
                <strong>Level of Degree Interest:</strong>{" "}
                {selectedUser[
                  "Level of degree (หลักสูตรที่กำลังจะไปศึกษาต่อ)"
                ] || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popupContent: {
    backgroundColor: "#ffffff",
    padding: "20px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90%",
    overflow: "auto",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    borderRadius: "15px",
  },
  popupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "2px solid #3498db",
    paddingBottom: "10px",
  },
  popupTitle: {
    fontSize: "28px",
    color: "#2c3e50",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#7f8c8d",
    transition: "color 0.3s ease",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    width: "30px",
    height: "30px",
  },
  popupVertical: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  popupSection: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  },
  sectionHeader: {
    fontSize: "20px",
    marginBottom: "15px",
    color: "#3498db",
  },
  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};

export default PopupDetail;
