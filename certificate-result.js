import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const nameField = document.getElementById("certificateName");
const metaField = document.getElementById("certificateMeta");
const regField = document.getElementById("certificateReg");
const rankField = document.getElementById("certificateRank");
const qrImage = document.getElementById("certificateQr");
const titleField = document.getElementById("certificateTitle");
const statementField = document.getElementById("certificateStatement");
const message = document.getElementById("certificateMessage");
const downloadButton = document.getElementById("downloadCertificate");

function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

async function loadCertificate(name, dob) {
  showMessage("Loading certificate...", false);

  const registrationQuery = query(
    collection(db, "registrations"),
    where("nameLower", "==", name.toLowerCase()),
    where("dob", "==", dob),
    limit(1)
  );

  const snapshot = await getDocs(registrationQuery);
  if (snapshot.empty) {
    showMessage("No registration found with those details.", true);
    return;
  }

  const data = snapshot.docs[0].data();
  const status = data.certificateStatus || "pending";

  if (status === "pending") {
    showMessage("Your certificate is not available yet. Please check after admin updates.", true);
    return;
  }

  if (nameField) nameField.textContent = data.name || name;
  if (metaField) {
    metaField.textContent = data.eventName || "Event";
  }
  if (regField) regField.textContent = `Registration No: ${data.regNumber || "-"}`;

  if (status === "ranked") {
    if (titleField) titleField.textContent = "Certificate of Merit";
    if (statementField) {
      statementField.textContent = "This is to certify that the above participant has achieved a ranked position in the event.";
    }
    if (rankField) rankField.textContent = data.rank ? `Ranked: #${data.rank}` : "Ranked finisher";
  } else {
    if (titleField) titleField.textContent = "Certificate of Participation";
    if (statementField) {
      statementField.textContent = "This is to certify that the above participant has successfully completed the event.";
    }
    if (rankField) rankField.textContent = "";
  }

  if (qrImage) {
    const baseUrl = window.location.origin;
    const verifyUrl = `${baseUrl}/verify.html?reg=${encodeURIComponent(data.regNumber || "")}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
  }

  showMessage("Certificate ready. Click download below.");
}

const params = new URLSearchParams(window.location.search);
const name = String(params.get("name") || "").trim();
const dob = String(params.get("dob") || "").trim();

if (name && dob) {
  loadCertificate(name, dob).catch((error) => {
    console.error(error);
    showMessage("Unable to load certificate. Please try again.", true);
  });
} else {
  showMessage("Missing details. Please search again.", true);
}

if (downloadButton) {
  downloadButton.addEventListener("click", () => {
    window.print();
  });
}
