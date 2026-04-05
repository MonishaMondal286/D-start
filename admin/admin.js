import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const adminTable = document.getElementById("adminTable");
const tableBody = adminTable ? adminTable.querySelector("tbody") : null;
const adminSearch = document.getElementById("adminSearch");
const statusFilter = document.getElementById("statusFilter");
const refreshButton = document.getElementById("refreshButton");

let registrations = [];

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

function normalizeValue(value) {
  return String(value || "").toLowerCase();
}

function renderTable(list) {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (!list.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 12;
    cell.textContent = "No registrations found.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  list.forEach((reg) => {
    const row = document.createElement("tr");

    const regCell = document.createElement("td");
    regCell.textContent = reg.regNumber || "-";

    const nameCell = document.createElement("td");
    nameCell.textContent = reg.name || "-";

    const dobCell = document.createElement("td");
    dobCell.textContent = reg.dob || "-";

    const genderCell = document.createElement("td");
    genderCell.textContent = reg.gender || "-";

    const eventCell = document.createElement("td");
    eventCell.textContent = reg.eventName || "-";

    const phoneCell = document.createElement("td");
    phoneCell.textContent = reg.phone || "-";

    const emailCell = document.createElement("td");
    emailCell.textContent = reg.email || "-";

    const feeCell = document.createElement("td");
    feeCell.textContent = reg.fee ? `₹${reg.fee}` : "-";

    const fileCell = document.createElement("td");
    const fileList = document.createElement("div");
    fileList.className = "file-links";
    if (reg.photoUrl) {
      const photoLink = document.createElement("a");
      photoLink.href = reg.photoUrl;
      photoLink.target = "_blank";
      photoLink.rel = "noreferrer";
      photoLink.textContent = "Photo";
      fileList.appendChild(photoLink);
    }
    if (reg.govtIdUrl) {
      const idLink = document.createElement("a");
      idLink.href = reg.govtIdUrl;
      idLink.target = "_blank";
      idLink.rel = "noreferrer";
      idLink.textContent = "Govt ID";
      fileList.appendChild(idLink);
    }
    if (!reg.photoUrl && !reg.govtIdUrl) {
      fileList.textContent = "-";
    }
    fileCell.appendChild(fileList);

    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");
    statusSelect.className = "input-field";
    ["pending", "participant", "ranked"].forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      if ((reg.certificateStatus || "pending") === status) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });
    statusCell.appendChild(statusSelect);

    const rankCell = document.createElement("td");
    const rankInput = document.createElement("input");
    rankInput.type = "number";
    rankInput.min = "1";
    rankInput.max = "5";
    rankInput.placeholder = "Rank";
    rankInput.className = "input-field";
    rankInput.value = reg.rank || "";
    rankCell.appendChild(rankInput);

    const actionCell = document.createElement("td");
    const saveButton = document.createElement("button");
    saveButton.className = "button button-primary button-small";
    saveButton.type = "button";
    saveButton.textContent = "Save";

    saveButton.addEventListener("click", async () => {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
      try {
        const newStatus = statusSelect.value;
        const rankValue = newStatus === "ranked" ? String(rankInput.value || "").trim() : "";
        await updateDoc(doc(db, "registrations", reg.id), {
          certificateStatus: newStatus,
          rank: rankValue,
        });
        reg.certificateStatus = newStatus;
        reg.rank = rankValue;
        saveButton.textContent = "Saved";
      } catch (error) {
        console.error(error);
        saveButton.textContent = "Error";
      } finally {
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.textContent = "Save";
        }, 1000);
      }
    });

    actionCell.appendChild(saveButton);

    row.appendChild(regCell);
    row.appendChild(nameCell);
    row.appendChild(dobCell);
    row.appendChild(genderCell);
    row.appendChild(eventCell);
    row.appendChild(phoneCell);
    row.appendChild(emailCell);
    row.appendChild(feeCell);
    row.appendChild(fileCell);
    row.appendChild(statusCell);
    row.appendChild(rankCell);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

function applyFilters() {
  const searchValue = normalizeValue(adminSearch ? adminSearch.value : "");
  const statusValue = statusFilter ? statusFilter.value : "all";

  const filtered = registrations.filter((reg) => {
    const matchesSearch = !searchValue
      || normalizeValue(reg.name).includes(searchValue)
      || normalizeValue(reg.phone).includes(searchValue)
      || normalizeValue(reg.email).includes(searchValue);
    const currentStatus = reg.certificateStatus || "pending";
    const matchesStatus = statusValue === "all" || currentStatus === statusValue;
    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

async function loadRegistrations() {
  if (!tableBody) return;
  tableBody.innerHTML = "<tr><td colspan=\"12\">Loading registrations...</td></tr>";
  try {
    const registrationsRef = collection(db, "registrations");
    const registrationsQuery = query(registrationsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(registrationsQuery);
    registrations = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    applyFilters();
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = "<tr><td colspan=\"12\">Failed to load registrations.</td></tr>";
  }
}

if (adminSearch) {
  adminSearch.addEventListener("input", applyFilters);
}

if (statusFilter) {
  statusFilter.addEventListener("change", applyFilters);
}

if (refreshButton) {
  refreshButton.addEventListener("click", loadRegistrations);
}

loadRegistrations();
