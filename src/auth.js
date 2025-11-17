// ---------------- Firebase imports ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------------- Firebase config ----------------
const firebaseConfig = {
  apiKey: "AIzaSyA1MhwEBTDrgYc2ywKJnuyAIw5Q6qS8Rcw",
  authDomain: "expensestracker-36711.firebaseapp.com",
  projectId: "expensestracker-36711",
  storageBucket: "expensestracker-36711.appspot.com",
  messagingSenderId: "111920440061",
  appId: "1:111920440061:web:3af7eff29b1896280ad494",
  measurementId: "G-RC8QLYP6FZ",
};

// ---------------- Initialize Firebase ----------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------- DOM Elements ----------------
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const authForm = document.getElementById("authForm");
const guestLoginBtn = document.getElementById("guestLogin");
const rememberMeCheckbox = document.getElementById("rememberMe");
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtnSidebar = document.getElementById("logoutBtnSidebar");
const usernameDisplay = document.getElementById("usernameDisplay");

// ---------------- Utility Functions ----------------
function showDashboard(user) {
  loginPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");
  usernameDisplay.textContent = user.email || user.username || "Guest";
}

function showLogin() {
  loginPage.classList.remove("hidden");
  dashboardPage.classList.add("hidden");
}

// ---------------- Check Remember Me ----------------
const rememberedUser = JSON.parse(localStorage.getItem("rememberedUser"));
if (rememberedUser) {
  showDashboard(rememberedUser);
}

// ---------------- Login Form Submit ----------------
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const rememberMe = rememberMeCheckbox.checked;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };

    // Save current user
    localStorage.setItem("currentUser", JSON.stringify(user));

    // Remember Me
    if (rememberMe) {
      localStorage.setItem("rememberedUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("rememberedUser");
    }

    showDashboard(user);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// ---------------- Guest Login ----------------
guestLoginBtn.addEventListener("click", () => {
  const guestUser = { username: "Guest" };
  localStorage.setItem("currentUser", JSON.stringify(guestUser));
  showDashboard(guestUser);
});

// ---------------- Logout ----------------
function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("rememberedUser");
  showLogin();
}

logoutBtn.addEventListener("click", logout);
logoutBtnSidebar.addEventListener("click", logout);

// ---------------- Redirect to login if user manually refresh ----------------
window.addEventListener("load", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    showDashboard(currentUser);
  } else {
    showLogin();
  }
});
