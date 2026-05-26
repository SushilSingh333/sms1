let isFormSubmitted = false;
let isFormDirty = false;

// âœ… Course â†’ Center ID Mapping
const courseToCenterId = {
  "BBA": 1,
  "BCA": 2,
  "BCOM(H)": 4,
  "BA(Mass comm.)": 5,
  "MBA": 6,
  "MCA": 7,
  "M.COM": 8
};

async function handleFormSubmit(formId) {

  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with ID ${formId} not found.`);
    return;
  }

  // Detect typing (dirty state)
  form.addEventListener("input", function () {
    const hasValue = Array.from(form.elements).some(
      (el) =>
        el.tagName !== "BUTTON" &&
        el.type !== "hidden" &&
        el.value &&
        el.value.trim() !== ""
    );
    isFormDirty = hasValue;
  });

  form.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Loader
    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we process your request.",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // âœ… Get form values
    const name = form.querySelector('[name="form_name"]')?.value.trim() || "";
    const phone = form.querySelector('[name="form_mobile"]')?.value.trim() || "";
    const city = form.querySelector('[name="form_city"]')?.value.trim() || "";
    const email = form.querySelector('[name="form_email"]')?.value.trim() || "";
    const selectedCourse = form.querySelector('[name="form_course"]')?.value.trim() || "";

    const centerId = courseToCenterId[selectedCourse];

    // âœ… Validation
    let missingFields = [];
    if (!name) missingFields.push("Name");
    if (!phone) missingFields.push("Phone");
    if (!city) missingFields.push("City");
    if (!email) missingFields.push("Email");
    if (!selectedCourse) missingFields.push("Course");

    if (missingFields.length > 0) {
      Swal.close();
      Swal.fire({
        title: "Missing Fields",
        text: `Please fill: ${missingFields.join(", ")}`,
        icon: "warning",
      });
      return;
    }

    // âœ… Phone validation
    if (!/^\d{10}$/.test(phone)) {
      Swal.close();
      Swal.fire({
        title: "Invalid Phone Number",
        text: "Enter a valid 10-digit number",
        icon: "error",
      });
      return;
    }

    // âœ… Safety check (mapping fail)
    if (!centerId) {
      Swal.close();
      Swal.fire({
        title: "Invalid Course",
        text: "Please select a valid course",
        icon: "error",
      });
      return;
    }

    // âœ… Final Payload (CRM + Sheet à¤¦à¥‹à¤¨à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤)
    const payload = {
      page_url: window.location.href,
      project_name: "SMS Varanasi Admissions 2026-2027",
      form_name: name,
      form_mobile: phone,
      form_city: city,
      form_email: email,

      // ðŸ”¥ REQUIRED FIELDS
      form_center: centerId,              // ID (CRM)
      form_course_name: selectedCourse,  // Name (Sheet)

      doc_url: document.URL,
      doc_ref: document.referrer,
    };

    console.log("Final Payload:", payload);

    const apiUrl = "https://apiv2.aajneetiadvertising.com/lead/save";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      isFormSubmitted = true;

      const data = await response.json();
      console.log("Response:", data);

      window.location.href = "admission2026/thankyou.html";

    } catch (error) {
      console.error("Error:", error);

      Swal.fire({
        title: "Error",
        text: "Submission failed. Try again.",
        icon: "error",
      });
    }
  });
}

// Prevent accidental exit
window.addEventListener("beforeunload", function (e) {
  if (isFormDirty && !isFormSubmitted) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// Init
handleFormSubmit("ajax-header-contact");
handleFormSubmit("ajax-header-contact-2");