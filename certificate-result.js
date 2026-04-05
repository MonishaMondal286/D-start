import { db } from "./firebase.js";
import {
  doc,
  getDoc,
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

async function loadCertificate(certId) {
  showMessage("Loading certificate...", false);

  const certRef = doc(db, "certificates", certId);
  const snap = await getDoc(certRef);
  if (!snap.exists()) {
    showMessage("No registration found with those details.", true);
    return;
  }

  const data = snap.data();
  const status = data.certificateStatus || "pending";

  if (status === "pending") {
    showMessage("Your certificate is not available yet. Please check after admin updates.", true);
    return;
  }

  if (nameField) nameField.textContent = data.name || "";
  if (metaField) {
    metaField.textContent = data.category || data.eventName || "Event";
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
    const verifyUrl = `${baseUrl}/verify.html?cert=${encodeURIComponent(certId)}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
  }

  showMessage("Certificate ready. Click download below.");
}

const params = new URLSearchParams(window.location.search);
const certId = String(params.get("cert") || "").trim();

if (certId) {
  loadCertificate(certId).catch((error) => {
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
