const form = document.getElementById("registrationForm");
const formResult = document.getElementById("formResult");
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const eventSelectionGrid = document.getElementById("eventSelectionGrid");
const eventNameInput = document.getElementById("eventName");
const eventDisplay = document.getElementById("eventDisplay");
const selectedEventLabel = document.getElementById("selectedEventLabel");
const successCard = document.getElementById("successCard");
const genderSelect = document.getElementById("genderSelect");

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

if (form && formResult) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name");
    const gender = formData.get("gender");
    const eventName = formData.get("eventName");

    formResult.textContent = `${name}, your registration for ${eventName} has been received successfully. The entry is marked as ${gender} category, and payment gateway will be added later.`;
    if (successCard) {
      successCard.hidden = false;
    }
    form.reset();
    if (eventNameInput) {
      eventNameInput.value = "";
    }
    if (eventDisplay) {
      eventDisplay.value = "";
    }
    if (selectedEventLabel) {
      selectedEventLabel.textContent = "Choose gender to assign event";
    }
    if (eventSelectionGrid) {
      eventSelectionGrid.querySelectorAll(".event-choice").forEach((choice) => {
        choice.classList.remove("is-selected");
      });
    }
    if (genderSelect) {
      genderSelect.value = "";
    }
  });
}

function setEventFromGender(gender) {
  let eventName = "";

  if (gender === "Female") {
    eventName = "Women 5 KM";
  } else if (gender === "Male") {
    eventName = "Men 10 KM";
  }

  if (eventNameInput) {
    eventNameInput.value = eventName;
  }
  if (eventDisplay) {
    eventDisplay.value = eventName;
  }
  if (selectedEventLabel) {
    selectedEventLabel.textContent = eventName || "Choose gender to assign event";
  }

  if (eventSelectionGrid) {
    eventSelectionGrid.querySelectorAll(".event-choice").forEach((choice) => {
      const matches = choice.dataset.event === eventName;
      choice.classList.toggle("is-selected", matches);
    });
  }

  if (successCard) {
    successCard.hidden = true;
  }
}

if (genderSelect) {
  genderSelect.addEventListener("change", () => {
    setEventFromGender(genderSelect.value);
  });
}
