const form = document.getElementById("registrationForm");
const formResult = document.getElementById("formResult");
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const eventSelectionGrid = document.getElementById("eventSelectionGrid");
const eventNameInput = document.getElementById("eventName");
const sportSelect = document.getElementById("sportSelect");
const selectedEventLabel = document.getElementById("selectedEventLabel");
const successCard = document.getElementById("successCard");

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
    const sport = formData.get("sport");
    const participantType = formData.get("participantType");
    const eventName = formData.get("eventName");

    formResult.textContent = `${name}, your registration for ${eventName} in ${sport} as a ${participantType.toLowerCase()} has been received successfully.`;
    if (successCard) {
      successCard.hidden = false;
    }
    form.reset();

    if (eventSelectionGrid) {
      const firstChoice = eventSelectionGrid.querySelector(".event-choice");
      if (firstChoice) {
        eventSelectionGrid.querySelectorAll(".event-choice").forEach((choice) => {
          choice.classList.remove("is-selected");
        });
        firstChoice.classList.add("is-selected");
        const defaultEvent = firstChoice.dataset.event || "";
        const defaultSport = firstChoice.dataset.sport || "";
        if (eventNameInput) {
          eventNameInput.value = defaultEvent;
        }
        if (selectedEventLabel) {
          selectedEventLabel.textContent = defaultEvent;
        }
        if (sportSelect && defaultSport) {
          sportSelect.value = defaultSport;
        }
      }
    }
  });
}

if (eventSelectionGrid) {
  const choices = eventSelectionGrid.querySelectorAll(".event-choice");
  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      choices.forEach((item) => item.classList.remove("is-selected"));
      choice.classList.add("is-selected");

      const eventName = choice.dataset.event || "";
      const sport = choice.dataset.sport || "";

      if (eventNameInput) {
        eventNameInput.value = eventName;
      }
      if (selectedEventLabel) {
        selectedEventLabel.textContent = eventName;
      }
      if (sportSelect && sport) {
        sportSelect.value = sport;
      }
      if (successCard) {
        successCard.hidden = true;
      }
    });
  });
}
