// File: Js/app.js
// This script is ONLY for the login page (index.html)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageArea = document.getElementById('message-area');

    // --- Mock User Database ---
    // In a real application, this would be validated against a server.
    // The properties (role, displayName, redirect) are set up to work with your dashboard script.
    const users = {
        "admin": {
            password: "admin_password",
            role: "admin",
            displayName: "Admin User",
            redirect: "dashboard.html" // The main dashboard page
        },
        "cashier01": {
            password: "cashier_pass",
            role: "cashier",
            displayName: "Main Cashier",
            redirect: "dashboard.html" // Redirects to the main dashboard
        },
        "waiter_john": {
            password: "waiter_pass",
            role: "waiter",
            displayName: "John Doe",
            redirect: "dashboard cashier.html" // Waiters also go to the dashboard, which will limit their view
        }
    };

    // Listen for the form submission
    loginForm.addEventListener('submit', (event) => {
        // Prevent the form from reloading the page
        event.preventDefault();

        // Clear previous error messages
        messageArea.textContent = '';
        messageArea.style.color = 'initial';

        // Get the values from the input fields
        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;

        // Find the user in our mock database
        const user = users[userId];

        // Check if the user exists and the password is correct
        if (user && user.password === password) {
            // --- SUCCESSFUL LOGIN ---
            
            // 1. Set the user's session details in localStorage.
            //    The dashboard.js script will read these values to set up the UI.
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', userId);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('displayName', user.displayName);

            // 2. Redirect the user to their designated page.
            window.location.href = user.redirect;

        } else {
            // --- FAILED LOGIN ---
            // Display an error message if credentials are wrong
            messageArea.textContent = 'Invalid username or password.';
            messageArea.style.color = '#D8000C'; // Make the error text red
        }
    });
});
