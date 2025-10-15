(function() {
    const tabLinks = document.querySelectorAll('[data-tab]');
    const tabPanels = document.querySelectorAll('[data-tab-panel]');
    const currentDateEl = document.getElementById('current-date');
    const usernameDisplay = document.getElementById('username-display');

    // Simple in-memory store
    const store = {
        orders: [
            { id: 'ORD-2154', customer: 'John Banda', items: '2 Beer, Chips', amount: 85.00, status: 'completed', time: '14:30' },
            { id: 'ORD-2153', customer: 'Sarah Mwale', items: 'Wine, Chicken', amount: 120.50, status: 'preparing', time: '14:15' },
            { id: 'ORD-2152', customer: 'Mike Tembo', items: '3 Beer, Nshima', amount: 65.00, status: 'completed', time: '13:45' },
            { id: 'ORD-2151', customer: 'Room 12', items: 'Whisky, Snacks', amount: 95.00, status: 'serving', time: '13:20' }
        ],
        payments: [
            { id: 'PAY-1001', orderId: 'ORD-2154', method: 'cash', amount: 85.00, time: '14:31' },
            { id: 'PAY-1000', orderId: 'ORD-2152', method: 'card', amount: 65.00, time: '13:50' }
        ]
    };

    function setToday() {
        if (!currentDateEl) return;
        const now = new Date();
        const formatted = now.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        currentDateEl.textContent = formatted;
    }

    function showTab(id) {
        tabPanels.forEach(panel => {
            if (panel.id === id) {
                panel.removeAttribute('hidden');
            } else if (panel.hasAttribute('data-tab-panel')) {
                panel.setAttribute('hidden', '');
            }
        });
        // Update sidebar active item
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        document.querySelectorAll(`.sidebar-menu a[data-tab="${id}"]`).forEach(a => a.parentElement.classList.add('active'));
    }

    function wireTabs() {
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('data-tab');
                if (id) showTab(id);
            });
        });
    }

    function renderOrdersTable(filter) {
        const tbody = document.querySelector('#orders-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        let rows = store.orders;
        if (filter && filter !== 'all') rows = rows.filter(o => o.status === filter);
        rows.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${o.id}</td>
                <td>${o.customer}</td>
                <td>${o.items}</td>
                <td>ZK ${o.amount.toFixed(2)}</td>
                <td><span class="status ${o.status === 'completed' ? 'completed' : 'pending'}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                <td>${o.time}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderPaymentsTable(method) {
        const tbody = document.querySelector('#payments-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        let rows = store.payments;
        if (method && method !== 'all') rows = rows.filter(p => p.method === method);
        rows.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${p.id}</td>
                <td>#${p.orderId}</td>
                <td>${p.method}</td>
                <td>ZK ${p.amount.toFixed(2)}</td>
                <td>${p.time}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function wireFilters() {
        const ordersFilter = document.getElementById('ordersStatusFilter');
        if (ordersFilter) {
            ordersFilter.addEventListener('change', () => renderOrdersTable(ordersFilter.value));
        }
        const paymentsFilter = document.getElementById('paymentsMethodFilter');
        if (paymentsFilter) {
            paymentsFilter.addEventListener('change', () => renderPaymentsTable(paymentsFilter.value));
        }
    }

    function wireNewOrderForm() {
        const form = document.getElementById('new-order-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const customer = document.getElementById('orderCustomer').value.trim();
            const items = document.getElementById('orderItems').value.trim();
            const amount = parseFloat(document.getElementById('orderAmount').value);
            const status = document.getElementById('orderStatus').value;
            if (!customer || !items || isNaN(amount)) return;

            const idNum = 2155 + store.orders.length; // simple demo id
            const id = `ORD-${idNum}`;
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            store.orders.unshift({ id, customer, items, amount, status, time });

            // Optionally add a payment if status completed
            if (status === 'completed') {
                const payId = `PAY-${1001 + store.payments.length}`;
                store.payments.unshift({ id: payId, orderId: id, method: 'cash', amount, time });
            }

            form.reset();
            renderOrdersTable(document.getElementById('ordersStatusFilter')?.value || 'all');
            showTab('tab-orders');
        });
    }

    function init() {
        setToday();
        wireTabs();
        wireFilters();
        wireNewOrderForm();
        renderOrdersTable('all');
        renderPaymentsTable('all');
        // Default view remains dashboard
        showTab('tab-dashboard');
        // Demo: pull username from localStorage if set by login flow
        try {
            const u = localStorage.getItem('pos.username');
            if (u && usernameDisplay) usernameDisplay.textContent = u;
        } catch {}
    }

    document.addEventListener('DOMContentLoaded', init);
})();


