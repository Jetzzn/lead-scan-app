import Airtable from "airtable";

// Environment variables (ใน Vite ใช้ import.meta.env)
const AIRTABLE_API_KEY =
  import.meta.env.VITE_AIRTABLE_API_KEY ||
  "pat8X0z65cRv1Up3O.aa792af5f067671fc882b7abb754023e4f36f315ceee952736055359dcb145c0";
const AIRTABLE_BASE_ID =
  import.meta.env.VITE_AIRTABLE_BASE_ID || "app8F5eYV4QATJrSK";

// Configure Airtable
const base = new Airtable({
  apiKey: AIRTABLE_API_KEY,
  endpointUrl: import.meta.env.DEV
    ? "/api/airtable"
    : "https://api.airtable.com",
}).base(AIRTABLE_BASE_ID);

const USERS_TABLE_NAME = "Exhibitor";
const DOWNLOAD_DATA_TABLE_NAME = "Visitors";
const SCANNED_DATA_TABLE_NAME = "ScannedData";
const DOOR_CHECKIN_TABLE_NAME = "DoorCheckins";
const columnMapping = {
  Username: "Username",
  "Company name": "Company name",
  Booth: "booth",
};

// Helper function to get start and end of today
const getTodayRange = () => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
};

// New function to check if user was already scanned today
export const checkIfUserScannedToday = async (username, scannedUserId) => {
  try {
    const { start, end } = getTodayRange();

    const records = await base(SCANNED_DATA_TABLE_NAME)
      .select({
        filterByFormula: `AND(
          {Username} = '${username}',
          {ScannedUserId} = '${scannedUserId}',
          IS_AFTER({ScanTimestamp}, '${start}'),
          IS_BEFORE({ScanTimestamp}, '${end}')
        )`,
        maxRecords: 1,
      })
      .firstPage();

    return records.length > 0;
  } catch (error) {
    console.error("Error checking if user was scanned today:", error);
    throw error;
  }
};

