import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("verifyForm");
const message = document.getElementById("verifyMessage");
const result = document.getElementById("verifyResult");
const nameField = document.getElementById("verifyName");
const metaField = document.getElementById("verifyMeta");
const regField = document.getElementById("verifyReg");
const rankField = document.getElementById("verifyRank");
const statusField = document.getElementById("verifyStatus");
const titleField = document.getElementById("verifyTitle");

function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function resetResult() {
  if (result) result.hidden = true;
  if (rankField) rankField.textContent = "";
}

async function fetchByReg(regNumber) {
  const registrationQuery = query(
    collection(db, "registrations"),
    where("regNumber", "==", regNumber),
    limit(1)
  );
  const snapshot = await getDocs(registrationQuery);
  return snapshot.empty ? null : snapshot.docs[0].data();
}

async function handleVerify(regNumber) {
  resetResult();
  showMessage("Verifying...", false);

  const data = await fetchByReg(regNumber);
  if (!data) {
    showMessage("No certificate found for this registration number.", true);
    return;
  }

  const status = data.certificateStatus || "pending";
  if (nameField) nameField.textContent = data.name || "-";
  if (metaField) metaField.textContent = `${data.eventName || "Event"} • ${data.gender || ""} • DOB ${data.dob || ""}`;
  if (regField) regField.textContent = `Registration No: ${data.regNumber || regNumber}`;

  if (status === "ranked") {
    if (titleField) titleField.textContent = "Ranked Certificate";
    if (rankField) rankField.textContent = data.rank ? `Rank: #${data.rank}` : "Ranked finisher";
  } else if (status === "participant") {
    if (titleField) titleField.textContent = "Participant Certificate";
    if (rankField) rankField.textContent = "";
  } else {
    if (titleField) titleField.textContent = "Certificate Pending";
    if (rankField) rankField.textContent = "";
  }

  if (statusField) {
    statusField.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (result) result.hidden = false;
  showMessage("Certificate status loaded.");
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const regNumber = String(formData.get("regNumber") || "").trim();
    if (!regNumber) {
      showMessage("Enter a registration number.", true);
      return;
    }
    try {
      await handleVerify(regNumber);
    } catch (error) {
      console.error(error);
      showMessage("Unable to verify right now. Please try again.", true);
    }
  });
}

const params = new URLSearchParams(window.location.search);
const regParam = params.get("reg");
if (regParam) {
  handleVerify(regParam).catch((error) => {
    console.error(error);
  });
}
