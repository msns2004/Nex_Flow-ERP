import { useEffect, useState } from "react";
import { getCustomers, getProducts, getStockMovements, getChallans, login,  createCustomer,
         cancelChallan, createProduct, stockIn, stockOut, approveStockMovement, cancelStockMovement,
         createChallan, confirmChallan, requestChallanApproval, approveCustomer,  cancelCustomer, 
         approveProduct,  cancelProduct } from "./api";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
  Boolean(localStorage.getItem("token"))
  );
  const [userRole, setUserRole] = useState(
  localStorage.getItem("role") || ""
 );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);


  const [activePage, setActivePage] = useState("Dashboard");

  const [showCustomerForm, setShowCustomerForm] = useState(false);

const [customerForm, setCustomerForm] = useState({
  name: "",
  email: "",
  phone: "",
  address: "",
});

const [customerMessage, setCustomerMessage] = useState("");
const [customerSubmitting, setCustomerSubmitting] = useState(false);

const [showProductForm, setShowProductForm] = useState(false);

const [productForm, setProductForm] = useState({
  sku: "",
  name: "",
  description: "",
  category: "",
  price: "",
  stock_quantity: "",
  min_stock_quantity: "",
  warehouse_location: "",
});

const [productMessage, setProductMessage] = useState("");
const [productSubmitting, setProductSubmitting] = useState(false);

const [showStockInForm, setShowStockInForm] = useState(false);

const [stockInForm, setStockInForm] = useState({
  product_id: "",
  quantity: "",
  reason: "",
});

const [stockInMessage, setStockInMessage] = useState("");
const [stockInSubmitting, setStockInSubmitting] = useState(false);
const [showStockOutForm, setShowStockOutForm] = useState(false);

const [stockOutForm, setStockOutForm] = useState({
  product_id: "",
  quantity: "",
  reason: "",
});

const [stockOutMessage, setStockOutMessage] = useState("");
const [stockOutSubmitting, setStockOutSubmitting] = useState(false);

const [showChallanForm, setShowChallanForm] = useState(false);

const [challanForm, setChallanForm] = useState({
  customer_id: "",
  tax_percent: "18",
  items: [
    {
      product_id: "",
      quantity: "",
    },
  ],
});

const [challanMessage, setChallanMessage] = useState("");
const [challanSubmitting, setChallanSubmitting] = useState(false);
const [createdChallan, setCreatedChallan] = useState(null);
const [challans, setChallans] = useState([]);

const displayedChallan = createdChallan
  ? challans.find(
      (challan) => challan.id === createdChallan.id
    ) || createdChallan
  : null;
const [stockMovements, setStockMovements] = useState([]);


  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

   // 👇 STEP 3 GOES HERE
  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setLoginError("");

const loginData = await login(email, password);

setUserRole(loginData.user.role);
setIsLoggedIn(true);

    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCustomerSubmit = async (event) => {
  event.preventDefault();

  try {
    setCustomerSubmitting(true);
    setCustomerMessage("");

    await createCustomer(customerForm);

    setCustomerMessage("Customer created successfully!");

    setCustomerForm({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setShowCustomerForm(false);

    // Refresh customer list
    const customerData = await getCustomers();
    setCustomers(customerData.customers || []);
  } catch (error) {
    console.error("Create customer error:", error);
    setCustomerMessage(error.message || "Failed to create customer");
  } finally {
    setCustomerSubmitting(false);
  }
};
const handleProductSubmit = async (event) => {
  event.preventDefault();

  try {
    setProductSubmitting(true);
    setProductMessage("");

    await createProduct({
      ...productForm,
      price: Number(productForm.price),
      stock_quantity:
        productForm.stock_quantity === ""
          ? 0
          : Number(productForm.stock_quantity),
      min_stock_quantity:
        productForm.min_stock_quantity === ""
          ? 0
          : Number(productForm.min_stock_quantity),
    });

    setProductMessage("Product created successfully!");

    setProductForm({
      sku: "",
      name: "",
      description: "",
      category: "",
      price: "",
      stock_quantity: "",
      min_stock_quantity: "",
      warehouse_location: "",
    });

    setShowProductForm(false);

    // Refresh product list
    const productData = await getProducts();
    setProducts(productData.products || []);
    
  } catch (error) {
    console.error("Create product error:", error);
    setProductMessage(error.message || "Failed to create product");
  } finally {
    setProductSubmitting(false);
  }
};

const handleStockIn = async (event) => {
  event.preventDefault();

  try {
    setStockInSubmitting(true);
    setStockInMessage("");

    await stockIn({
      product_id: stockInForm.product_id,
      quantity: Number(stockInForm.quantity),
      reason: stockInForm.reason || null,
    });

    setStockInMessage("Stock added successfully!");

    setStockInForm({
      product_id: "",
      quantity: "",
      reason: "",
    });

    setShowStockInForm(false);

    // Refresh products so the new stock appears immediately
    const productData = await getProducts();
    setProducts(productData.products || []);

    const movementData = await getStockMovements();
setStockMovements(movementData.movements || []);

  } catch (error) {
    console.error("Stock IN error:", error);
    setStockInMessage(error.message || "Failed to add stock");
  } finally {
    setStockInSubmitting(false);
  }
};
const handleStockOut = async (event) => {
  event.preventDefault();

  try {
    setStockOutSubmitting(true);
    setStockOutMessage("");

    await stockOut({
      product_id: stockOutForm.product_id,
      quantity: Number(stockOutForm.quantity),
      reason: stockOutForm.reason || null,
    });

    setStockOutMessage("Stock removed successfully!");

    setStockOutForm({
      product_id: "",
      quantity: "",
      reason: "",
    });

    setShowStockOutForm(false);

    // Refresh products so the updated stock appears immediately
    const productData = await getProducts();
    setProducts(productData.products || []);

    const movementData = await getStockMovements();
setStockMovements(movementData.movements || []);
    
  } catch (error) {
    console.error("Stock OUT error:", error);
    setStockOutMessage(error.message || "Failed to remove stock");
  } finally {
    setStockOutSubmitting(false);
  }
};
const handleCreateChallan = async (event) => {
  event.preventDefault();

  try {
    setChallanSubmitting(true);
    setChallanMessage("");

    const validItems = challanForm.items.filter(
      (item) => item.product_id && Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      setChallanMessage("Please add at least one product.");
      return;
    }

    const result = await createChallan({
      customer_id: challanForm.customer_id,
      tax_percent: Number(challanForm.tax_percent || 0),
      items: validItems.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
      })),
    });

    setCreatedChallan(result.challan);
    setChallanMessage("Challan created successfully!");

    setChallanForm({
      customer_id: "",
      tax_percent: "18",
      items: [
        {
          product_id: "",
          quantity: "",
        },
      ],
    });

    setShowChallanForm(false);
  } catch (error) {
    console.error("Create challan error:", error);
    setChallanMessage(
      error.message || "Failed to create challan"
    );
  } finally {
    setChallanSubmitting(false);
  }
};
useEffect(() => {
  if (!isLoggedIn) {
    return;
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        customerData,
        productData,
        movementData,
        challanData
      ] = await Promise.all([
        getCustomers(),
        getProducts(),
        getStockMovements(),
        getChallans()
      ]);

      setCustomers(customerData.customers || []);
      setProducts(productData.products || []);
      setStockMovements(movementData.movements || []);
      setChallans(challanData.challans || []);

    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

// Load dashboard data once when the dashboard loads
loadDashboardData();

}, [isLoggedIn]);

