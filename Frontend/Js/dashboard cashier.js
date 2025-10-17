document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    // Simulate a logged-in user. In a real app, this would come from the login process.
    const currentUser = {
        name: 'Jessica M.',
        id: 'user123'
    };
    
    // Using placeholder images for demonstration
    const menuItems = [
        { id: 1, name: 'Samosa', category: 'food', price: 50, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Samosa' },
        { id: 2, name: 'Beef Pilau', category: 'food', price: 350, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Pilau' },
        { id: 3, name: 'Grilled Chicken', category: 'food', price: 500, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Chicken' },
        { id: 4, name: 'Coca-Cola', category: 'drinks', price: 80, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Coke' },
        { id: 5, name: 'Fanta Passion', category: 'drinks', price: 80, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Fanta' },
        { id: 6, name: 'Mango Juice', category: 'drinks', price: 150, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Juice' },
        { id: 7, name: 'Ice Cream', category: 'desserts', price: 200, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Ice+Cream' },
        { id: 8, name: 'Chocolate Cake', category: 'desserts', price: 250, image: 'https://placehold.co/150x100/EFEFEF/333333?text=Cake' },
    ];

    let cart = [];

    // --- DOM ELEMENTS ---
    const menuItemsGrid = document.getElementById('menu-items-grid');
    const categoryBtnsContainer = document.getElementById('menu-categories');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartTaxEl = document.getElementById('cart-tax');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const currentUserEl = document.getElementById('current-user-name');
    
    const paymentModal = document.getElementById('payment-modal');
    const receiptModal = document.getElementById('receipt-modal');
    const paymentTotalEl = document.getElementById('payment-total');
    const closePaymentModalBtn = document.getElementById('close-payment-modal');
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    const newOrderBtn = document.getElementById('new-order-btn');
    const receiptContentEl = document.getElementById('receipt-content');
    
    // --- FUNCTIONS ---
    // (renderMenuItems, renderCart, updateCartSummary, addToCart, handleQuantityChange remain the same as before)
    // ... Copy those functions from your previous dashboard.js file ...
    // NOTE: For brevity, I'm only showing the MODIFIED functions below.
    // The functions that didn't change are still required.
    // START OF UNCHANGED FUNCTIONS (Make sure you have these)
    const renderMenuItems = (filter = 'all') => {
        menuItemsGrid.innerHTML = '';
        const filteredItems = menuItems.filter(item => filter === 'all' || item.category === filter);
        filteredItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'menu-item-card';
            itemCard.dataset.id = item.id;
            itemCard.innerHTML = `<img src="${item.image}" alt="${item.name}"><h4>${item.name}</h4><p>Ksh ${item.price.toFixed(2)}</p>`;
            menuItemsGrid.appendChild(itemCard);
        });
    };
    const renderCart = () => {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty-msg">Select items to begin an order.</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `<div class="cart-item-details"><strong>${item.name}</strong><br><small>Ksh ${item.price.toFixed(2)}</small></div><div class="cart-item-controls"><button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button><span>${item.quantity}</span><button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button></div><strong>Ksh ${(item.price * item.quantity).toFixed(2)}</strong>`;
                cartItemsContainer.appendChild(cartItem);
            });
        }
        updateCartSummary();
        checkoutBtn.disabled = cart.length === 0;
    };
    const updateCartSummary = () => {
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.16;
        const total = subtotal + tax;
        cartSubtotalEl.textContent = `Ksh ${subtotal.toFixed(2)}`;
        cartTaxEl.textContent = `Ksh ${tax.toFixed(2)}`;
        cartTotalEl.textContent = `Ksh ${total.toFixed(2)}`;
        paymentTotalEl.textContent = `Ksh ${total.toFixed(2)}`;
    };
    const addToCart = (itemId) => {
        const itemInCart = cart.find(item => item.id === itemId);
        if (itemInCart) {
            itemInCart.quantity++;
        } else {
            const itemToAdd = menuItems.find(item => item.id === itemId);
            cart.push({ ...itemToAdd, quantity: 1 });
        }
        renderCart();
    };
    const handleQuantityChange = (itemId, action) => {
        const itemInCart = cart.find(item => item.id === itemId);
        if (itemInCart) {
            if (action === 'increase') {
                itemInCart.quantity++;
            } else if (action === 'decrease') {
                itemInCart.quantity--;
                if (itemInCart.quantity <= 0) {
                    cart = cart.filter(item => item.id !== itemId);
                }
            }
        }
        renderCart();
    };
    // END OF UNCHANGED FUNCTIONS

    // MODIFIED: Function to handle the payment process
    const processPayment = (method) => {
        console.log(`Processing payment via ${method}`);
        sendTicketToKitchen();
        
        // Pass the payment method AND the current user to the receipt
        generateReceipt(method, currentUser);
        
        paymentModal.classList.add('hidden');
        receiptModal.classList.remove('hidden');
    };

    // MODIFIED: Function to generate the new, appealing receipt
    const generateReceipt = (paymentMethod, user) => {
        let itemsHTML = '';
        cart.forEach(item => {
            itemsHTML += `
                <tr>
                    <td>${item.name} (x${item.quantity})</td>
                    <td>Ksh ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
        });

        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.16;
        const total = subtotal + tax;

        const receiptHTML = `
            <div class="receipt-header">
                <h3>Kakwacha POS</h3>
                <p>Kakwacha,Kisumu</p>
                <p>Thank you for your visit!</p>
            </div>
            <div class="receipt-body">
                <p><strong>Order #:</strong> ${Math.floor(Math.random() * 10000)}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <table>
                    <thead><tr><th>Item</th><th>Price</th></tr></thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
            </div>
            <div class="receipt-summary">
                <div class="summary-row"><span>Subtotal</span><span>Ksh ${subtotal.toFixed(2)}</span></div>
                <div class="summary-row"><span>Tax (16%)</span><span>Ksh ${tax.toFixed(2)}</span></div>
                <div class="summary-row total"><span>Total</span><span>Ksh ${total.toFixed(2)}</span></div>
            </div>
            <div class="receipt-footer">
                <p>Payment Method: ${paymentMethod}</p>
                <p>Served by: ${user.name}</p>
            </div>
        `;
        receiptContentEl.innerHTML = receiptHTML;
    };

    // (sendTicketToKitchen and resetOrder functions remain the same)
    const sendTicketToKitchen = () => {
        const ticket = { orderId: Math.floor(Math.random() * 10000), timestamp: new Date().toLocaleTimeString(), items: cart.map(item => ({ name: item.name, quantity: item.quantity })), };
        console.log("--- TICKET SENT TO KITCHEN ---"); console.log(ticket);
    };
    const resetOrder = () => {
        cart = [];
        renderCart();
        receiptModal.classList.add('hidden');
    };
    
    // --- EVENT LISTENERS ---
    // (The event listeners are the same, just remove the one for the old close receipt button)
    categoryBtnsContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.category-btn.active').classList.remove('active'); e.target.classList.add('active'); renderMenuItems(e.target.dataset.filter); } });
    menuItemsGrid.addEventListener('click', (e) => { const card = e.target.closest('.menu-item-card'); if (card) { addToCart(parseInt(card.dataset.id)); } });
    cartItemsContainer.addEventListener('click', (e) => { const btn = e.target.closest('.quantity-btn'); if (btn) { handleQuantityChange(parseInt(btn.dataset.id), btn.dataset.action); } });
    checkoutBtn.addEventListener('click', () => { paymentModal.classList.remove('hidden'); });
    closePaymentModalBtn.addEventListener('click', () => paymentModal.classList.add('hidden'));
    paymentModal.addEventListener('click', (e) => { const paymentBtn = e.target.closest('.payment-btn'); if (paymentBtn) { processPayment(paymentBtn.dataset.method); } });
    printReceiptBtn.addEventListener('click', () => { alert("Printing receipt... (Simulation)"); window.print(); });
    newOrderBtn.addEventListener('click', resetOrder);

    // --- INITIAL RENDER ---
    const init = () => {
        currentUserEl.textContent = `Cashier: ${currentUser.name}`;
        renderMenuItems();
        renderCart();
    };

    init();
});