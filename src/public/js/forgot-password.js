const form = document.getElementById("reset-password-form");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const messageEl = document.getElementById("message");
const button = document.getElementById("reset-btn");
const errorFormDisplay = document.getElementById("errorFormDisplay");

form.style.display = "none";
let id, token;

window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  id = urlParams.get("id");
  token = urlParams.get("token");

  try {
    const res = await fetch("auth/verify-reset-password-token", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id, token}),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.innerText = data.message || "Invalid or expired token";
      messageEl.classList.add("error");
      messageEl.style.display = "block";
      return;
    }

    form.style.display = "flex";
    messageEl.style.display = "none";
  } catch (err) {
    messageEl.innerText = "An error occurred. Please try again.";
    messageEl.classList.add("error");
    messageEl.style.display = "block";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const passwordValue = password.value.trim();
  const confirmPasswordValue = confirmPassword.value.trim();

  errorFormDisplay.style.display = "none";
  errorFormDisplay.innerText = "";

  if (passwordValue.length < 8) {
    errorFormDisplay.innerText = "Password must be at least 8 characters long";
    errorFormDisplay.style.display = "block";
    return;
  }

  if (passwordValue !== confirmPasswordValue) {
    errorFormDisplay.innerText = "Passwords do not match";
    errorFormDisplay.style.display = "block";
    return;
  }

  button.disabled = true;
  button.innerText = "Resetting...";

  try {
    const res = await fetch("auth/reset-password", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id, token, password: passwordValue}),
    });

    const data = await res.json();
    button.disabled = false;
    button.innerText = "Reset Password";

    messageEl.style.display = "block";

    if (!res.ok) {
      messageEl.innerText = data.message || "Failed to reset password";
      messageEl.classList.add("error");
      return;
    }

    messageEl.innerText = "Password reset successfully";
    messageEl.classList.add("success");
    form.style.display = "none";
  } catch (err) {
    button.disabled = false;
    button.innerText = "Reset Password";
    messageEl.innerText = "An error occurred. Please try again.";
    messageEl.classList.add("error");
    messageEl.style.display = "block";
  }
});