useEffect(() => {
  if (!isLoggedIn) {
    return;
  }

  const syncHistory = async () => {
    try {
      if (activePage === "Customers") {
        const customerData = await getCustomers();
        const latestCustomers = customerData.customers || [];

        setCustomers((currentCustomers) => {
          const changed =
            currentCustomers.length !== latestCustomers.length ||
            currentCustomers.some((current) => {
              const latest = latestCustomers.find(
                (item) => item.id === current.id
              );

              return (
                !latest ||
                latest.status !== current.status
              );
            });

          return changed ? latestCustomers : currentCustomers;
        });
      }

      if (activePage === "Products") {
        const productData = await getProducts();
        const latestProducts = productData.products || [];

        setProducts((currentProducts) => {
          const changed =
            currentProducts.length !== latestProducts.length ||
            currentProducts.some((current) => {
              const latest = latestProducts.find(
                (item) => item.id === current.id
              );

              return (
                !latest ||
                latest.status !== current.status ||
                latest.stock_quantity !== current.stock_quantity
              );
            });

          return changed ? latestProducts : currentProducts;
        });
      }
    } catch (error) {
      console.error(
        "History synchronization error:",
        error
      );
    }
  };

  syncHistory();

  const syncInterval = setInterval(
    syncHistory,
    2000
  );

  return () => {
    clearInterval(syncInterval);
  };
}, [isLoggedIn, activePage]);

useEffect(() => {
  if (!isLoggedIn) {
    return;
  }

  const syncChallans = async () => {
    try {
      const challanData = await getChallans();

      const latestChallans = challanData.challans || [];

      // Always keep Sales Challan History synchronized
      setChallans(latestChallans);

      // If there is a currently displayed challan,
      // synchronize its status with the backend.
      if (createdChallan) {
        const updatedChallan = latestChallans.find(
          (challan) => challan.id === createdChallan.id
        );

        if (!updatedChallan) {
          return;
        }

        if (
          updatedChallan.status !== createdChallan.status
        ) {
          setCreatedChallan(updatedChallan);

          if (updatedChallan.status === "CONFIRMED") {
            setChallanMessage(
              "Admin confirmed the challan successfully!"
            );

            setTimeout(() => {
              setCreatedChallan(null);
            }, 4000);
          }

          if (updatedChallan.status === "CANCELLED") {
            setChallanMessage(
              "Challan was cancelled by Admin."
            );

            setTimeout(() => {
              setCreatedChallan(null);
            }, 4000);
          }
        }
      }
    } catch (error) {
      console.error(
        "Challan synchronization error:",
        error
      );
    }
  };

  // Check challan data every 2 seconds.
  const syncInterval = setInterval(
    syncChallans,
    2000
  );

  return () => {
    clearInterval(syncInterval);
  };
}, [isLoggedIn, createdChallan]);

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">N</div>

          <h1>Welcome to Mini ERP</h1>
          <p>Sign in to access your ERP dashboard</p>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />

            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}

            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }
const currentUserId = localStorage.getItem("userId");

const dashboardProducts = products.filter((product) => {
  if (userRole === "admin") {
    return (
      product.created_by === currentUserId &&
      product.status === "APPROVED"
    );
  }

  return (
    product.created_by === currentUserId &&
    product.status === "APPROVED"
  );
});

const dashboardTotalProducts =
  userRole === "admin"
    ? products.filter(
        (product) => product.status === "APPROVED"
      ).length
    : products.filter(
        (product) =>
          product.created_by === currentUserId &&
          product.status === "APPROVED"
      ).length;

const dashboardCustomers =
  userRole === "admin"
    ? customers.filter(
        (customer) => customer.status === "APPROVED"
      )
    : customers.filter(
        (customer) =>
          customer.created_by === currentUserId &&
          customer.status === "APPROVED"
      );

