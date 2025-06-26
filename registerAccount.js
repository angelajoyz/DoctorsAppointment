async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Validate Password
function validatePassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDwCayQZ0JO6DjzQvAT6ToT33I4QXCS_NY",
  authDomain: "login-sample-c3af0.firebaseapp.com",
  projectId: "login-sample-c3af0",
  storageBucket: "login-sample-c3af0.appspot.com",
  messagingSenderId: "372688128666",
  appId: "1:372688128666:web:bbc529c73c4665f95f6d23"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.querySelector("select[name='role']");
  const doctorFields = document.querySelectorAll(".doctor-only");

  // Role-based UI toggle
  roleSelect.addEventListener("change", () => {
    const show = roleSelect.value === "doctor";
    doctorFields.forEach(field => field.style.display = show ? "block" : "none");
  });

  // License Number = only 7 digits
  const licenseNumberInput = document.querySelector("input[name='licenseNumber']");
  licenseNumberInput?.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '').substring(0, 7);
  });

  // Phone = digits only
  const phoneInput = document.querySelector("input[name='phone']");
  phoneInput?.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '').substring(0, 11);
  });

  // Add Schedule Button
  const addScheduleBtn = document.getElementById("addSchedule");
  addScheduleBtn?.addEventListener("click", () => {
    const additionalSchedulesDiv = document.getElementById("additionalSchedules");
    const scheduleContainer = document.createElement("div");
    scheduleContainer.classList.add("schedule-input");
    scheduleContainer.style.display = "flex";
    scheduleContainer.style.flexWrap = "wrap";
    scheduleContainer.style.alignItems = "center";
    scheduleContainer.style.gap = "10px";
    scheduleContainer.style.marginBottom = "10px";

    const daySelect = document.createElement("select");
    daySelect.name = "scheduleDay";
    daySelect.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select day";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    daySelect.appendChild(placeholderOption);

    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      .forEach(day => {
        const option = document.createElement("option");
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
      });

    const timeInputsDiv = document.createElement("div");

    const addTimeButton = document.createElement("button");
    addTimeButton.type = "button";
    addTimeButton.textContent = "Add Time";
    addTimeButton.style = "background-color:#2ecc71;color:white;border:none;border-radius:5px;padding:6px 12px;cursor:pointer;";
    addTimeButton.addEventListener("click", () => {
      const timeWrapper = document.createElement("div");
      timeWrapper.classList.add("time-wrapper");
      timeWrapper.style = "display:flex;gap:8px;margin-top:5px;";

      function createSelect(name, options) {
        const select = document.createElement("select");
        select.name = name;
        options.forEach(val => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          select.appendChild(opt);
        });
        return select;
      }

      const startHour = createSelect("startHour", Array.from({ length: 12 }, (_, i) => i + 1));
      const startPeriod = createSelect("startPeriod", ["AM", "PM"]);
      const endHour = createSelect("endHour", Array.from({ length: 12 }, (_, i) => i + 1));
      const endPeriod = createSelect("endPeriod", ["AM", "PM"]);

      const deleteTimeBtn = document.createElement("button");
      deleteTimeBtn.type = "button";
      deleteTimeBtn.textContent = "🗑";
      deleteTimeBtn.style = "background-color:#e74c3c;color:white;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;";
      deleteTimeBtn.addEventListener("click", () => timeWrapper.remove());

      timeWrapper.append("Start:", startHour, startPeriod, "End:", endHour, endPeriod, deleteTimeBtn);
      timeInputsDiv.appendChild(timeWrapper);
    });

    addTimeButton.click();

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.style = "background-color:#e74c3c;color:white;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;height:30px;";
    deleteBtn.addEventListener("click", () => scheduleContainer.remove());

    const topRow = document.createElement("div");
    topRow.style = "display:flex;align-items:center;gap:8px;margin-right:10px;";
    topRow.append(deleteBtn, daySelect);

    scheduleContainer.append(topRow, timeInputsDiv, addTimeButton);
    additionalSchedulesDiv.appendChild(scheduleContainer);
  });

  // Function to display custom alerts (instead of default browser alerts)
  function showCustomAlert(message) {
    // You can implement a more modern UI for alerts here,
    // e.g., using a modal, a toast notification, or a dedicated message area.
    // For now, we'll use a simple div that appears at the top.

    let alertDiv = document.getElementById('custom-alert');
    if (!alertDiv) {
      alertDiv = document.createElement('div');
      alertDiv.id = 'custom-alert';
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f44336; /* Red for errors */
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        min-width: 300px;
      `;
      document.body.appendChild(alertDiv);
    }

    alertDiv.textContent = message;
    alertDiv.style.backgroundColor = message.includes("successful") || message.includes("sent") ? "#4CAF50" : "#f44336"; // Green for success, Red for error
    alertDiv.style.opacity = 1;

    setTimeout(() => {
      alertDiv.style.opacity = 0;
      // Optional: remove the element after it fades out
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 500);
    }, 5000); // Alert disappears after 5 seconds
  }

  // Registration Handler
  const registerForm = document.getElementById("registerForm");
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const fullName = form.fullname.value.trim();
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const age = parseInt(form.age.value.trim());
    const address = form.address.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const gender = form.gender.value;
    const role = form.role.value;

    // Validate phone number format
    if (role === "patient" && phone.length !== 11) {
      showCustomAlert("Please enter a valid 11-digit phone number.");
      return;
    }

    // Validate license number format
    if (role === "doctor" && (!form.licenseNumber || form.licenseNumber.value.length !== 7)) {
      showCustomAlert("Please enter a valid 7-digit license number.");
      return;
    }

    if (password !== confirmPassword) {
      showCustomAlert("Passwords do not match. Please re-enter your password.");
      return;
    }
    if (!validatePassword(password)) {
      showCustomAlert("Password must be at least 8 characters long, include at least one uppercase letter and one number.");
      return;
    }

    try {
      // Check for duplicate email or username
      const collectionRef = db.collection(role === "doctor" ? "doctors" : "patients");
      const emailSnapshot = await collectionRef.where("email", "==", email).get();
      if (!emailSnapshot.empty) {
        showCustomAlert("An account with this email already exists. Please use a different email.");
        return;
      }

      const usernameSnapshot = await collectionRef.where("username", "==", username).get();
      if (!usernameSnapshot.empty) {
        showCustomAlert("This username is already taken. Please choose another username.");
        return;
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.sendEmailVerification();
      showCustomAlert("A verification email has been sent to your inbox. Please verify your email to complete registration.");

      // Wait for email verification
      const checkInterval = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(checkInterval);

          const hashedPassword = await hashPassword(password);
          const userData = {
            fullName,
            username,
            email,
            phone,
            age,
            address,
            gender,
            role,
            password: hashedPassword,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          if (role === "doctor") {
            const schedule = [];
            document.querySelectorAll("#additionalSchedules .schedule-input").forEach(entry => {
              const day = entry.querySelector("select[name='scheduleDay']").value;
              entry.querySelectorAll(".time-wrapper").forEach(wrapper => {
                const startHour = wrapper.querySelector("select[name='startHour']").value;
                const startPeriod = wrapper.querySelector("select[name='startPeriod']").value;
                const endHour = wrapper.querySelector("select[name='endHour']").value;
                const endPeriod = wrapper.querySelector("select[name='endPeriod']").value;
                schedule.push({
                  day,
                  startTime: `${startHour}:00 ${startPeriod}`,
                  endTime: `${endHour}:00 ${endPeriod}`
                });
              });
            });
            userData.specialization = form.specialization?.value.trim();
            userData.bio = form.bio?.value.trim();
            userData.schedule = schedule;
            userData.licenseNumber = form.licenseNumber?.value.trim();
            userData.hospitalName = form.hospitalName?.value.trim();
            userData.hospitalAddress = form.hospitalAddress?.value.trim();
          }

          await db.collection(role === "doctor" ? "doctors" : "patients").doc(user.uid).set(userData);
          showCustomAlert("Registration successful! You can now log in.");
          window.location.href = "patientLogin.html";
        }
      }, 3000);
    } catch (error) {
      console.error("Registration Error:", error);
      showCustomAlert("Registration failed: " + error.message);
    }
  });
});