export const getUserCredentials = async (username, password) => {
  try {
    const records = await base(USERS_TABLE_NAME)
      .select({
        filterByFormula: `AND({Username} = '${username}', {Password} = '${password}')`,
      })
      .firstPage();

    if (records.length > 0) {
      return {
        username: records[0].get("Username"),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user credentials from Airtable:", error);
    throw error;
  }
};

export const getDownloadData = async () => {
  try {
    console.log(
      `Fetching download data from Airtable table: ${DOWNLOAD_DATA_TABLE_NAME}`
    );
    const records = await base(DOWNLOAD_DATA_TABLE_NAME).select().all();
    console.log(`Fetched ${records.length} data records`);
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error("Error fetching download data from Airtable:", error);
    throw error;
  }
};

export const getUserProfile = async (username) => {
  try {
    console.log(`Fetching user profile for ${username}`);
    const records = await base(USERS_TABLE_NAME)
      .select({
        filterByFormula: `{Username} = '${username}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      const rawUserData = records[0].fields;
      const userData = {};

      Object.keys(columnMapping).forEach((airtableColumn) => {
        const ourVariable = columnMapping[airtableColumn];
        userData[ourVariable] = rawUserData[airtableColumn];
      });

      console.log("User profile fetched successfully");
      return userData;
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    console.log(`Fetching user data for ID: ${userId}`);

    let records = await base(DOWNLOAD_DATA_TABLE_NAME)
      .select({
        filterByFormula: `{Ref ID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      const userData = records[0].fields;
      console.log("User data fetched successfully:", userData);

      const refId = userData["Ref ID"] || userId;

      return {
        id: refId,
        "First name": userData["First name"] || "",
        "Last name": userData["Last name"] || "",
        Email: userData["Email"] || "",
        "Phone Number": userData["Phone Number"] || "",
        Organization: userData["Organization"] || "",
      };
    } else {
      console.log("No records found for this userId");
      throw new Error(
        "User not found. Please check the QR code and try again."
      );
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const storeUserScanData = async (username, user) => {
  try {
    // Check if user was already scanned today
    const alreadyScanned = await checkIfUserScannedToday(username, user.id);

    if (alreadyScanned) {
      throw new Error(
        "This user has already been scanned today. Only one scan per user per day is allowed."
      );
    }

    const scanTimestamp = new Date().toISOString();

    await base(SCANNED_DATA_TABLE_NAME).create({
      Username: username,
      ScannedUserId: user.id,
      FirstName: user["First name"],
      LastName: user["Last name"],
      Email: user.Email,
      PhoneNumber: user["Phone Number"],
      Organization: user.Organization,
      ScanTimestamp: scanTimestamp,
    });

    console.log(`Scan data stored for ${username}, ScannedUserId: ${user.id}`);
    return true;
  } catch (error) {
    console.error("Error storing scan data in Airtable:", error);
    throw error;
  }
};

export const getUserScanData = async (username) => {
  try {
    const records = await base(SCANNED_DATA_TABLE_NAME)
      .select({
        filterByFormula: `{Username} = '${username}'`,
        sort: [{ field: "ScanTimestamp", direction: "desc" }],
      })
      .all();

    return records.map((record) => ({
      id: record.get("ScannedUserId"),
      "First name": record.get("FirstName"),
      "Last name": record.get("LastName"),
      Email: record.get("Email"),
      "Phone Number": record.get("PhoneNumber"),
      Organization: record.get("Organization"),
      scanTimestamp: record.get("ScanTimestamp"),
    }));
  } catch (error) {
    console.error("Error fetching user scan data from Airtable:", error);
    throw error;
  }
};

export const clearUserData = async (username) => {
  try {
    const records = await base(SCANNED_DATA_TABLE_NAME)
      .select({
        filterByFormula: `{Username} = '${username}'`,
      })
      .all();

    if (records.length === 0) {
      console.log(`No scan data to clear for ${username}`);
      return;
    }

    const recordIds = records.map((record) => record.id);

    const batchSize = 10;
    for (let i = 0; i < recordIds.length; i += batchSize) {
      const batch = recordIds.slice(i, i + batchSize);
      await base(SCANNED_DATA_TABLE_NAME).destroy(batch);
      console.log(
        `Deleted batch ${Math.floor(i / batchSize) + 1} for ${username}`
      );
    }

    console.log(`All scan data cleared for ${username}`);
  } catch (error) {
    console.error("Error clearing user data from Airtable:", error);
    throw error;
  }
};

export const getUserDetailedData = async (userId) => {
  try {
    console.log(`Fetching detailed user data for ID: ${userId}`);

    let records = await base(DOWNLOAD_DATA_TABLE_NAME)
      .select({
        filterByFormula: `{Ref ID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      records = await base(DOWNLOAD_DATA_TABLE_NAME)
        .select({
          filterByFormula: `RECORD_ID() = '${userId}'`,
          maxRecords: 1,
        })
        .firstPage();
    }

    if (records.length > 0) {
      const userData = records[0].fields;
      console.log("Detailed user data fetched successfully:", userData);

      return {
        id: userId,
        "First name": userData["First name"] || "",
        "Last name": userData["Last name"] || "",
        Email: userData["Email"] || "",
        "Phone Number": userData["Phone Number"] || "",
        Organization: userData["Organization"] || "", 
      };
    } else {
      console.log("No detailed records found for this userId");
      throw new Error("User details not found");
    }
  } catch (error) {
    console.error("Error fetching detailed user data:", error);
    throw error;
  }
};

// Updated door scanner utilities for dropdown door selection and simple ID logging

export const storeDoorScanData = async (userId, selectedDoor) => {
  try {
    const checkInTimestamp = new Date().toISOString();

    await base(DOOR_CHECKIN_TABLE_NAME).create({
      UserId: userId,
      DoorName: selectedDoor,
      CheckInTime: checkInTimestamp,
    });

    console.log(`Door check-in recorded - User: ${userId}, Door: ${selectedDoor}`);
    return true;
  } catch (error) {
    console.error("Error storing door scan data:", error);
    throw error;
  }
};

// ตรวจสอบว่า user เคย check-in ที่ประตูนี้แล้วหรือไม่
export const checkIfUserAlreadyCheckedIn = async (userId, doorName) => {
  try {
    const records = await base(DOOR_CHECKIN_TABLE_NAME)
      .select({
        filterByFormula: `AND({UserId} = '${userId}', {DoorName} = '${doorName}')`,
        sort: [{ field: "CheckInTime", direction: "desc" }],
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      return {
        alreadyCheckedIn: true,
        checkInTime: records[0].get("CheckInTime"),
        record: records[0],
      };
    }

    return null;
  } catch (error) {
    console.error("Error checking if user already checked in:", error);
    return null;
  }
};

// ดึงสถิติการ check-in
export const getDoorScanStats = async () => {
  try {
    // ดึงข้อมูลทั้งหมด
    const allRecords = await base(DOOR_CHECKIN_TABLE_NAME)
      .select({
        sort: [{ field: "CheckInTime", direction: "desc" }],
      })
      .all();

    // คำนวณสถิติ
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const todayCheckins = allRecords.filter((record) => {
      const checkInTime = new Date(record.get("CheckInTime"));
      return checkInTime >= todayStart;
    });

    // สถิติเพิ่มเติม
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // วันอาทิตย์
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekCheckins = allRecords.filter((record) => {
      const checkInTime = new Date(record.get("CheckInTime"));
      return checkInTime >= thisWeekStart;
    });

    // สถิติต่อชั่วโมง (วันนี้)
    const hourlyStats = {};
    todayCheckins.forEach((record) => {
      const hour = new Date(record.get("CheckInTime")).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    // สถิติตามประตู
    const doorStats = {};
    allRecords.forEach((record) => {
      const door = record.get("DoorName") || "Unknown";
      doorStats[door] = (doorStats[door] || 0) + 1;
    });

    return {
      totalCheckins: allRecords.length,
      todayCheckins: todayCheckins.length,
      thisWeekCheckins: thisWeekCheckins.length,
      hourlyStats: hourlyStats,
      doorStats: doorStats,
      peakHour: Object.keys(hourlyStats).reduce(
        (a, b) => (hourlyStats[a] > hourlyStats[b] ? a : b),
        "0"
      ),
      lastCheckIn:
        allRecords.length > 0 ? allRecords[0].get("CheckInTime") : null,
      uniqueUsers: [
        ...new Set(allRecords.map((r) => r.get("UserId")).filter(Boolean)),
      ].length,
    };
  } catch (error) {
    console.error("Error getting door scan stats:", error);
    return {
      totalCheckins: 0,
      todayCheckins: 0,
      thisWeekCheckins: 0,
      hourlyStats: {},
      doorStats: {},
      peakHour: "0",
      lastCheckIn: null,
      uniqueUsers: 0,
    };
  }
};

// ดึงรายการ check-in ล่าสุด
export const getRecentDoorCheckins = async (limit = 50) => {
  try {
    const records = await base(DOOR_CHECKIN_TABLE_NAME)
      .select({
        sort: [{ field: "CheckInTime", direction: "desc" }],
        maxRecords: limit,
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      userId: record.get("UserId"),
      doorName: record.get("DoorName"),
      checkInTime: record.get("CheckInTime"),
      status: record.get("Status"),
    }));
  } catch (error) {
    console.error("Error getting recent door check-ins:", error);
    throw error;
  }
};

// ดึงรายงานการ check-in
export const getDoorCheckinReport = async (dateFrom, dateTo, doorName = null) => {
  try {
    let filterFormula = "";
    const conditions = [];

    if (dateFrom && dateTo) {
      conditions.push(`AND({CheckInTime} >= '${dateFrom}', {CheckInTime} <= '${dateTo}')`);
    } else if (dateFrom) {
      conditions.push(`{CheckInTime} >= '${dateFrom}'`);
    } else if (dateTo) {
      conditions.push(`{CheckInTime} <= '${dateTo}'`);
    }

    if (doorName) {
      conditions.push(`{DoorName} = '${doorName}'`);
    }

    if (conditions.length > 0) {
      filterFormula = conditions.length === 1 ? conditions[0] : `AND(${conditions.join(', ')})`;
    }

    const records = await base(DOOR_CHECKIN_TABLE_NAME)
      .select({
        ...(filterFormula && { filterByFormula: filterFormula }),
        sort: [{ field: "CheckInTime", direction: "desc" }],
      })
      .all();

    // วิเคราะห์ข้อมูล
    const analysis = {
      totalCheckins: records.length,
      uniqueUsers: [...new Set(records.map((r) => r.get("UserId")))].length,
      doors: {},
      hourlyDistribution: {},
      dailyDistribution: {},
    };

    records.forEach((record) => {
      const door = record.get("DoorName") || "Unknown";
      const checkInTime = new Date(record.get("CheckInTime"));
      const hour = checkInTime.getHours();
      const day = checkInTime.toDateString();

      // นับตามประตู
      analysis.doors[door] = (analysis.doors[door] || 0) + 1;

      // นับตามชั่วโมง
      analysis.hourlyDistribution[hour] =
        (analysis.hourlyDistribution[hour] || 0) + 1;

      // นับตามวัน
      analysis.dailyDistribution[day] =
        (analysis.dailyDistribution[day] || 0) + 1;
    });

    return {
      records: records.map((record) => ({
        id: record.id,
        userId: record.get("UserId"),
        doorName: record.get("DoorName"),
        checkInTime: record.get("CheckInTime"),
      })),
      analysis: analysis,
    };
  } catch (error) {
    console.error("Error getting door check-in report:", error);
    throw error;
  }
};

// ลบข้อมูล check-in (สำหรับ admin)
export const deleteDoorCheckin = async (recordId) => {
  try {
    await base(DOOR_CHECKIN_TABLE_NAME).destroy(recordId);
    console.log("Door check-in record deleted:", recordId);
    return true;
  } catch (error) {
    console.error("Error deleting door check-in record:", error);
    throw error;
  }
};

// Reset check-in status (สำหรับ testing)
export const resetUserCheckinStatus = async (userId, doorName = null) => {
  try {
    let filterFormula = `{UserId} = '${userId}'`;
    if (doorName) {
      filterFormula = `AND({UserId} = '${userId}', {DoorName} = '${doorName}')`;
    }

    const records = await base(DOOR_CHECKIN_TABLE_NAME)
      .select({
        filterByFormula: filterFormula,
      })
      .all();

    if (records.length > 0) {
      const recordIds = records.map((record) => record.id);
      await base(DOOR_CHECKIN_TABLE_NAME).destroy(recordIds);
      console.log(`Reset check-in status for user: ${userId} at door: ${doorName || 'all doors'}`);
      return records.length;
    }

    return 0;
  } catch (error) {
    console.error("Error resetting user check-in status:", error);
    throw error;
  }
};

// Export ข้อมูล check-in เป็น CSV
export const exportDoorCheckinsToCSV = async (dateFrom, dateTo, doorName = null) => {
  try {
    const reportData = await getDoorCheckinReport(dateFrom, dateTo, doorName);

    const headers = [
      "User ID",
      "Door Name",
      "Check-in Time",
    ];

    // เพิ่ม BOM สำหรับ UTF-8
    let csvContent = "\uFEFF";
    csvContent += headers.join(",") + "\n";

    reportData.records.forEach((record) => {
      const row = [
        record.userId,
        `"${record.doorName || ""}"`,
        `"${new Date(record.checkInTime).toLocaleString()}"`,
      ];
      csvContent += row.join(",") + "\n";
    });

    return {
      csvContent,
      filename: `door_checkins_${doorName ? doorName + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`,
      stats: reportData.analysis,
    };
  } catch (error) {
    console.error("Error exporting door check-ins to CSV:", error);
    throw error;
  }
};