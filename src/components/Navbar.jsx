import React from "react";

function Navbar({ userData, onLogout }) {
  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        <h1 style={styles.title}>Lead Scanner</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>
            Welcome, {userData?.username || "User"}
          </span>
          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#2c3e50",
    padding: "1rem 0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  navContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    flexWrap: "wrap",
  },
  title: {
    color: "white",
    margin: 0,
    fontSize: "clamp(18px, 4vw, 24px)",
    fontWeight: "600",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },
  username: {
    color: "white",
    fontSize: "clamp(14px, 3vw, 16px)",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background-color 0.3s ease",
    fontWeight: "500",
  },
};

export default Navbar;
