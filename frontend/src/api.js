const API_BASE_URL = "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

localStorage.setItem("token", data.token);
localStorage.setItem("role", data.user.role);
localStorage.setItem("userId", data.user.id);

return data;
}

export async function getCustomers() {
  return apiRequest("/customers");
}

export async function getProducts() {
  return apiRequest("/products");
}

export async function getStockMovements() {
  return apiRequest("/inventory/movements");
}

export async function getChallans() {
  return apiRequest("/challans");
}
export async function createCustomer(customerData) {
  return apiRequest("/customers", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
}

export async function approveCustomer(customerId) {
  return apiRequest(`/customers/${customerId}/approve`, {
    method: "POST",
  });
}

export async function cancelCustomer(customerId) {
  return apiRequest(`/customers/${customerId}/cancel`, {
    method: "POST",
  });
}

export async function createProduct(productData) {
  return apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function approveProduct(productId) {
  return apiRequest(`/products/${productId}/approve`, {
    method: "POST",
  });
}

export async function cancelProduct(productId) {
  return apiRequest(`/products/${productId}/cancel`, {
    method: "POST",
  });
}

export async function stockIn(stockData) {
  return apiRequest("/inventory/in", {
    method: "POST",
    body: JSON.stringify(stockData),
  });
}
export async function stockOut(stockData) {
  return apiRequest("/inventory/out", {
    method: "POST",
    body: JSON.stringify(stockData),
  });
}

export async function approveStockMovement(id) {
  return apiRequest(`/inventory/${id}/approve`, {
    method: "POST",
  });
}

export async function cancelStockMovement(id) {
  return apiRequest(`/inventory/${id}/cancel`, {
    method: "POST",
  });
}

export async function createChallan(challanData) {
  return apiRequest("/challans", {
    method: "POST",
    body: JSON.stringify(challanData),
  });
}
export async function confirmChallan(challanId) {
  return apiRequest(`/challans/${challanId}/confirm`, {
    method: "POST",
  });
}

export async function cancelChallan(challanId) {
  return apiRequest(`/challans/${challanId}/cancel`, {
    method: "POST",
  });
}

export async function requestChallanApproval(challanId) {
  return apiRequest(`/challans/${challanId}/request-approval`, {
    method: "POST",
  });
}