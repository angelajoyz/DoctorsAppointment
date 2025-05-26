document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("error-message");

    // Allowed credentials
    const validCredentials = [
        { email: "angelajanopol@gmail.com", password: "gela123" },
        { email: "tonychopper@gmail.com", password: "rumble" } // email and pw na pwede
    ];

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form from submitting

        const enteredEmail = emailInput.value.trim();
        const enteredPassword = passwordInput.value.trim();

        // Check if the credentials match
        const isValid = validCredentials.some(user => 
            user.email === enteredEmail && user.password === enteredPassword
        );

        if (isValid) {
            // ✅ Successful Login → Redirect to dashboard
            window.location.href = "dashboard.html";
        } else {
            // ❌ Wrong Credentials → Show Error Message
            showErrorMessage("Invalid email or password. Please try again.");
        }
    });

    // Function to show error message
    function showErrorMessage(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block"; // Show error message
    }
});

// Function to toggle password visibility
function togglePassword() {
    let passwordField = document.getElementById("password");
    let icon = document.querySelector(".toggle-password");

    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.src = "hide.png"; // Change icon when visible
    } else {
        passwordField.type = "password";
        icon.src = "show.png"; // Change icon when hidden
    }
}
