// Complete POS Dashboard Functionality
class POSDashboard {
    constructor() {
        this.database = posDatabase;
        this.currentUser = null;
        this.currentOrder = [];
        this.currentSection = 'dashboard';
        this.updateInterval = null;
    }

    init() {
        this.checkAuthentication();
        this.initializeUserInterface();
        this.loadDashboardData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.showSection('dashboard');
    }

 checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const username = localStorage.getItem('username');
        const userRole = localStorage.getItem('userRole');
        const displayName = localStorage.getItem('displayName');
        
        if (!isLoggedIn || isLoggedIn !== 'true') {
            alert('Please login first');
            window.location.href = 'index.html';
            return;
        }
        
        this.currentUser = {
            username,
            role: userRole,
            displayName: displayName || username
        };
    }
        
        // Check if login session is still valid (optional: add session timeout)
        if (loginTimestamp) {
            const loginTime = parseInt(loginTimestamp);
            const currentTime = Date.now();
            const sessionDuration = currentTime - loginTime;
            const maxSessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
            
            if (sessionDuration > maxSessionDuration) {
                this.redirectToLogin('Session expired. Please login again.');
                return;
            }
        } else {
            // If no timestamp exists, it's an invalid session
            this.redirectToLogin('Invalid session. Please login again.');
            return;
        }
        
        // Verify user exists in database
        const userExists = this.database.users && 
                          this.database.users.some(user => user.username === username && user.role === userRole);
        
        if (!userExists) {
            this.redirectToLogin('User not found. Please login again.');
            return;
        }
        
        this.currentUser = {
            username,
            role: userRole,
            displayName: displayName || username
        };
    }

    redirectToLogin(message) {
        // Clear all authentication data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('displayName');
        localStorage.removeItem('loginTimestamp');
        
        alert(message);
        window.location.href = 'index.html';
    }

    initializeUserInterface() {
        // Update user info
        document.getElementById('username-display').textContent = this.currentUser.displayName;
        document.getElementById('user-role-display').textContent = this.getRoleDisplayName(this.currentUser.role);
        document.getElementById('user-role-badge').textContent = this.getRoleDisplayName(this.currentUser.role);
        document.getElementById('user-role-badge').className = `user-role-badge ${this.currentUser.role}`;
        
        // Update current date
        this.updateCurrentDate();
        
        // Setup role-based UI
        this.setupRoleBasedUI();
    }

    getRoleDisplayName(role) {
        const roles = {
            'admin': 'Administrator',
            'cashier': 'Cashier',
            'waiter': 'Waiter'
        };
        return roles[role] || 'User';
    }

    setupRoleBasedUI() {
        // Disable certain features based on role
        if (this.currentUser.role === 'waiter') {
            const checkoutBtn = document.getElementById('checkout-btn');
            const processPaymentBtn = document.getElementById('process-payment-btn');
            
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            if (processPaymentBtn) processPaymentBtn.style.display = 'none';
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    loadDashboardData() {
        this.updateStats();
        this.loadMenuItems();
        this.loadRecentActivities();
        this.loadActiveOrders();
        this.loadCustomers();
        this.loadSettings();
    }

    updateStats() {
        const revenue = this.database.getTodayRevenue();
        const activeOrders = this.database.getActiveOrders().length;
        const foodSales = this.database.getCategorySales('food');
        const drinksSales = this.database.getCategorySales('drinks');

        const revenueAmount = document.getElementById('revenue-amount');
        const ordersCount = document.getElementById('orders-count');
        const foodSalesEl = document.getElementById('food-sales');
        const drinksSalesEl = document.getElementById('drinks-sales');

        if (revenueAmount) revenueAmount.textContent = this.formatCurrency(revenue);
        if (ordersCount) ordersCount.textContent = activeOrders;
        if (foodSalesEl) foodSalesEl.textContent = this.formatCurrency(foodSales);
        if (drinksSalesEl) drinksSalesEl.textContent = this.formatCurrency(drinksSales);

        // Update trends (simplified)
        const revenueTrend = document.getElementById('revenue-trend');
        const ordersTrend = document.getElementById('orders-trend');
        
        if (revenueTrend) {
            revenueTrend.textContent = '+12% from yesterday';
            revenueTrend.className = 'trend positive';
        }
        if (ordersTrend) {
            ordersTrend.textContent = '+3 new orders';
            ordersTrend.className = 'trend positive';
        }
    }

    formatCurrency(amount) {
        return amount.toLocaleString('en-KE');
    }

    loadMenuItems() {
        const grid = document.getElementById('menu-items-grid');
        if (!grid) return;
        
        const availableItems = this.database.menuItems.filter(item => item.available);
        
        grid.innerHTML = availableItems.map(item => `
            <div class="menu-item ${item.category} ${item.stock === 0 ? 'out-of-stock' : ''}" 
                 onclick="posDashboard.addToOrder(${item.id})">
                <span class="item-category">${item.subcategory}</span>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-price">KES ${item.price}</div>
                <div class="item-stock ${item.stock < 10 ? 'stock-low' : ''} ${item.stock === 0 ? 'stock-out' : ''}">
                    Stock: ${item.stock}
                </div>
            </div>
        `).join('');
    }

    addToOrder(itemId) {
        const item = this.database.menuItems.find(i => i.id === itemId);
        if (!item || item.stock === 0) {
            this.showNotification(`${item.name} is out of stock!`, 'error');
            return;
        }

        const existingItem = this.currentOrder.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.currentOrder.push({
                ...item,
                quantity: 1
            });
        }

        this.updateOrderDisplay();
        this.database.logActivity(
            `${this.currentUser.displayName} added ${item.name} to order`,
            this.currentUser.username,
            'info'
        );
    }

    updateOrderDisplay() {
        const orderContainer = document.getElementById('order-items');
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');

        if (!orderContainer) return;

        if (this.currentOrder.length === 0) {
            orderContainer.innerHTML = `
                <div class="empty-order">
                    <p>No items in order</p>
                    <small>Add items from the menu</small>
                </div>
            `;
        } else {
            orderContainer.innerHTML = this.currentOrder.map(item => `
                <div class="order-item">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">KES ${item.price} × ${item.quantity}</div>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn" onclick="posDashboard.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="posDashboard.updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="posDashboard.removeFromOrder(${item.id})">×</button>
                    </div>
                </div>
            `).join('');
        }

        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.database.settings.taxRate;
        const total = subtotal + tax;

        if (subtotalElement) subtotalElement.textContent = `KES ${this.formatCurrency(subtotal)}`;
        if (taxElement) taxElement.textContent = `KES ${this.formatCurrency(tax)}`;
        if (totalElement) totalElement.textContent = `KES ${this.formatCurrency(total)}`;
    }

    calculateSubtotal() {
        return this.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    updateQuantity(itemId, change) {
        const item = this.currentOrder.find(i => i.id === itemId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromOrder(itemId);
            } else {
                this.updateOrderDisplay();
            }
        }
    }

    removeFromOrder(itemId) {
        this.currentOrder = this.currentOrder.filter(item => item.id !== itemId);
        this.updateOrderDisplay();
    }

    // Order Management
    createNewOrder() {
        this.currentOrder = [];
        this.updateOrderDisplay();
        this.showNotification('New order created!', 'success');
        this.database.logActivity(
            `${this.currentUser.displayName} started a new order`,
            this.currentUser.username,
            'info'
        );
    }

    sendToKitchen() {
        if (this.currentOrder.length === 0) {
            this.showNotification('No items in order to send to kitchen', 'error');
            return;
        }

        const table = document.getElementById('table-select').value;
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.database.settings.taxRate;
        const total = subtotal + tax;

        const orderData = {
            table: table,
            waiter: this.currentUser.displayName,
            items: [...this.currentOrder],
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: 'pending'
        };

        const order = this.database.createOrder(orderData);
        
        this.createNewOrder();
        this.loadActiveOrders();
        
        this.showNotification(`Order sent to kitchen! Order ID: ${order.id}`, 'success');
        this.database.logActivity(
            `${this.currentUser.displayName} sent order ${order.id} to kitchen for ${table}`,
            this.currentUser.username,
            'success'
        );
    }

    processPayment() {
        if (this.currentOrder.length === 0) {
            this.showNotification('No items in order to process payment', 'error');
            return;
        }

        const orderId = 'PAY-' + Date.now();
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.database.settings.taxRate;
        const total = subtotal + tax;

        const paymentData = {
            orderId: orderId,
            amount: total,
            method: 'cash',
            cashier: this.currentUser.displayName,
            timestamp: new Date().toISOString()
        };

        // Add to sales journal
        this.database.salesJournal.push({
            orderId: orderId,
            timestamp: new Date().toISOString(),
            waiter: 'Direct Sale',
            items: this.currentOrder,
            amount: total,
            tax: tax,
            paymentMethod: 'cash',
            cashier: this.currentUser.displayName
        });

        this.database.saveSalesJournal();
        this.createNewOrder();
        this.updateStats();
        
        this.showNotification(`Payment of KES ${this.formatCurrency(total)} processed successfully!`, 'success');
        this.database.logActivity(
            `${this.currentUser.displayName} processed payment of KES ${this.formatCurrency(total)}`,
            this.currentUser.username,
            'success'
        );
    }

    // Section Management
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all menu items
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        const sectionElement = document.getElementById(sectionName + '-section');
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        // Activate corresponding menu item
        const menuItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (menuItem) {
            menuItem.parentElement.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'orders':
                this.loadActiveOrders();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadActiveOrders() {
        const activeOrders = this.database.getActiveOrders();
        const tableBody = document.getElementById('active-orders-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = activeOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.table}</td>
                <td>${order.waiter}</td>
                <td>${order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}</td>
                <td>KES ${this.formatCurrency(order.total)}</td>
                <td><span class="status ${order.status}">${order.status}</span></td>
                <td>${new Date(order.timestamp).toLocaleTimeString()}</td>
                <td>
                    ${this.currentUser.role !== 'waiter' ? `
                        <button class="action-btn complete" onclick="posDashboard.completeOrder('${order.id}')">
                            Complete
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    completeOrder(orderId) {
        const paymentData = {
            method: 'cash',
            cashier: this.currentUser.displayName,
            timestamp: new Date().toISOString()
        };
        
        this.database.completeOrder(orderId, paymentData);
        this.loadActiveOrders();
        this.updateStats();
        
        this.showNotification(`Order ${orderId} completed!`, 'success');
        this.database.logActivity(
            `${this.currentUser.displayName} completed order ${orderId}`,
            this.currentUser.username,
            'success'
        );
    }

    loadInventory() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        grid.innerHTML = this.database.menuItems.map(item => `
            <div class="inventory-item">
                <div class="inventory-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <div class="inventory-details">
                        <span>Price: KES ${item.price}</span>
                        <span>Stock: ${item.stock}</span>
                        <span>Category: ${item.subcategory}</span>
                    </div>
                </div>
                <div class="inventory-actions">
                    <button class="action-btn" onclick="posDashboard.updateStock(${item.id}, 1)">+1</button>
                    <button class="action-btn" onclick="posDashboard.updateStock(${item.id}, -1)">-1</button>
                    <button class="action-btn warning" onclick="posDashboard.updateStock(${item.id}, 10)">+10</button>
                </div>
            </div>
        `).join('');
    }

    updateStock(itemId, change) {
        const item = this.database.menuItems.find(i => i.id === itemId);
        if (item) {
            item.stock += change;
            if (item.stock < 0) item.stock = 0;
            this.database.saveMenuItems();
            this.loadInventory();
            this.loadMenuItems();
            
            this.showNotification(`Updated ${item.name} stock to ${item.stock}`, 'success');
        }
    }

    loadCustomers() {
        const tableBody = document.getElementById('customers-body');
        if (!tableBody) return;

        tableBody.innerHTML = this.database.customers.map(customer => `
            <tr>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email}</td>
                <td>${customer.totalOrders}</td>
                <td>KES ${this.formatCurrency(customer.totalSpent)}</td>
                <td>${new Date(customer.lastVisit).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    loadReports() {
        const period = document.getElementById('report-period');
        if (!period) return;
        
        const reportData = this.database.getSalesReport(period.value);
        
        const totalRevenue = reportData.reduce((sum, entry) => sum + entry.amount, 0);
        const totalOrders = reportData.length;
        const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const reportRevenue = document.getElementById('report-revenue');
        const reportOrders = document.getElementById('report-orders');
        const reportAverage = document.getElementById('report-average');
        
        if (reportRevenue) reportRevenue.textContent = `KES ${this.formatCurrency(totalRevenue)}`;
        if (reportOrders) reportOrders.textContent = totalOrders;
        if (reportAverage) reportAverage.textContent = `KES ${this.formatCurrency(averageOrder)}`;
    }

    loadSettings() {
        const settings = this.database.settings;
        const hotelName = document.getElementById('hotel-name');
        const currencySelect = document.getElementById('currency-select');
        const taxRate = document.getElementById('tax-rate');
        const receiptFooter = document.getElementById('receipt-footer');
        
        if (hotelName) hotelName.value = settings.hotelName;
        if (currencySelect) currencySelect.value = settings.currency;
        if (taxRate) taxRate.value = settings.taxRate * 100;
        if (receiptFooter) receiptFooter.value = settings.receiptFooter;
    }

    saveSettings() {
        const hotelName = document.getElementById('hotel-name');
        const currencySelect = document.getElementById('currency-select');
        const taxRate = document.getElementById('tax-rate');
        const receiptFooter = document.getElementById('receipt-footer');
        
        if (!hotelName || !currencySelect || !taxRate || !receiptFooter) return;
        
        const settings = {
            hotelName: hotelName.value,
            currency: currencySelect.value,
            taxRate: parseFloat(taxRate.value) / 100,
            receiptFooter: receiptFooter.value
        };
        
        this.database.settings = settings;
        this.database.saveSettings();
        
        this.showNotification('Settings saved successfully!', 'success');
    }

    loadRecentActivities() {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;
        
        const activities = this.database.getRecentActivities(10);
        
        feed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                <span class="activity-text">${activity.message}</span>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return time.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    }

    // Real-time Updates
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateStats();
            this.loadRecentActivities();
            
            if (this.currentSection === 'orders') {
                this.loadActiveOrders();
            }
            if (this.currentSection === 'reports') {
                this.loadReports();
            }
        }, 5000); // Update every 5 seconds
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Quick Actions
        const newOrderBtn = document.getElementById('new-order-btn');
        const processPaymentBtn = document.getElementById('process-payment-btn');
        const viewReportsBtn = document.getElementById('view-reports-btn');
        const manageInventoryBtn = document.getElementById('manage-inventory-btn');
        const clearOrderBtn = document.getElementById('clear-order');
        const saveOrderBtn = document.getElementById('save-order-btn');
        const checkoutBtn = document.getElementById('checkout-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const refreshActivityBtn = document.getElementById('refresh-activity');
        const refreshOrdersBtn = document.getElementById('refresh-orders');
        const reportPeriod = document.getElementById('report-period');
        const downloadReportBtn = document.getElementById('download-report');
        const saveSettingsBtn = document.getElementById('save-settings');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const resetFiltersBtn = document.getElementById('reset-filters');
        const searchItems = document.getElementById('search-items');

        if (newOrderBtn) newOrderBtn.addEventListener('click', () => this.createNewOrder());
        if (processPaymentBtn) processPaymentBtn.addEventListener('click', () => this.processPayment());
        if (viewReportsBtn) viewReportsBtn.addEventListener('click', () => this.showSection('reports'));
        if (manageInventoryBtn) manageInventoryBtn.addEventListener('click', () => this.showSection('inventory'));
        if (clearOrderBtn) clearOrderBtn.addEventListener('click', () => this.createNewOrder());
        if (saveOrderBtn) saveOrderBtn.addEventListener('click', () => this.sendToKitchen());
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => this.processPayment());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        if (refreshActivityBtn) refreshActivityBtn.addEventListener('click', () => this.loadRecentActivities());
        if (refreshOrdersBtn) refreshOrdersBtn.addEventListener('click', () => this.loadActiveOrders());
        if (reportPeriod) reportPeriod.addEventListener('change', () => this.loadReports());
        if (downloadReportBtn) downloadReportBtn.addEventListener('click', () => this.downloadReport());
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.applyFilters());
        if (priceFilter) priceFilter.addEventListener('change', () => this.applyFilters());
        if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        if (searchItems) searchItems.addEventListener('input', () => this.applyFilters());
    }

    applyFilters() {
        // Simple filter implementation
        const category = document.getElementById('category-filter');
        const searchTerm = document.getElementById('search-items');
        
        if (!category || !searchTerm) return;
        
        const categoryValue = category.value;
        const searchValue = searchTerm.value.toLowerCase();
        
        const filteredItems = this.database.menuItems.filter(item => {
            const matchesCategory = categoryValue === 'all' || item.category === categoryValue || item.subcategory === categoryValue;
            const matchesSearch = item.name.toLowerCase().includes(searchValue) || 
                                item.description.toLowerCase().includes(searchValue);
            return matchesCategory && matchesSearch && item.available;
        });
        
        const grid = document.getElementById('menu-items-grid');
        if (!grid) return;
        
        grid.innerHTML = filteredItems.map(item => `
            <div class="menu-item ${item.category} ${item.stock === 0 ? 'out-of-stock' : ''}" 
                 onclick="posDashboard.addToOrder(${item.id})">
                <span class="item-category">${item.subcategory}</span>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-price">KES ${item.price}</div>
                <div class="item-stock ${item.stock < 10 ? 'stock-low' : ''} ${item.stock === 0 ? 'stock-out' : ''}">
                    Stock: ${item.stock}
                </div>
            </div>
        `).join('');
    }

    resetFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const searchItems = document.getElementById('search-items');
        
        if (categoryFilter) categoryFilter.value = 'all';
        if (priceFilter) priceFilter.value = 'all';
        if (searchItems) searchItems.value = '';
        this.loadMenuItems();
    }

    downloadReport() {
        this.showNotification('Report download started...', 'info');
        // In a real implementation, this would generate and download a PDF
        setTimeout(() => {
            this.showNotification('Report downloaded successfully!', 'success');
        }, 2000);
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container') || document.body;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    logout() {
        clearInterval(this.updateInterval);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('displayName');
        localStorage.removeItem('loginTimestamp');
        window.location.href = 'index.html';
    }
}

// Initialize the POS dashboard
const posDashboard = new POSDashboard();
document.addEventListener('DOMContentLoaded', () => posDashboard.init());
