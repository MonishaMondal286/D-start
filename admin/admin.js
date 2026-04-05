import { db, auth, serverTimestamp } from "../firebase.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const adminTable = document.getElementById("adminTable");
const tableBody = adminTable ? adminTable.querySelector("tbody") : null;
const adminSearch = document.getElementById("adminSearch");
const statusFilter = document.getElementById("statusFilter");
const refreshButton = document.getElementById("refreshButton");
const selectAllRows = document.getElementById("selectAllRows");
const bulkStatus = document.getElementById("bulkStatus");
const applyBulk = document.getElementById("applyBulk");
const adminLogin = document.getElementById("adminLogin");
const adminContent = document.getElementById("adminContent");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const loginMessage = document.getElementById("loginMessage");
const adminEmail = document.getElementById("adminEmail");

let registrations = [];
let selectedIds = new Set();
let currentUser = null;
let isAdminUser = false;

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

function showLoginMessage(text, isError = false) {
  if (!loginMessage) return;
  loginMessage.textContent = text;
  loginMessage.classList.toggle("is-error", isError);
}

async function hashCertificateId(nameLower, dob) {
  const input = `${nameLower}|${dob}`;
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function categoryLabel(eventName, gender) {
  if (eventName === "Men 10 KM") return "10 KM – Men Category";
  if (eventName === "Women 5 KM") return "5 KM – Women Category";
  return `${eventName || ""} ${gender ? `– ${gender}` : ""}`.trim();
}

function renderTable(list) {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (!list.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 13;
    cell.textContent = "No registrations found.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  list.forEach((reg) => {
    const row = document.createElement("tr");

    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.id = reg.id;
    checkbox.checked = selectedIds.has(reg.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedIds.add(reg.id);
      } else {
        selectedIds.delete(reg.id);
      }
      if (selectAllRows) {
        selectAllRows.checked = selectedIds.size === list.length;
      }
    });
    selectCell.appendChild(checkbox);

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

        const certId = await hashCertificateId(reg.nameLower || normalizeValue(reg.name), reg.dob || "");
        await setDoc(doc(db, "certificates", certId), {
          name: reg.name || "",
          nameLower: reg.nameLower || normalizeValue(reg.name),
          eventName: reg.eventName || "",
          category: categoryLabel(reg.eventName, reg.gender),
          regNumber: reg.regNumber || "",
          certificateStatus: newStatus,
          rank: rankValue,
          updatedAt: serverTimestamp(),
        }, { merge: true });

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

    row.appendChild(selectCell);
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
  tableBody.innerHTML = "<tr><td colspan=\"13\">Loading registrations...</td></tr>";
  try {
    const registrationsRef = collection(db, "registrations");
    const registrationsQuery = query(registrationsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(registrationsQuery);
    registrations = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    selectedIds = new Set();
    if (selectAllRows) selectAllRows.checked = false;
    applyFilters();
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = "<tr><td colspan=\"13\">Failed to load registrations.</td></tr>";
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

if (selectAllRows) {
  selectAllRows.addEventListener("change", () => {
    const visibleChecks = tableBody ? tableBody.querySelectorAll("input[type=\"checkbox\"][data-id]") : [];
    selectedIds.clear();
    visibleChecks.forEach((checkbox) => {
      checkbox.checked = selectAllRows.checked;
      if (selectAllRows.checked) {
        selectedIds.add(checkbox.dataset.id);
      }
    });
  });
}

if (applyBulk) {
  applyBulk.addEventListener("click", async () => {
    const newStatus = bulkStatus ? bulkStatus.value : "";
    if (!newStatus) return;
    if (!selectedIds.size) return;
    applyBulk.disabled = true;
    applyBulk.textContent = "Applying...";
    try {
      const updates = Array.from(selectedIds).map(async (id) => {
        const reg = registrations.find((item) => item.id === id);
        if (!reg) return;
        const rankValue = newStatus === "ranked" ? "" : "";
        await updateDoc(doc(db, "registrations", id), {
          certificateStatus: newStatus,
          rank: rankValue,
        });
        const certId = await hashCertificateId(reg.nameLower || normalizeValue(reg.name), reg.dob || "");
        await setDoc(doc(db, "certificates", certId), {
          name: reg.name || "",
          nameLower: reg.nameLower || normalizeValue(reg.name),
          eventName: reg.eventName || "",
          category: categoryLabel(reg.eventName, reg.gender),
          regNumber: reg.regNumber || "",
          certificateStatus: newStatus,
          rank: rankValue,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });
      await Promise.all(updates);
      await loadRegistrations();
    } catch (error) {
      console.error(error);
    } finally {
      applyBulk.disabled = false;
      applyBulk.textContent = "Apply";
    }
  });
}

async function ensureAdminRequest(user) {
  if (!user) return;
  const requestRef = doc(db, "admin_requests", user.uid);
  const snap = await getDoc(requestRef);
  if (!snap.exists()) {
    await setDoc(requestRef, {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      createdAt: serverTimestamp(),
    });
  }
}

async function checkAdmin(user) {
  if (!user) return false;
  const adminRef = doc(db, "admins", user.uid);
  const snap = await getDoc(adminRef);
  return snap.exists() && snap.data().isAdmin === true;
}

if (loginButton) {
  loginButton.addEventListener("click", async () => {
    showLoginMessage("Signing in...", false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await ensureAdminRequest(result.user);
      showLoginMessage("Signed in. Waiting for admin approval.", false);
    } catch (error) {
      console.error(error);
      showLoginMessage("Unable to sign in. Please try again.", true);
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
  });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    isAdminUser = false;
    if (adminContent) {
      adminContent.hidden = true;
      adminContent.style.display = "none";
    }
    if (adminLogin) {
      adminLogin.hidden = false;
      adminLogin.style.display = "grid";
    }
    showLoginMessage("Sign in to continue.", false);
    return;
  }

  if (adminEmail) adminEmail.textContent = user.email || "Signed in";
  await ensureAdminRequest(user);
  isAdminUser = await checkAdmin(user);

  if (isAdminUser) {
    if (adminLogin) {
      adminLogin.hidden = true;
      adminLogin.style.display = "none";
    }
    if (adminContent) {
      adminContent.hidden = false;
      adminContent.style.display = "block";
    }
    showLoginMessage("", false);
    loadRegistrations();
  } else {
    if (adminContent) {
      adminContent.hidden = true;
      adminContent.style.display = "none";
    }
    if (adminLogin) {
      adminLogin.hidden = false;
      adminLogin.style.display = "grid";
    }
    showLoginMessage("Your account is not approved yet. Ask the admin to enable access.", true);
  }
});
