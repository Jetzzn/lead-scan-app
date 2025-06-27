import React from "react";
import { FileText, ArrowLeft, Download, Users, Clock } from "lucide-react";

function CheckInReport({ recentScans, onBack }) {
  const exportToCSV = () => {
    if (recentScans.length === 0) return;

    const headers = ["#", "Name", "Email", "Organization", "Check-in Time"];
    const csvData = [
      headers.join(","),
      ...recentScans.map((scan, index) =>
        [
          index + 1,
          `"${scan.name}"`,
          `"${scan.email}"`,
          `"${scan.organization}"`,
          `"${new Date(scan.time).toLocaleString()}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `check-in-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStats = () => {
    if (recentScans.length === 0)
      return { total: 0, organizations: 0, lastCheckIn: null };

    const uniqueOrgs = new Set(
      recentScans
        .map((scan) => scan.organization)
        .filter((org) => org !== "N/A")
    );
    const lastCheckIn = recentScans.length > 0 ? recentScans[0] : null;

    return {
      total: recentScans.length,
      organizations: uniqueOrgs.size,
      lastCheckIn,
    };
  };

  const stats = getStats();

  return (
    <div className="report-container">
      <div className="report-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft
            size={20}
            style={{ verticalAlign: "middle", marginRight: 8 }}
          />
          Back to Scanner
        </button>

        <h1 className="report-main-title">
          <FileText
            size={28}
            style={{ verticalAlign: "middle", marginRight: 12 }}
          />
          Check-in Report
        </h1>

        <div className="report-stats">
          <div className="report-stat-card">
            <Users size={24} className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Check-ins</div>
            </div>
          </div>

          <div className="report-stat-card">
            <FileText size={24} className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">{stats.organizations}</div>
              <div className="stat-label">Organizations</div>
            </div>
          </div>

          {stats.lastCheckIn && (
            <div className="report-stat-card">
              <Clock size={24} className="stat-icon" />
              <div className="stat-content">
                <div className="stat-number">
                  {new Date(stats.lastCheckIn.time).toLocaleTimeString()}
                </div>
                <div className="stat-label">Last Check-in</div>
              </div>
            </div>
          )}
        </div>

        {recentScans.length > 0 && (
          <button className="export-button" onClick={exportToCSV}>
            <Download
              size={18}
              style={{ verticalAlign: "middle", marginRight: 8 }}
            />
            Export to CSV
          </button>
        )}
      </div>

      <div className="report-content">
        {recentScans.length > 0 ? (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Organization</th>
                  <th>Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan, index) => (
                  <tr key={scan.id + index}>
                    <td className="number-cell">{index + 1}</td>
                    <td className="name-cell">{scan.name}</td>
                    <td className="email-cell">{scan.email}</td>
                    <td className="org-cell">{scan.organization}</td>
                    <td className="time-cell">
                      {new Date(scan.time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <FileText size={48} className="no-data-icon" />
            <h3>No Check-ins Yet</h3>
            <p>Start scanning QR codes to see the check-in report here.</p>
          </div>
        )}
      </div>

      <style>{`
        .report-container {
          font-family: 'Segoe UI', sans-serif;
          background: #f4f6f8;
          min-height: 100vh;
          padding: 20px;
        }
        
        .report-header {
          background: white;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .back-button {
          background: #6c757d;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }
        
        .back-button:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }
        
        .report-main-title {
          font-size: 32px;
          margin-bottom: 30px;
          color: #2c3e50;
          text-align: center;
        }
        
        .report-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .report-stat-card {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          min-width: 160px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          margin-right: 15px;
          opacity: 0.8;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 12px;
          opacity: 0.9;
        }
        
        .export-button {
          display: block;
          margin: 0 auto;
          background: #28a745;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .export-button:hover {
          background: #218838;
          transform: translateY(-1px);
        }
        
        .report-content {
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .report-table th {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .report-table th:first-child {
          width: 60px;
          text-align: center;
        }
        
        .report-table td {
          padding: 12px;
          border-bottom: 1px solid #ecf0f1;
          font-size: 14px;
        }
        
        .report-table tr:hover {
          background: #f8f9fa;
        }
        
        .report-table tr:nth-child(even) {
          background: #fafbfc;
        }
        
        .report-table tr:nth-child(even):hover {
          background: #f1f3f4;
        }
        
        .number-cell {
          text-align: center;
          font-weight: 600;
          color: #6c757d;
        }
        
        .name-cell {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .email-cell {
          color: #6c757d;
        }
        
        .org-cell {
          color: #495057;
        }
        
        .time-cell {
          color: #007bff;
          font-size: 13px;
        }
        
        .no-data {
          text-align: center;
          padding: 60px 40px;
          color: #6c757d;
        }
        
        .no-data-icon {
          margin-bottom: 20px;
          opacity: 0.5;
        }
        
        .no-data h3 {
          margin-bottom: 10px;
          color: #495057;
        }
        
        .no-data p {
          font-style: italic;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .report-container {
            padding: 15px;
          }
          
          .report-header {
            padding: 20px;
          }
          
          .report-main-title {
            font-size: 24px;
          }
          
          .report-stats {
            flex-direction: column;
            align-items: center;
          }
          
          .report-stat-card {
            min-width: 200px;
          }
          
          .report-table {
            font-size: 12px;
          }
          
          .report-table th,
          .report-table td {
            padding: 8px 6px;
          }
          
          .no-data {
            padding: 40px 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default CheckInReport;