const dashboardInventoryValue =
  (userRole === "admin"
    ? products.filter(
        (product) => product.status === "APPROVED"
      )
    : products.filter(
        (product) =>
          product.created_by === currentUserId &&
          product.status === "APPROVED"
      )
  ).reduce(
    (total, product) =>
      total +
      Number(product.price || 0) *
      Number(product.stock_quantity || 0),
    0
  );      

const dashboardTotalChallans =
  userRole === "admin"
    ? challans.filter(
        (challan) => challan.status === "CONFIRMED"
      ).length
    : challans.filter(
        (challan) =>
          challan.created_by === currentUserId &&
          challan.status === "CONFIRMED"
      ).length;

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Customers", icon: "♙" },
    { name: "Products", icon: "▣" },
    { name: "Inventory", icon: "◈" },
    { name: "Sales Challans", icon: "▤" },
  ];

const dashboardRecentSales = challans
  .filter((challan) => {
   if (challan.status !== "CONFIRMED") {
      return false;
    }

    const challanDate = new Date(challan.created_at);
    const today = new Date();

    return (
      challanDate.getFullYear() === today.getFullYear() &&
      challanDate.getMonth() === today.getMonth() &&
      challanDate.getDate() === today.getDate()
    );
  })
  .sort(
    (a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
  )
  .slice(0, 5);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">N</div>
          <div>
            <h2>Mini ERP</h2>
            <span>CRM System</span>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-title">MAIN MENU</p>

          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
  <div className="user-card">
    <div className="avatar">SA</div>

    <div className="user-details">
  <strong>
    {userRole === "admin" ? "Admin" : "Sales"}
  </strong>

  <span>
    {userRole === "admin" ? "Administrator" : "Sales Executive"}
  </span>
</div>

    <button
      className="logout-button"
      onClick={() => {
localStorage.removeItem("token");
localStorage.removeItem("role");

setIsLoggedIn(false);
setUserRole("");
setCreatedChallan(null);
setChallanMessage("");
      }}
      title="Logout"
    >
      ↪
    </button>
  </div>
</div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>
  Welcome back, {userRole === "admin" ? "Admin" : "Sales"} 👋
</p>
          </div>

          <div className="topbar-right">
            <div className="status">
              <span className="status-dot"></span>
              System Online
            </div>

            <div className="profile">
              <div className="avatar">SA</div>
<div>
  <strong>
    {userRole === "admin" ? "Admin" : "Sales"}
  </strong>
  <span>
    {userRole === "admin" ? "Administrator" : "Sales Executive"}
  </span>
</div>
            </div>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <>
            {/* Statistics */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon customers">♙</div>
                <div>
                  <span>Total Customers</span>
                 <strong>
  {loading ? "..." : dashboardCustomers.length}
</strong>
                  <small>Active customers</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon products">▣</div>
                <div>
                  <span>Total Products</span>
                  <strong>
  {loading ? "..." : dashboardTotalProducts}
</strong>
                  <small>Products available</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon inventory">◈</div>
                <div>
                  <span>Inventory Value</span>
                 <strong>
  {loading
    ? "..."
    : `₹${(dashboardInventoryValue / 100000).toFixed(2)}L`}
</strong>
                  <small>Current stock value</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon sales">▤</div>
                <div>
                  <span>Sales Challans</span>
                 <strong>
  {loading ? "..." : dashboardTotalChallans}
</strong>
                  <small>Confirmed challans</small>
                </div>
              </div>
            </section>

            {/* Main Dashboard */}
            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent Sales</h2>
                    <p>Latest sales challans</p>
                  </div>
                  <button
  className="view-button"
  onClick={() => setActivePage("Sales Challans")}
>
  View All
</button>
                </div>

 {dashboardRecentSales.length === 0 ? (
  <div className="no-recent-sales">
    No recent sales
  </div>
) : (
  dashboardRecentSales.map((sale) => (
    <div className="sale-row" key={sale.id}>
      <div className="sale-icon">▤</div>

      <div className="sale-info">
        <strong>{sale.challan_number}</strong>
        <span>{sale.customer_name}</span>
      </div>

      <div className="sale-amount">
        <strong>
          ₹{Number(sale.grand_total || 0).toLocaleString("en-IN")}
        </strong>

        <span>
          {new Date(sale.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  ))
)}
              </div>

<div className="panel">
  <div className="panel-header">
    <div>
      <h2>Inventory Status</h2>
      <p>Current stock overview</p>
    </div>

    <div className="total-stock">
      <span>Total Stock</span>
      <strong>
  {loading
    ? "..."
    : dashboardProducts.reduce(
        (total, product) =>
          total + Number(product.stock_quantity || 0),
        0
      )}
</strong>
    </div>
  </div>

{dashboardProducts.map((product) => (
  <div className="inventory-product" key={product.id}>

    {/* Product */}
    <div className="product-image">💻</div>

    <div className="product-info">
      <strong>{product.name}</strong>
      <span>{product.sku}</span>
    </div>

    {/* Stock area */}
    <div className="stock-section">

      {/* Current stock */}
      <div className="stock-current">
        <strong>
          {loading ? "..." : product.stock_quantity ?? 0}
        </strong>

        <span>In Stock</span>
      </div>

      {/* Straight stock bar */}
      <div className="stock-bar">
        <div
          className="stock-progress"
          style={{
            width: `${Math.min(
              100,
              (Number(product.stock_quantity || 0) /
                Math.max(
                  Number(product.min_stock_quantity || 1),
                  1
                )) *
                20
            )}%`,
          }}
        ></div>
      </div>

      {/* Minimum stock */}
      <div className="stock-min">
        Min. Stock: {product.min_stock_quantity ?? 0}
      </div>

    </div>

  </div>
))}
</div>
            </section>

            {/* Quick Actions */}
            <section className="quick-section">
              <h2>Quick Actions</h2>

              <div className="quick-grid">
                <button onClick={() => setActivePage("Customers")}>
                  <span>♙</span>
                  <strong>Add Customer</strong>
                  <small>Create a new customer</small>
                </button>

                <button onClick={() => setActivePage("Products")}>
                  <span>▣</span>
                  <strong>Manage Products</strong>
                  <small>View and manage products</small>
                </button>

                <button onClick={() => setActivePage("Inventory")}>
                  <span>◈</span>
                  <strong>Inventory</strong>
                  <small>Manage stock movements</small>
                </button>

                <button onClick={() => setActivePage("Sales Challans")}>
                  <span>▤</span>
                  <strong>Create Challan</strong>
                  <small>Create a sales challan</small>
                </button>
              </div>
            </section>
          </>
        )}

        {activePage === "Customers" && (
  <section className="module-page">
    <div className="module-header">
      <div>
        <p>Manage your customers and their information.</p>
      </div>

      <button
  className="primary-button"
  onClick={() => {
    setShowCustomerForm(true);
    setCustomerMessage("");
  }}
>
  + Add Customer
</button>
    </div>

    {showCustomerForm && (
  <div className="customer-form-card">
    <div className="form-header">
      <div>
        <h3>Add New Customer</h3>
        <p>Enter the customer's information below.</p>
      </div>

      <button
        className="close-button"
        onClick={() => {
          setShowCustomerForm(false);
          setCustomerMessage("");
        }}
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleCustomerSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={customerForm.name}
            onChange={(event) =>
              setCustomerForm({
                ...customerForm,
                name: event.target.value,
              })
            }
            placeholder="Enter customer name"
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={customerForm.email}
            onChange={(event) =>
              setCustomerForm({
                ...customerForm,
                email: event.target.value,
              })
            }
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            value={customerForm.phone}
            onChange={(event) =>
              setCustomerForm({
                ...customerForm,
                phone: event.target.value,
              })
            }
            placeholder="Enter phone number"
            required
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            value={customerForm.address}
            onChange={(event) =>
              setCustomerForm({
                ...customerForm,
                address: event.target.value,
              })
            }
            placeholder="Enter address"
          />
        </div>
      </div>

      {customerMessage && (
        <div className="customer-message">
          {customerMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowCustomerForm(false);
            setCustomerMessage("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={customerSubmitting}
        >
          {customerSubmitting ? "Creating..." : "Create Customer"}
        </button>
      </div>
    </form>
  </div>
)}

    <div className="data-card">
      <div className="table-header">
        <h3>Customer List</h3>
        <span>{customers.length} customers</span>
      </div>

      {loading ? (
        <div className="loading-message">
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-message">
          No customers found.
        </div>
      ) : (
        <div className="table-container">
          <table>
<thead>
  <tr>
    <th>Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Address</th>

    {userRole === "admin" && (
 <th style={{ whiteSpace: "nowrap" }}>Created By</th>
    )}

    <th>Status</th>
    <th>Created AT</th>

  </tr>
</thead>

<tbody>
  {customers.map((customer) => (
    <tr key={customer.id}>
      <td>
        <div className="customer-name">
          <div className="customer-avatar">
            {customer.name?.charAt(0).toUpperCase()}
          </div>

          <strong>{customer.name}</strong>
        </div>
      </td>

      <td>{customer.email}</td>
      <td>{customer.phone}</td>
      <td>{customer.address || "—"}</td>

      {/* Created By - Admin only */}
      {userRole === "admin" && (
        <td>
        {customer.created_by_name || "—"}
        </td>
      )}

      {/* Status */}
<td>
  <div className="customer-status-cell">
    {customer.status === "PENDING_APPROVAL" ? (
      <>
        <div>⏳ PENDING APPROVAL</div>

        {userRole === "admin" && (
<div className="customer-status-actions">
  <button
    type="button"
    className="approve-button"
    onClick={async () => {
      try {
        await approveCustomer(customer.id);

        const updatedCustomerData = await getCustomers();

        setCustomers(
          updatedCustomerData.customers || []
        );
      } catch (error) {
        console.error(
          "Approve customer error:",
          error
        );
      }
    }}
  >
    ✓ Approve
  </button>

  <button
    type="button"
    className="cancel-button"
    onClick={async () => {
      try {
        await cancelCustomer(customer.id);

        const updatedCustomerData = await getCustomers();

        setCustomers(
          updatedCustomerData.customers || []
        );
      } catch (error) {
        console.error(
          "Cancel customer error:",
          error
        );
      }
    }}
  >
    ✕ Cancel
  </button>
</div>
        )}
      </>
    ) : customer.status === "APPROVED" ? (
      "✓ APPROVED"
    ) : customer.status === "CANCELLED" ? (
      "✕ CANCELLED"
    ) : (
      customer.status || "—"
    )}
  </div>
</td>

      {/* Created */}
      <td>
        {customer.created_at
          ? new Date(customer.created_at).toLocaleString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true
            })
          : "—"}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}
    </div>
  </section>
)}

{activePage === "Products" && (
  <section className="module-page">
    <div className="module-header">
      <div>
        <p>Manage your products and current stock.</p>
      </div>

     <button
  className="primary-button"
  onClick={() => {
    setShowProductForm(true);
    setProductMessage("");
  }}
>
  + Add Product
</button>
    </div>

    {showProductForm && (
  <div className="customer-form-card">
    <div className="form-header">
      <div>
        <h3>Add New Product</h3>
        <p>Enter the product information below.</p>
      </div>

      <button
        className="close-button"
        onClick={() => {
          setShowProductForm(false);
          setProductMessage("");
        }}
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleProductSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>SKU *</label>
          <input
            type="text"
            value={productForm.sku}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                sku: event.target.value,
              })
            }
            placeholder="e.g. LAP-002"
            required
          />
        </div>

        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            value={productForm.name}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                name: event.target.value,
              })
            }
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            value={productForm.category}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                category: event.target.value,
              })
            }
            placeholder="e.g. Electronics"
          />
        </div>

        <div className="form-group">
          <label>Price *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={productForm.price}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                price: event.target.value,
              })
            }
            placeholder="Enter price"
            required
          />
        </div>

        <div className="form-group">
          <label>Stock Quantity</label>
          <input
            type="number"
            min="0"
            value={productForm.stock_quantity}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                stock_quantity: event.target.value,
              })
            }
            placeholder="e.g. 20"
          />
        </div>

        <div className="form-group">
          <label>Minimum Stock</label>
          <input
            type="number"
            min="0"
            value={productForm.min_stock_quantity}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                min_stock_quantity: event.target.value,
              })
            }
            placeholder="e.g. 5"
          />
        </div>

        <div className="form-group">
          <label>Warehouse Location</label>
          <input
            type="text"
            value={productForm.warehouse_location}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                warehouse_location: event.target.value,
              })
            }
            placeholder="e.g. Warehouse A"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={productForm.description}
            onChange={(event) =>
              setProductForm({
                ...productForm,
                description: event.target.value,
              })
            }
            placeholder="Product description"
          />
        </div>
      </div>

      {productMessage && (
        <div className="customer-message">
          {productMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowProductForm(false);
            setProductMessage("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={productSubmitting}
        >
          {productSubmitting ? "Creating..." : "Create Product"}
        </button>
      </div>
    </form>
  </div>
)}

    <div className="data-card">
      <div className="table-header">
        <h3>Product List</h3>
        <span>{products.length} products</span>
      </div>

      {loading ? (
        <div className="loading-message">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="empty-message">
          No products found.
        </div>
      ) : (
        <div className="table-container">
<table>
  <thead>
    <tr>
      <th>Product</th>
      <th>SKU</th>
      <th>Category</th>
      <th>Price</th>
      <th>Stock</th>
      <th>Warehouse</th>

      {userRole === "admin" && (
        <th>Created By</th>
      )}

      <th>Status</th>
      <th>Created At</th>
    </tr>
  </thead>

  <tbody>
    {products.map((product) => (
      <tr key={product.id}>
        <td>
          <strong>{product.name}</strong>
        </td>

        <td>{product.sku}</td>

        <td>{product.category || "—"}</td>

        <td>
          ₹{Number(product.price).toLocaleString("en-IN")}
        </td>

        <td>
          <strong>{product.stock_quantity}</strong>
        </td>

        <td>
          {product.warehouse_location || "—"}
        </td>

        {userRole === "admin" && (
          <td>
            {product.created_by_name || "—"}
          </td>
        )}

        <td>
          {product.status === "PENDING_APPROVAL" && userRole === "admin" ? (
            <div className="customer-status-cell">
              <div>⏳ PENDING APPROVAL</div>

              <div className="customer-status-actions">
                <button
                  type="button"
                  className="approve-button"
                  onClick={async () => {
                    try {
                      await approveProduct(product.id);

                      const updatedProductData = await getProducts();

                      setProducts(
                        updatedProductData.products || []
                      );
                    } catch (error) {
                      console.error(
                        "Approve product error:",
                        error
                      );
                    }
                  }}
                >
                  ✓ Approve
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={async () => {
                    try {
                      await cancelProduct(product.id);

                      const updatedProductData = await getProducts();

                      setProducts(
                        updatedProductData.products || []
                      );
                    } catch (error) {
                      console.error(
                        "Cancel product error:",
                        error
                      );
                    }
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          ) : (
            <span>
              {product.status === "PENDING_APPROVAL"
                ? "⏳ PENDING APPROVAL"
                : product.status === "APPROVED"
                ? "✓ APPROVED"
                : product.status === "CANCELLED"
                ? "✕ CANCELLED"
                : product.status || "—"}
            </span>
          )}
        </td>

        <td>
          {product.created_at
            ? new Date(product.created_at).toLocaleString("en-IN")
            : "—"}
        </td>
      </tr>
    ))}
  </tbody>
</table>
        </div>
      )}
    </div>
  </section>
)}
{activePage === "Inventory" && (
  <section className="module-page">
    <div className="module-header">
      <div>
        <p>Monitor current stock levels and inventory movements.</p>
      </div>
      
      <div className="inventory-actions">
        <button
  className="secondary-button"
  onClick={() => {
    setShowStockOutForm(true);
    setStockOutMessage("");
  }}
>
  Stock Out
</button>

        <button
  className="primary-button"
  onClick={() => {
    setShowStockInForm(true);
    setStockInMessage("");
  }}
>
  + Stock In
</button>
      </div>
    </div>
    {showStockInForm && (
  <div className="customer-form-card">
    <div className="form-header">
      <div>
        <h3>Add Stock</h3>
        <p>Increase the available stock for a product.</p>
      </div>

      <button
        className="close-button"
        type="button"
        onClick={() => {
          setShowStockInForm(false);
          setStockInMessage("");
        }}
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleStockIn}>
      <div className="form-grid">
        <div className="form-group">
          <label>Product *</label>

          <select
            value={stockInForm.product_id}
            onChange={(event) =>
              setStockInForm({
                ...stockInForm,
                product_id: event.target.value,
              })
            }
            required
          >
            <option value="">Select a product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity *</label>

          <input
            type="number"
            min="1"
            value={stockInForm.quantity}
            onChange={(event) =>
              setStockInForm({
                ...stockInForm,
                quantity: event.target.value,
              })
            }
            placeholder="Enter quantity"
            required
          />
        </div>

        <div className="form-group">
          <label>Reason</label>

          <input
            type="text"
            value={stockInForm.reason}
            onChange={(event) =>
              setStockInForm({
                ...stockInForm,
                reason: event.target.value,
              })
            }
            placeholder="e.g. New stock received"
          />
        </div>
      </div>

      {stockInMessage && (
        <div className="customer-message">
          {stockInMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowStockInForm(false);
            setStockInMessage("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={stockInSubmitting}
        >
          {stockInSubmitting ? "Adding..." : "Add Stock"}
        </button>
      </div>
    </form>
  </div>
)}
{showStockOutForm && (
  <div className="customer-form-card">
    <div className="form-header">
      <div>
        <h3>Remove Stock</h3>
        <p>Reduce the available stock for a product.</p>
      </div>

      <button
        className="close-button"
        type="button"
        onClick={() => {
          setShowStockOutForm(false);
          setStockOutMessage("");
        }}
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleStockOut}>
      <div className="form-grid">
        <div className="form-group">
          <label>Product *</label>

          <select
            value={stockOutForm.product_id}
            onChange={(event) =>
              setStockOutForm({
                ...stockOutForm,
                product_id: event.target.value,
              })
            }
            required
          >
            <option value="">Select a product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku}) — Stock:{" "}
                {product.stock_quantity}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity *</label>

          <input
            type="number"
            min="1"
            value={stockOutForm.quantity}
            onChange={(event) =>
              setStockOutForm({
                ...stockOutForm,
                quantity: event.target.value,
              })
            }
            placeholder="Enter quantity"
            required
          />
        </div>

        <div className="form-group">
          <label>Reason</label>

          <input
            type="text"
            value={stockOutForm.reason}
            onChange={(event) =>
              setStockOutForm({
                ...stockOutForm,
                reason: event.target.value,
              })
            }
            placeholder="e.g. Customer order"
          />
        </div>
      </div>

      {stockOutMessage && (
        <div className="customer-message">
          {stockOutMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowStockOutForm(false);
            setStockOutMessage("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={stockOutSubmitting}
        >
          {stockOutSubmitting ? "Removing..." : "Remove Stock"}
        </button>
      </div>
    </form>
  </div>
)}
    <div className="data-card">
      <div className="table-header">
        <h3>Current Inventory</h3>
        <span>{products.length} products</span>
      </div>

      {loading ? (
        <div className="loading-message">
          Loading inventory...
        </div>
      ) : products.length === 0 ? (
        <div className="empty-message">
          No products found.
        </div>
      ) : (
        <div className="table-container">
          <table>
           <thead>
  <tr>
    <th>Product</th>
    <th>SKU</th>
    <th>Category</th>
    <th>Current Stock</th>
    <th>Minimum Stock</th>
    <th>Warehouse</th>

    {userRole === "admin" && <th>Created By</th>}

    <th>Status</th>
    <th>Created At</th>
  </tr>
</thead>

            <tbody>
              {products.map((product) => {
                const stock = Number(product.stock_quantity || 0);
const minimum = Number(
  product.min_stock_quantity || 0
);

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name">
                        <div className="product-icon">▣</div>
                        <strong>{product.name}</strong>
                      </div>
                    </td>

                    <td>{product.sku}</td>

                    <td>{product.category || "—"}</td>

                    <td>
                      <strong>{stock}</strong>
                    </td>

                    <td>{minimum}</td>

                    <td>
                      {product.warehouse_location || "—"}
                    </td>

                   {userRole === "admin" && (
  <td>
    {product.created_by_name || "—"}
  </td>
)}

<td>
  <span
    className={`inventory-status ${
      product.status === "PENDING_APPROVAL"
        ? "pending"
        : product.status === "CANCELLED"
        ? "cancelled"
        : "approved"
    }`}
  >
    {product.status === "PENDING_APPROVAL"
      ? "⏳ PENDING APPROVAL"
      : product.status === "CANCELLED"
      ? "✕ CANCELLED"
      : "✓ APPROVED"}
  </span>

  {userRole === "admin" &&
    product.status === "PENDING_APPROVAL" && (
      <div className="inventory-actions">
        <button type="button">
          Approve
        </button>

        <button type="button">
          Cancel
        </button>
      </div>
    )}
</td>

<td>
  {product.created_at
    ? new Date(product.created_at).toLocaleString("en-IN")
    : "—"}
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    <div className="data-card movement-card">
  <div className="table-header">
    <div>
      <h3>Recent Stock Movements</h3>
      <p className="table-subtitle">
        Latest inventory transactions
      </p>
    </div>

    <span>{stockMovements.length} movements</span>
  </div>

  {stockMovements.length === 0 ? (
    <div className="empty-message">
      No stock movements found.
    </div>
  ) : (
    <div className="table-container">
      <table>
        <thead>
          <tr>
  <th>Product</th>
  <th>Type</th>
  <th>Quantity</th>

  {userRole === "admin" && <th>Requested By</th>}

  <th>Status</th>
  <th>Created At</th>
</tr>
        </thead>

        <tbody>
          {stockMovements.map((movement) => (
            <tr key={movement.id}>
              <td>
                <strong>{movement.product_name}</strong>
                <div className="movement-sku">
                  {movement.sku}
                </div>
              </td>

              <td>
                <span
                  className={`movement-badge ${
                    movement.movement_type === "IN"
                      ? "movement-in"
                      : "movement-out"
                  }`}
                >
                  {movement.movement_type === "IN"
                    ? "↑ IN"
                    : "↓ OUT"}
                </span>
              </td>

              <td>
  <strong>{movement.quantity}</strong>
</td>

{userRole === "admin" && (
  <td>{movement.requested_by || "—"}</td>
)}

<td>
  <span
    className={`inventory-status ${
      movement.status === "PENDING_APPROVAL"
        ? "pending"
        : movement.status === "CANCELLED"
        ? "cancelled"
        : "approved"
    }`}
  >
    {movement.status === "PENDING_APPROVAL"
      ? "⏳ PENDING APPROVAL"
      : movement.status === "CANCELLED"
      ? "✕ CANCELLED"
      : "✓ APPROVED"}
  </span>

  {userRole === "admin" && 
  movement.status === "PENDING_APPROVAL" && ( 
   <div className="inventory-actions">
  <button
  type="button"
  className="approve-button"
  onClick={async () => {
    try {
      await approveStockMovement(movement.id);

      const updatedMovementData = await getStockMovements();

      setStockMovements(
        updatedMovementData.movements || []
      );
    } catch (error) {
      console.error(
        "Approve stock movement error:",
        error
      );
    }
  }}
>
  ✓ Approve
</button>

 <button
  type="button"
  className="cancel-button"
  onClick={async () => {
    try {
      await cancelStockMovement(movement.id);

      const updatedMovementData = await getStockMovements();

      setStockMovements(
        updatedMovementData.movements || []
      );
    } catch (error) {
      console.error(
        "Cancel stock movement error:",
        error
      );
    }
  }}
>
  ✕ Cancel
</button>
</div>
  )}
</td>

<td>
  {movement.created_at
    ? new Date(
        movement.created_at
      ).toLocaleString("en-IN")
    : "—"}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
  </section>
)}
{activePage === "Sales Challans" && (
  <section className="module-page">

    <div className="module-header">

     <div>
  <p>Create your new sales challans and manage existing ones.</p>
</div>
      <button
        className="primary-button"
        onClick={() => {
          setShowChallanForm(true);
          setChallanMessage("");
        }}
      >
        + Create Challan
      </button>

  </div>


{showChallanForm && (
  <div className="customer-form-card">
    <div className="form-header">
      <div>
        <h3>Create Sales Challan</h3>
        <p>Select a customer and add products to the challan.</p>
      </div>

      <button
        className="close-button"
        type="button"
        onClick={() => {
          setShowChallanForm(false);
          setChallanMessage("");
        }}
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleCreateChallan}>

      <div className="form-grid">

        <div className="form-group">
          <label>Customer *</label>

          <select
            value={challanForm.customer_id}
            onChange={(event) =>
              setChallanForm({
                ...challanForm,
                customer_id: event.target.value,
              })
            }
            required
          >
            <option value="">
              Select a customer
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tax %</label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={challanForm.tax_percent}
            onChange={(event) =>
              setChallanForm({
                ...challanForm,
                tax_percent: event.target.value,
              })
            }
          />
        </div>

      </div>

      <div className="challan-items-section">

        <div className="items-header">
          <h4>Products</h4>
        </div>

        {challanForm.items.map((item, index) => (
          <div
            className="challan-item-row"
            key={index}
          >

            <div className="form-group">
              <label>Product *</label>

              <select
                value={item.product_id}
                onChange={(event) => {
                  const updatedItems = [
                    ...challanForm.items,
                  ];

                  updatedItems[index].product_id =
                    event.target.value;

                  setChallanForm({
                    ...challanForm,
                    items: updatedItems,
                  });
                }}
                required
              >
                <option value="">
                  Select a product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity *</label>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => {
                  const updatedItems = [
                    ...challanForm.items,
                  ];

                  updatedItems[index].quantity =
                    event.target.value;

                  setChallanForm({
                    ...challanForm,
                    items: updatedItems,
                  });
                }}
                placeholder="Enter quantity"
                required
              />
            </div>

          </div>
        ))}

      </div>

      {challanMessage && (
        <div className="customer-message">
          {challanMessage}
        </div>
      )}

      <div className="form-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowChallanForm(false);
            setChallanMessage("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={challanSubmitting}
        >
          {challanSubmitting
            ? "Creating..."
            : "Create Challan"}
        </button>

      </div>

    </form>
  </div>
)}

{displayedChallan && (
  <div className="data-card challan-card">
    <div className="table-header">
      <div>
        <h3>{displayedChallan.challan_number}</h3>

        <p className="table-subtitle">
          Challan created successfully
        </p>
      </div>

      <span className="challan-status">
        {displayedChallan.status === "PENDING_APPROVAL"
          ? "⏳ PENDING APPROVAL"
          : displayedChallan.status === "CONFIRMED"
          ? "✓ CONFIRMED"
          : displayedChallan.status === "CANCELLED"
          ? "✕ CANCELLED"
          : "DRAFT"}
      </span>
    </div>

    <div className="challan-summary">
      <div>
        <span>Subtotal</span>
        <strong>
          ₹{Number(displayedChallan.subtotal).toLocaleString("en-IN")}
        </strong>
      </div>

      <div>
        <span>
          Tax ({Number(displayedChallan.tax_percent)}%)
        </span>
        <strong>
          ₹{Number(displayedChallan.tax_amount).toLocaleString("en-IN")}
        </strong>
      </div>

      <div>
        <span>Grand Total</span>
        <strong>
          ₹{Number(displayedChallan.grand_total).toLocaleString("en-IN")}
        </strong>
      </div>
    </div>

<div className="form-actions">

  {userRole === "admin" &&
  displayedChallan.status === "PENDING_APPROVAL" ? (
    <>
      <button
        type="button"
        className="approve-button"
        onClick={async () => {
          try {
            const result = await confirmChallan(
              displayedChallan.id
            );

            setCreatedChallan(result.challan);

            const updatedChallanData = await getChallans();

            setChallans(
              updatedChallanData.challans || []
            );

            setChallanMessage(
              "Challan approved successfully!"
            );

          } catch (error) {
            console.error(
              "Approve challan error:",
              error
            );

            setChallanMessage(
              error.message ||
                "Failed to approve challan"
            );
          }
        }}
      >
        ✓ Approve
      </button>

      <button
        type="button"
        className="cancel-button"
        onClick={async () => {
          try {
            const result = await cancelChallan(
              displayedChallan.id
            );

            setCreatedChallan(result.challan);

            const updatedChallanData = await getChallans();

            setChallans(
              updatedChallanData.challans || []
            );

            setChallanMessage(
              "Challan cancelled successfully!"
            );

          } catch (error) {
            console.error(
              "Cancel challan error:",
              error
            );

            setChallanMessage(
              error.message ||
                "Failed to cancel challan"
            );
          }
        }}
      >
        ✕ Cancel
      </button>
    </>
  ) : displayedChallan.status === "DRAFT" &&
    userRole !== "admin" ? (
    <button
      type="button"
      className="primary-button"
      onClick={async () => {
  try {
    const result = await requestChallanApproval(
      displayedChallan.id
    );

    setCreatedChallan(result.challan);

    const updatedChallanData = await getChallans();

    setChallans(
      updatedChallanData.challans || []
    );

    setChallanMessage(
      "Challan sent to admin for approval!"
    );

    setTimeout(() => {
      setCreatedChallan(null);
    }, 4000);

  } catch (error) {
    console.error(
      "Request approval error:",
      error
    );

    setChallanMessage(
      error.message ||
        "Failed to send challan for approval"
    );
  }
}}
    >
      ✓ Confirm & Send for Approval
    </button>
  ) : displayedChallan.status === "PENDING_APPROVAL" ? (
    <button
      type="button"
      className="primary-button"
      disabled
    >
      ⏳ Waiting for Admin Approval
    </button>
  ) : displayedChallan.status === "CONFIRMED" ? (
    <button
      type="button"
      className="primary-button"
      disabled
    >
      ✓ Challan Confirmed
    </button>
  ) : displayedChallan.status === "CANCELLED" ? (
    <button
      type="button"
      className="primary-button"
      disabled
    >
      ✕ Challan Cancelled
    </button>
  ) : null}

</div>

    {challanMessage && (
      <div className="customer-message">
        {challanMessage}
      </div>
    )}
  </div>
)}

<div className="data-card">
  <div className="table-header">
    <div>
      <h3>Challan History</h3>
      <p className="table-subtitle">
        All sales challans created in the system
      </p>
    </div>

    <span>{challans.length} challans</span>
  </div>

  {challans.length === 0 ? (
    <div className="empty-message">
      No challans found.
    </div>
  ) : (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Challan No.</th>
            <th>Customer</th>
            <th>Subtotal</th>
            <th>Tax</th>
            <th>Grand Total</th>
            {userRole === "admin" && (
  <th>Created By</th>
)}
            <th>Status</th>
            <th>Created AT</th>
          </tr>
        </thead>

        <tbody>
        
          {challans.map((challan) => (
            <tr key={challan.id}>
              <td>
                <strong>{challan.challan_number}</strong>
              </td>

              <td>
                {challan.customer_name || "—"}
              </td>

              <td>
                ₹{Number(challan.subtotal).toLocaleString("en-IN")}
              </td>

              <td>
                ₹{Number(challan.tax_amount).toLocaleString("en-IN")}
              </td>

              <td>
                <strong>
                  ₹{Number(challan.grand_total).toLocaleString("en-IN")}
                </strong>
              </td>
              {userRole === "admin" && (
<td>
  {challan.created_by_name || "—"}
</td>
)}

<td>
  {challan.status === "PENDING_APPROVAL" && userRole === "admin" ? (
    <div className="challan-admin-actions">
      <span className="challan-status pending_approval">
        ⏳ PENDING APPROVAL
      </span>

      <div className="challan-action-buttons">
        <button
          type="button"
          className="approve-button"
         onClick={async () => {
  try {
    await confirmChallan(challan.id);

    const updatedChallanData = await getChallans();

    setChallans(
      updatedChallanData.challans || []
    );

    setChallanMessage(
      "Challan approved successfully!"
    );

    setTimeout(() => {
      setCreatedChallan(null);
    }, 4000);

  } catch (error) {
    console.error(
      "Approve challan error:",
      error
    );

    setChallanMessage(
      error.message ||
        "Failed to approve challan"
    );
  }
}}
        >
          ✓ Approve
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={async () => {
            try {
await cancelChallan(challan.id);

const updatedChallanData = await getChallans();

setChallans(
  updatedChallanData.challans || []
);

setChallanMessage(
  "Challan cancelled successfully!"
);
            } catch (error) {
              console.error(
                "Cancel challan error:",
                error
              );

              setChallanMessage(
                error.message ||
                  "Failed to cancel challan"
              );
            }
          }}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  ) : (
    <span
      className={`challan-status ${challan.status.toLowerCase()}`}
    >
      {challan.status === "PENDING_APPROVAL"
        ? "⏳ PENDING APPROVAL"
        : challan.status === "CONFIRMED"
        ? "✓ CONFIRMED"
        : challan.status === "CANCELLED"
        ? "✕ CANCELLED"
        : "DRAFT"}
    </span>
  )}
</td>
              <td>
                {new Date(challan.created_at).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

  </section>
)}
      </main>
    </div>
  );
}

export default App;
