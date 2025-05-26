import React from "react";

const Banner = () => {
  return (
    <div style={styles.bannerContainer}>
      <div style={styles.bannerContent}>
        <h2 style={styles.bannerTitle}>Title</h2>
        <p style={styles.bannerSubtitle}>Subtitle</p>
      </div>
    </div>
  );
};

const styles = {
  bannerContainer: {
    width: "100%",
    height: "160px",
    backgroundColor: "#FFD300",
    padding: "20px 0",
    textAlign: "center",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  bannerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  bannerTitle: {
    fontSize: "clamp(24px, 4vw, 36px)",
    color: "#2c3e50",
    margin: "0 0 10px 0",
    fontWeight: "bold",
    fontSize: "48px",
  },
  bannerSubtitle: {
    fontSize: "clamp(14px, 2vw, 18px)",
    color: "#34495e",
    margin: 0,
  },
};

export default Banner;
