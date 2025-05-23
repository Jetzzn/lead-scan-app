import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Scanner from "./components/Scanner";
import DownloadList from "./components/DownloadList";
import Navbar from "./components/Navbar";
import Banner from "./components/Banner";
import { getUserProfile } from "./utils/airtableUtils";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedLoginStatus = sessionStorage.getItem("isLoggedIn");
    const storedUserData = sessionStorage.getItem("userData");

    if (storedLoginStatus === "true" && storedUserData) {
      const userData = JSON.parse(storedUserData);
      setIsLoggedIn(true);
      setUserData(userData);
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isLoggedIn && userData?.username) {
        try {
          const profile = await getUserProfile(userData.username);
          setUserData((prevData) => ({ ...prevData, ...profile }));
          sessionStorage.setItem(
            "userData",
            JSON.stringify({ ...userData, ...profile })
          );
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [isLoggedIn, userData?.username]);

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUserData(user);
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("userData", JSON.stringify(user));
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setUserData(null);
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userData");
  };

  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <div style={styles.app}>
        {isLoggedIn && (
          <>
            <Navbar userData={userData} onLogout={handleLogout} />
            <Banner />
          </>
        )}
        <div style={styles.container}>
          <Routes>
            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scanner"
              element={
                <ProtectedRoute>
                  <Scanner username={userData?.username} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/download"
              element={
                <ProtectedRoute>
                  <DownloadList username={userData?.username} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const styles = {
  app: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "100%",
    margin: "0 auto",
    padding: "0",
    boxSizing: "border-box",
    minHeight: "100vh",
    backgroundColor: "#508bc9",
  },
  container: {
    width: "100%",
    padding: "0 20px",
    boxSizing: "border-box",
  },
};

export default App;
