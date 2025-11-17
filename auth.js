import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------------- Firebase config ----------------
const firebaseConfig = {
  apiKey: "AIzaSyA1MhwEBTDrgYc2ywKJnuyAIw5Q6qS8Rcw",
  authDomain: "expensestracker-36711.firebaseapp.com",
  projectId: "expensestracker-36711",
  storageBucket: "expensestracker-36711.firebasestorage.app",
  messagingSenderId: "111920440061",
  appId: "1:111920440061:web:3af7eff29b1896280ad494",
  measurementId: "G-RC8QLYP6FZ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------- Redirect if logged in ----------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: user.uid,
        email: user.email || "Guest",
        role: user.isAnonymous ? "guest" : "user",
      })
    );
    window.location.href = "index.html"; // redirect
  }
});

// ---------------- Login Form ----------------
document.getElementById("authForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  try {
    // Choose persistence based on rememberMe
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    localStorage.setItem(
      "currentUser",
      JSON.stringify({ uid: user.uid, email: user.email, role: "user" })
    );
    window.location.href = "index.html";
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

// ---------------- Guest Login ----------------
document.getElementById("guestLogin")?.addEventListener("click", async () => {
  try {
    await setPersistence(auth, browserSessionPersistence); // guest = temporary
    const guestUser = await signInAnonymously(auth);

    localStorage.setItem(
      "currentUser",
      JSON.stringify({ uid: guestUser.user.uid, email: "Guest", role: "guest" })
    );
    window.location.href = "index.html";
  } catch (error) {
    alert("Guest login failed: " + error.message);
  }
});
