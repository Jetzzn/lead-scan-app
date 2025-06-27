import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  RefreshCcw,
  Calendar,
  Users,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { getDoorScanStats, getAllCheckinData } from "../utils/airtableUtils";

function ReportPage() {
  const [checkinData, setCheckinData] = useState([]);
  const [stats, setStats] = useState({ totalCheckins: 0, todayCheckins: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [statsData, checkinData] = await Promise.all([
        getDoorScanStats(),
        getAllCheckinData(),
      ]);
      setStats(statsData);
      setCheckinData(checkinData);
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadReportData();
  };

  const exportToCSV = () => {
    const csvHeaders = ["#", "Name", "Email", "Organization", "Check-in Time"];
    const csvData = filteredAndSortedData.map((item, index) => [
      index + 1,
      item.name,
      item.email,
      item.organization,
      new Date(item.time).toLocaleString(),
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredAndSortedData = checkinData
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organization.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate =
        !dateFilter ||
        new Date(item.time).toDateString() ===
          new Date(dateFilter).toDateString();

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "organization":
          aValue = a.organization.toLowerCase();
          bValue = b.organization.toLowerCase();
          break;
        case "time":
        default:
          aValue = new Date(a.time);
          bValue = new Date(b.time);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown size={14} />;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">
          <FileText
            size={28}
            style={{ verticalAlign: "middle", marginRight: 8 }}
          />
          Check-in Report
        </h1>
        <p className="subtitle">Comprehensive report of all event check-ins</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.todayCheckins}</div>
            <div className="stat-label">Today's Check-ins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalCheckins}</div>
            <div className="stat-label">Total Check-ins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{filteredAndSortedData.length}</div>
            <div className="stat-label">Filtered Results</div>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="date-filter">
            <Calendar size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
        <div className="action-buttons">
          <button
            className="button refresh-btn"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCcw size={18} className={isLoading ? "spin" : ""} />
            Refresh
          </button>
          <button className="button export-btn" onClick={exportToCSV}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="report-section">
        {isLoading ? (
          <div className="loading">
            <RefreshCcw size={24} className="spin" />
            <p>Loading report data...</p>
          </div>
        ) : filteredAndSortedData.length > 0 ? (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th onClick={() => handleSort("name")} className="sortable">
                    Name {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("email")} className="sortable">
                    Email {getSortIcon("email")}
                  </th>
                  <th
                    onClick={() => handleSort("organization")}
                    className="sortable"
                  >
                    Organization {getSortIcon("organization")}
                  </th>
                  <th onClick={() => handleSort("time")} className="sortable">
                    Check-in Time {getSortIcon("time")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((item, index) => (
                  <tr key={item.id + index}>
                    <td className="index-cell">{index + 1}</td>
                    <td className="name-cell">{item.name}</td>
                    <td className="email-cell">{item.email}</td>
                    <td className="org-cell">{item.organization}</td>
                    <td className="time-cell">
                      {new Date(item.time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <FileText size={48} />
            <h3>No check-in data found</h3>
            <p>
              {searchTerm || dateFilter
                ? "No results match your current filters. Try adjusting your search criteria."
                : "No check-ins recorded yet. Start scanning QR codes to populate the report."}
            </p>
            {(searchTerm || dateFilter) && (
              <button
                className="button clear-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                }}
              >
                <Filter size={16} />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8f9fa;
          padding: 20px;
          min-height: 100vh;
        }
        
        .header {
          text-align: center;
          background: white;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        
        .title {
          font-size: 32px;
          margin-bottom: 10px;
          color: #2c3e50;
          font-weight: 700;
        }
        
        .subtitle {
          font-size: 18px;
          color: #7f8c8d;
          margin: 0;
        }
        
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .stat-icon {
          background: #e8f4f8;
          padding: 15px;
          border-radius: 50%;
          color: #3498db;
        }
        
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #7f8c8d;
          margin: 0;
        }
        
        .controls-section {
          background: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        
        .search-filters {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .search-box {
          flex: 1;
          min-width: 300px;
          position: relative;
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 0 15px;
        }
        
        .search-box svg {
          color: #7f8c8d;
          margin-right: 10px;
        }
        
        .search-input {
          flex: 1;
          border: none;
          background: none;
          padding: 12px 0;
          font-size: 16px;
          outline: none;
        }
        
        .date-filter {
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 0 15px;
          gap: 10px;
        }
        
        .date-filter svg {
          color: #7f8c8d;
        }
        
        .date-input {
          border: none;
          background: none;
          padding: 12px 0;
          font-size: 16px;
          outline: none;
        }
        
        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        
        .button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .refresh-btn {
          background: #3498db;
          color: white;
        }
        
        .refresh-btn:hover {
          background: #2980b9;
        }
        
        .export-btn {
          background: #27ae60;
          color: white;
        }
        
        .export-btn:hover {
          background: #219a52;
        }
        
        .clear-filters-btn {
          background: #e74c3c;
          color: white;
          margin-top: 15px;
        }
        
        .clear-filters-btn:hover {
          background: #c0392b;
        }
        
        .report-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        
        .loading {
          text-align: center;
          padding: 60px;
          color: #7f8c8d;
        }
        
        .loading svg {
          margin-bottom: 15px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .report-table th {
          background: #34495e;
          color: white;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          position: sticky;
          top: 0;
        }
        
        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }
        
        .sortable:hover {
          background: #2c3e50;
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
        
        .index-cell {
          text-align: center;
          font-weight: 600;
          color: #7f8c8d;
        }
        
        .name-cell {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .email-cell {
          color: #7f8c8d;
        }
        
        .org-cell {
          color: #34495e;
        }
        
        .time-cell {
          color: #2980b9;
          font-size: 13px;
        }
        
        .no-data {
          text-align: center;
          padding: 60px 20px;
          color: #7f8c8d;
        }
        
        .no-data svg {
          margin-bottom: 20px;
          opacity: 0.5;
        }
        
        .no-data h3 {
          margin-bottom: 15px;
          color: #2c3e50;
        }
        
        .no-data p {
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }
          
          .stats-row {
            grid-template-columns: 1fr;
          }
          
          .search-filters {
            flex-direction: column;
          }
          
          .search-box {
            min-width: auto;
          }
          
          .action-buttons {
            justify-content: stretch;
          }
          
          .button {
            flex: 1;
            justify-content: center;
        }
          
          .report-table {
            font-size: 12px;
          }
          
          .report-table th,
          .report-table td {
            padding: 8px 6px;
          }
          
          .title {
            font-size: 24px;
          }
          
          .subtitle {
            font-size: 16px;
          }
          
          .stat-number {
            font-size: 24px;
          }
        }
        
        @media (max-width: 480px) {
          .report-table th:nth-child(3),
          .report-table td:nth-child(3) {
            display: none;
          }
          
          .report-table th:nth-child(4),
          .report-table td:nth-child(4) {
            display: none;
          }
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        button:disabled:hover {
          background: inherit !important;
        }
      `}</style>
    </div>
  );
}

export default ReportPage;