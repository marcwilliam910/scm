const messageElement = document.getElementById("message");

window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const token = urlParams.get("token");
  const res = await fetch(`auth/verify-email`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({id, token}),
  });

  const {message} = await res.json();

  messageElement.innerText = message;
  if (!res.ok) {
    messageElement.classList.add("error");
  } else {
    messageElement.classList.add("success");
  }

  return;
});
