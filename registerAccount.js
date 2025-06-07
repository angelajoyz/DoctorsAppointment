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

  // Show/hide doctor-only fields based on selected role
  roleSelect.addEventListener("change", () => {
    if (roleSelect.value === "doctor") {
      doctorFields.forEach(field => (field.style.display = "block"));
    } else {
      doctorFields.forEach(field => (field.style.display = "none"));
    }
  });

  // License Number Validation - 7 digits only
  const licenseNumberInput = document.querySelector("input[name='licenseNumber']");
  if (licenseNumberInput) {
    licenseNumberInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").substring(0, 7);
    });
  }

  // Phone Number Validation - Country code + 11 digits
  const phoneInput = document.querySelector("input[name='phone']");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").substring(0, 11);
    });
  }
      
      document.getElementById("addSchedule").addEventListener("click", () => {
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
        
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = "Select day";
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        daySelect.appendChild(placeholderOption);
        
        days.forEach(day => {
          const option = document.createElement("option");
          option.value = day;
          option.textContent = day;
          daySelect.appendChild(option);
        });
        
        const timeInputsDiv = document.createElement("div");
        const addTimeButton = document.createElement("button");
        addTimeButton.type = "button";
        addTimeButton.textContent = "Add Time";
        addTimeButton.style.backgroundColor = "#2ecc71";
        addTimeButton.style.color = "white";
        addTimeButton.style.border = "none";
        addTimeButton.style.borderRadius = "5px";
        addTimeButton.style.padding = "6px 12px";
        addTimeButton.style.cursor = "pointer";
        
        addTimeButton.addEventListener("click", () => {
          const timeWrapper = document.createElement("div");
          timeWrapper.style.display = "flex";
          timeWrapper.style.gap = "8px";
          timeWrapper.style.marginTop = "5px";
          timeWrapper.classList.add("time-wrapper");
          
          // Helper: create time dropdown (1–12)
          function createHourSelect(name) {
            const select = document.createElement("select");
            select.name = name;
            for (let i = 1; i <= 12; i++) {
              const option = document.createElement("option");
              option.value = i;
              option.textContent = i;
              select.appendChild(option);
            }
            return select;
          }
          
          // Helper: create AM/PM select
          function createPeriodSelect(name) {
            const select = document.createElement("select");
            select.name = name;
            select.style.fontSize = "0.70rem"; // 👈 direct styling
            ["AM", "PM"].forEach(period => {
              const option = document.createElement("option");
              option.value = period;
              option.textContent = period;
              select.appendChild(option);
            });
            return select;
          }
          
          const startHour = createHourSelect("startHour");
          const startPeriod = createPeriodSelect("startPeriod");
          const endHour = createHourSelect("endHour");
          const endPeriod = createPeriodSelect("endPeriod");
          
          const deleteTimeBtn = document.createElement("button");
          deleteTimeBtn.type = "button";
          deleteTimeBtn.textContent = "🗑";
          deleteTimeBtn.style.backgroundColor = "#e74c3c";
          deleteTimeBtn.style.color = "white";
          deleteTimeBtn.style.border = "none";
          deleteTimeBtn.style.borderRadius = "5px";
          deleteTimeBtn.style.padding = "4px 8px";
          deleteTimeBtn.style.cursor = "pointer";
          
          deleteTimeBtn.addEventListener("click", () => {
            timeWrapper.remove();
          });
          
          timeWrapper.append("Start:", startHour, startPeriod, "End:", endHour, endPeriod, deleteTimeBtn);
          timeInputsDiv.appendChild(timeWrapper);
        });
        
        // Add one time input by default
        addTimeButton.click();
        
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.style.backgroundColor = "#e74c3c";
        deleteBtn.style.color = "white";
        deleteBtn.style.border = "none";
        deleteBtn.style.borderRadius = "5px";
        deleteBtn.style.padding = "4px 8px";  // smaller padding
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.height = "30px"; // aligns with select height
        deleteBtn.style.marginTop = "0";
        
        deleteBtn.addEventListener("click", () => {
          scheduleContainer.remove();
        });
        
        // Wrap delete button and day select side by side, with delete first
        const dayDeleteWrapper = document.createElement("div");
        dayDeleteWrapper.style.display = "flex";
        dayDeleteWrapper.style.alignItems = "center";
        dayDeleteWrapper.style.gap = "8px";
        dayDeleteWrapper.style.marginRight = "10px";
        dayDeleteWrapper.appendChild(deleteBtn);
        dayDeleteWrapper.appendChild(daySelect);
        
        scheduleContainer.appendChild(dayDeleteWrapper);
        scheduleContainer.appendChild(timeInputsDiv);
        scheduleContainer.appendChild(addTimeButton);
        
        additionalSchedulesDiv.appendChild(scheduleContainer);
      });
      
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = e.target.fullname.value.trim();
    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const phone = e.target.phone.value.trim();
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;
    const gender = e.target.gender.value;
    const role = e.target.role.value;

    // Validate phone number format
    if (role === "patient" && phone.length !== 11) {
      alert("Phone number must be exactly 11 digits long.");
      return;
    }

    // Validate license number format
    if (role === "doctor" && (!e.target.licenseNumber || e.target.licenseNumber.value.length !== 7)) {
      alert("License number must be exactly 7 digits long.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Password and Confirm Password must match.");
      return;
    }

    if (!validatePassword(password)) {
      alert(
        "Password must be at least 8 characters long, include one uppercase letter and one number."
      );
      return;
    }

    try {
      // Check for duplicate email or username
      const collectionRef = db.collection(role === "doctor" ? "doctors" : "patients");
      const emailSnapshot = await collectionRef.where("email", "==", email).get();
      if (!emailSnapshot.empty) {
        alert("An account with this email already exists.");
        return;
      }

      const usernameSnapshot = await collectionRef.where("username", "==", username).get();
      if (!usernameSnapshot.empty) {
        alert("Username is already taken.");
        return;
      }

      // Create user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Send email verification
      await user.sendEmailVerification();
      alert("A verification email has been sent. Please verify your email before logging in.");

      // Hash password and prepare user data (not saved yet)
      const hashedPassword = await hashPassword(password);
      const userData = {
        fullName,
        username,
        email,
        phone,
        gender,
        role,
        password: hashedPassword,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isVerified: false, // Mark user as unverified initially
      };

      // Add doctor-specific fields if role is doctor
      if (role === "doctor") {
        const licenseNumber = e.target.licenseNumber?.value.trim();
        const hospitalName = e.target.hospitalName?.value.trim();
        const hospitalAddress = e.target.hospitalAddress?.value.trim();
        const specialization = e.target.specialization?.value.trim();
        const bio = e.target.bio?.value.trim();

        // Collect schedule entries as in your original code
        const scheduleEntries = document.querySelectorAll("#additionalSchedules .schedule-input");
        const schedule = [];

        scheduleEntries.forEach((entry) => {
          const day = entry.querySelector("select[name='scheduleDay']").value;
          const timeWrappers = entry.querySelectorAll(".time-wrapper");
          const times = Array.from(timeWrappers).map((wrapper) => {
            const startHour = wrapper.querySelector("select[name='startHour']").value;
            const startPeriod = wrapper.querySelector("select[name='startPeriod']").value;
            const endHour = wrapper.querySelector("select[name='endHour']").value;
            const endPeriod = wrapper.querySelector("select[name='endPeriod']").value;
            return {
              startTime: `${startHour}:00 ${startPeriod}`,
              endTime: `${endHour}:00 ${endPeriod}`,
            };
          });

          if (day && times.length > 0) {
            times.forEach((time) => {
              schedule.push({ day, ...time });
            });
          }
        });

        userData.specialization = specialization;
        userData.bio = bio;
        userData.licenseNumber = licenseNumber;
        userData.hospitalName = hospitalName;
        userData.hospitalAddress = hospitalAddress;
        userData.schedule = schedule;
      }

      // Store userData in localStorage to save later after verification
      localStorage.setItem(`tempUser_${user.uid}`, JSON.stringify(userData));

      // Sign out the user to prevent unverified access
      await auth.signOut();

      // Redirect to login page (or keep on the same page if you prefer)
      window.location.href = "patientLogin.html";
    } catch (error) {
      console.error("Registration Error:", error);
      alert("Error: " + error.message);
    }
  });
});