export const fetchGetWithAuth = async (url) => {
  try {
    const response = await fetch(url, {
      credentials: "include", // Use the same credentials: "include" as in AuthContext
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      console.log("User not authenticated for this request");
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in fetchGetWithAuth:", error);
    return null;
  }
};

export const fetchPostWithAuth = async (url, data) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include", // Use the same credentials: "include" as in AuthContext
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      console.log("User not authenticated for this request");
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in fetchPostWithAuth:", error);
    return null;
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  try {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error(`Error: ${res.status}`);
    }

    // Check if the response has content before trying to parse JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }

    return {};
  } catch (error) {
    console.error("Error during fetchWithAuth:", error);
    return null;
  }
};
