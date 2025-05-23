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

const columnMapping = {
  Username: "Username",
  "Institution name": "Institution",
  Booth: "booth",
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
    const scanTimestamp = new Date().toISOString();

    await base(SCANNED_DATA_TABLE_NAME).create({
      Username: username,
      ScannedUserId: user.id,
      FirstName: user["First name"],
      LastName: user["Last name"],
      Email: user.Email,
      PhoneNumber: user["Phone Number"],
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
        "Name of institution": userData["Name of institution"] || "",
        GPA: userData["GPA"] || "",
        Age: userData["Age"] || "",
        "Year of going to study abroad":
          userData["Year of going to study abroad"] || "",
        "Your highest education level":
          userData["Your highest education level"] || "",
        Gender: userData["Gender"] || "",
        "Field of study": userData["Field of study"] || "",
        "Level of degree (หลักสูตรที่กำลังจะไปศึกษาต่อ)":
          userData["Level of degree (หลักสูตรที่กำลังจะไปศึกษาต่อ)"] || "",
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
