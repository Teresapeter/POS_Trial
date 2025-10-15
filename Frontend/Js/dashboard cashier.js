document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    // In a real application, this data would come from your backend API
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
    
    const paymentModal = document.getElementById('payment-modal');
    const receiptModal = document.getElementById('receipt-modal');
    const paymentTotalEl = document.getElementById('payment-total');
    const closePaymentModalBtn = document.getElementById('close-payment-modal');
    const closeReceiptModalBtn = document.getElementById('close-receipt-modal');
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    const newOrderBtn = document.getElementById('new-order-btn');
    const receiptContentEl = document.getElementById('receipt-content');

    // --- FUNCTIONS ---

    // Function to render menu items based on filter
    const renderMenuItems = (filter = 'all') => {
        menuItemsGrid.innerHTML = ''; // Clear existing items
        const filteredItems = menuItems.filter(item => filter === 'all' || item.category === filter);

        filteredItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'menu-item-card';
            itemCard.dataset.id = item.id;
            itemCard.innerHTML = `
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/food-placeholder.png';">
                <h4>${item.name}</h4>
                <p>Ksh ${item.price.toFixed(2)}</p>
            `;
            menuItemsGrid.appendChild(itemCard);
        });
    };

    // Function to update the cart display
    const renderCart = () => {
        cartItemsContainer.innerHTML = ''; // Clear cart
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty-msg">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-details">
                        <strong>${item.name}</strong><br>
                        <small>Ksh ${item.price.toFixed(2)}</small>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <strong>Ksh ${(item.price * item.quantity).toFixed(2)}</strong>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        }
        updateCartSummary();
        checkoutBtn.disabled = cart.length === 0;
    };
    
    // Function to update cart summary (subtotal, tax, total)
    const updateCartSummary = () => {
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const tax = subtotal * 0.16;
        const total = subtotal + tax;

        cartSubtotalEl.textContent = `Ksh ${subtotal.toFixed(2)}`;
        cartTaxEl.textContent = `Ksh ${tax.toFixed(2)}`;
        cartTotalEl.textContent = `Ksh ${total.toFixed(2)}`;
        paymentTotalEl.textContent = `Ksh ${total.toFixed(2)}`;
    };
    
    // Function to add an item to the cart
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

    // Function to handle quantity changes in the cart
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

    // Function to handle the payment process
    const processPayment = (method) => {
        console.log(`Processing payment via ${method}`);
        
        // In a real app, you would send this to the backend
        sendTicketToKitchen();

        generateReceipt(method);
        paymentModal.classList.add('hidden');
        receiptModal.classList.remove('hidden');
    };

    const sendTicketToKitchen = () => {
        const ticket = {
            orderId: Math.floor(Math.random() * 10000),
            timestamp: new Date().toLocaleTimeString(),
            items: cart.map(item => ({ name: item.name, quantity: item.quantity })),
        };
        console.log("--- TICKET SENT TO KITCHEN ---");
        console.log(ticket);
    };

    const generateReceipt = (paymentMethod) => {
        let receiptHTML = `
            <p><strong>Order #:</strong> ${Math.floor(Math.random() * 10000)}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <hr>
        `;
        cart.forEach(item => {
            receiptHTML += `<p>${item.name} (x${item.quantity}) - Ksh ${(item.price * item.quantity).toFixed(2)}</p>`;
        });
        receiptHTML += `<hr>`;
        receiptHTML += `<p><strong>Subtotal:</strong> ${cartSubtotalEl.textContent}</p>`;
        receiptHTML += `<p><strong>Tax:</strong> ${cartTaxEl.textContent}</p>`;
        receiptHTML += `<h3><strong>Total:</strong> ${cartTotalEl.textContent}</h3>`;
        receiptHTML += `<hr>`;
        receiptHTML += `<p><strong>Payment Method:</strong> ${paymentMethod}</p>`;
        receiptContentEl.innerHTML = receiptHTML;
    };
    
    // Function to reset the entire order
    const resetOrder = () => {
        cart = [];
        renderCart();
        receiptModal.classList.add('hidden');
    };

    // --- EVENT LISTENERS ---

    // Filter menu items by category
    categoryBtnsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelector('.category-btn.active').classList.remove('active');
            e.target.classList.add('active');
            const filter = e.target.dataset.filter;
            renderMenuItems(filter);
        }
    });

    // Add item to cart when card is clicked
    menuItemsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.menu-item-card');
        if (card) {
            const itemId = parseInt(card.dataset.id);
            addToCart(itemId);
        }
    });

    // Handle cart quantity changes
    cartItemsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quantity-btn');
        if (btn) {
            const itemId = parseInt(btn.dataset.id);
            const action = btn.dataset.action;
            handleQuantityChange(itemId, action);
        }
    });

    // Open payment modal
    checkoutBtn.addEventListener('click', () => {
        paymentModal.classList.remove('hidden');
    });

    // Close Modals
    closePaymentModalBtn.addEventListener('click', () => paymentModal.classList.add('hidden'));
    closeReceiptModalBtn.addEventListener('click', () => receiptModal.classList.add('hidden'));

    // Handle payment method selection
    paymentModal.addEventListener('click', (e) => {
        const paymentBtn = e.target.closest('.payment-btn');
        if (paymentBtn) {
            processPayment(paymentBtn.dataset.method);
        }
    });
    
    // Receipt actions
    printReceiptBtn.addEventListener('click', () => {
        alert("Printing receipt... (This is a simulation)");
        // In a real app, you'd use a library like print.js or the browser's print() command
        window.print();
    });

    newOrderBtn.addEventListener('click', resetOrder);

    // --- INITIAL RENDER ---
    renderMenuItems();
});