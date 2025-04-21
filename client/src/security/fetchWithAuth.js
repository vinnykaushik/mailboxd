export const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      console.log(`Resource not found: ${url}`);
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error during fetchWithAuth:", error);
    throw error;
  }
};

export async function fetchGetWithAuth(url) {
  try {
    const res = await fetchWithAuth(url);
    return res.json();
  } catch (error) {
    console.error("Error during fetchGetWithAuth:", error);
    throw error;
  }
}

export async function fetchPostWithAuth(url, data) {
  return fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
