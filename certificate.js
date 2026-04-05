import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const form = document.getElementById("certificateForm");
const message = document.getElementById("certificateMessage");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

async function precheck(name, dob) {
  const registrationQuery = query(
    collection(db, "registrations"),
    where("nameLower", "==", name.toLowerCase()),
    where("dob", "==", dob),
    limit(1)
  );
  const snapshot = await getDocs(registrationQuery);
  if (snapshot.empty) return { ok: false, message: "No registration found with those details." };
  const data = snapshot.docs[0].data();
  const status = data.certificateStatus || "pending";
  if (status === "pending") {
    return { ok: false, message: "Your certificate is not available yet. Please check after admin updates." };
  }
  return { ok: true };
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const dob = String(formData.get("dob") || "").trim();

    showMessage("Checking...", false);

    if (!name || !dob) {
      showMessage("Please enter both name and date of birth.", true);
      return;
    }

    try {
      const result = await precheck(name, dob);
      if (!result.ok) {
        showMessage(result.message, true);
        return;
      }
      const targetUrl = `./certificate-result.html?name=${encodeURIComponent(name)}&dob=${encodeURIComponent(dob)}`;
      window.location.href = targetUrl;
    } catch (error) {
      console.error(error);
      showMessage("Unable to check certificate. Please try again later.", true);
    }
  });
}
