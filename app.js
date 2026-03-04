/* global bootstrap */

const STORAGE_KEY = "clinic-dashboard-v1";

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const view = document.getElementById("view");
const alertHost = document.getElementById("alertHost");

const crudModalEl = document.getElementById("crudModal");
const crudModalTitle = document.getElementById("crudModalTitle");
const crudModalBody = document.getElementById("crudModalBody");
const crudModalSave = document.getElementById("crudModalSave");
const crudModal = new bootstrap.Modal(crudModalEl);

let modalSaveHandler = null;

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showAlert(type, message) {
  alertHost.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <div>${escapeHtml(message)}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no data");
    return JSON.parse(raw);
  } catch {
    const today = new Date().toISOString().slice(0, 10);
    const patients = [
      { id: crypto.randomUUID(), name: "Sarah Smith", dob: "1994-02-14", phone: "555-0201", notes: "" },
      { id: crypto.randomUUID(), name: "John Brown", dob: "1988-08-03", phone: "555-0202", notes: "" }
    ];
    const doctors = [
      { id: crypto.randomUUID(), name: "Dr. Patel", specialty: "General", phone: "555-0101" },
      { id: crypto.randomUUID(), name: "Dr. Kim", specialty: "Pediatrics", phone: "555-0102" }
    ];
    const appt = {
      id: crypto.randomUUID(),
      patient_id: patients[0].id,
      doctor_id: doctors[0].id,
      date: today,
      time: "09:30",
      consult_fees: 50,
      payment_mode: "Cash",
      description: "Initial consultation"
    };
    return { patients, doctors, appointments: [appt] };
  }
}

let state = loadState();
saveState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

sidebarToggle?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

function closeSidebarOnMobile() {
  if (window.matchMedia("(max-width: 767.98px)").matches) sidebar.classList.remove("open");
}

function setActiveNav(route) {
  document.querySelectorAll(".sidebar .nav-link").forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === `#/${route}`);
  });
}

function openModal({ title, bodyHtml, onSave }) {
  crudModalTitle.textContent = title;
  crudModalBody.innerHTML = bodyHtml;
  modalSaveHandler = onSave;
  crudModal.show();
}

crudModalSave.addEventListener("click", async () => {
  if (!modalSaveHandler) return;
  try {
    crudModalSave.disabled = true;
    await modalSaveHandler();
    crudModal.hide();
  } catch (e) {
    showAlert("danger", e instanceof Error ? e.message : "Failed to save.");
  } finally {
    crudModalSave.disabled = false;
  }
});

function patientsTable(patients) {
  return `
    <div class="table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>DOB</th>
            <th>Phone</th>
            <th class="text-end" style="width: 160px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${patients
            .map(
              (p) => `
            <tr data-id="${escapeHtml(p.id)}">
              <td class="fw-semibold">${escapeHtml(p.name)}</td>
              <td>${escapeHtml(p.dob || "")}</td>
              <td>${escapeHtml(p.phone || "")}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-2 js-edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger js-delete"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `
            )
            .join("")}
          ${patients.length === 0 ? `<tr><td colspan="4" class="text-muted">No patients yet.</td></tr>` : ""}
        </tbody>
      </table>
    </div>
  `;
}

function doctorsTable(doctors) {
  return `
    <div class="table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialty</th>
            <th>Phone</th>
            <th class="text-end" style="width: 160px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${doctors
            .map(
              (d) => `
            <tr data-id="${escapeHtml(d.id)}">
              <td class="fw-semibold">${escapeHtml(d.name)}</td>
              <td>${escapeHtml(d.specialty || "")}</td>
              <td>${escapeHtml(d.phone || "")}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-2 js-edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger js-delete"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `
            )
            .join("")}
          ${doctors.length === 0 ? `<tr><td colspan="4" class="text-muted">No doctors yet.</td></tr>` : ""}
        </tbody>
      </table>
    </div>
  `;
}

function appointmentsTable(appointments, opts = {}) {
  const compact = Boolean(opts.compact);
  const patientsById = new Map(state.patients.map((p) => [p.id, p.name]));
  const doctorsById = new Map(state.doctors.map((d) => [d.id, d.name]));

  return `
    <div class="table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th class="${compact ? "d-none" : ""}">Fees</th>
            <th class="${compact ? "d-none" : ""}">Payment</th>
            <th class="${compact ? "d-none" : ""}">Description</th>
            <th class="text-end" style="width: 160px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${appointments
            .map(
              (a) => `
            <tr data-id="${escapeHtml(a.id)}">
              <td class="fw-semibold">${escapeHtml(a.date || "")}</td>
              <td>${escapeHtml(a.time || "")}</td>
              <td>${escapeHtml(patientsById.get(a.patient_id) || "(deleted)")}</td>
              <td>${escapeHtml(doctorsById.get(a.doctor_id) || "(deleted)")}</td>
              <td class="${compact ? "d-none" : ""}">${a.consult_fees == null ? "" : escapeHtml(a.consult_fees)}</td>
              <td class="${compact ? "d-none" : ""}">${escapeHtml(a.payment_mode || "")}</td>
              <td class="${compact ? "d-none" : ""}">${escapeHtml(a.description || "")}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-2 js-edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger js-delete"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `
            )
            .join("")}
          ${appointments.length === 0 ? `<tr><td colspan="8" class="text-muted">No appointments yet.</td></tr>` : ""}
        </tbody>
      </table>
    </div>
  `;
}

function openPatientModal({ mode, patient }) {
  const isEdit = mode === "edit";
  const p = patient || { name: "", dob: "", phone: "", notes: "" };
  openModal({
    title: isEdit ? "Edit Patient" : "Add Patient",
    bodyHtml: `
      <form id="patientForm" class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Name</label>
          <input class="form-control" name="name" value="${escapeHtml(p.name)}" required />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Date of Birth</label>
          <input class="form-control" type="date" name="dob" value="${escapeHtml(p.dob || "")}" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Phone</label>
          <input class="form-control" name="phone" value="${escapeHtml(p.phone || "")}" />
        </div>
        <div class="col-12">
          <label class="form-label">Notes</label>
          <textarea class="form-control" name="notes" rows="3">${escapeHtml(p.notes || "")}</textarea>
        </div>
      </form>
    `,
    onSave: () => {
      const form = document.getElementById("patientForm");
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      if (!payload.name.trim()) throw new Error("Name is required.");
      if (isEdit) {
        state.patients = state.patients.map((x) => (x.id === p.id ? { ...x, ...payload } : x));
        showAlert("success", "Patient updated.");
      } else {
        state.patients.unshift({ id: crypto.randomUUID(), ...payload });
        showAlert("success", "Patient created.");
      }
      saveState();
      patientsView();
    }
  });
}

function openDoctorModal({ mode, doctor }) {
  const isEdit = mode === "edit";
  const d = doctor || { name: "", specialty: "", phone: "" };
  openModal({
    title: isEdit ? "Edit Doctor" : "Add Doctor",
    bodyHtml: `
      <form id="doctorForm" class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Name</label>
          <input class="form-control" name="name" value="${escapeHtml(d.name)}" required />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Specialty</label>
          <input class="form-control" name="specialty" value="${escapeHtml(d.specialty || "")}" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Phone</label>
          <input class="form-control" name="phone" value="${escapeHtml(d.phone || "")}" />
        </div>
      </form>
    `,
    onSave: () => {
      const form = document.getElementById("doctorForm");
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      if (!payload.name.trim()) throw new Error("Name is required.");
      if (isEdit) {
        state.doctors = state.doctors.map((x) => (x.id === d.id ? { ...x, ...payload } : x));
        showAlert("success", "Doctor updated.");
      } else {
        state.doctors.unshift({ id: crypto.randomUUID(), ...payload });
        showAlert("success", "Doctor created.");
      }
      saveState();
      doctorsView();
    }
  });
}

function openAppointmentModal({ mode, appointment }) {
  const isEdit = mode === "edit";
  const a = appointment || {
    patient_id: "",
    doctor_id: "",
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    consult_fees: "",
    payment_mode: "",
    description: ""
  };

  openModal({
    title: isEdit ? "Edit Appointment" : "Add Appointment",
    bodyHtml: `
      <form id="appointmentForm" class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Patient</label>
          <select class="form-select" name="patient_id" required>
            <option value="">Select Patient</option>
            ${state.patients
              .map(
                (p) => `<option value="${escapeHtml(p.id)}" ${p.id === a.patient_id ? "selected" : ""}>${escapeHtml(p.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Doctor</label>
          <select class="form-select" name="doctor_id" required>
            <option value="">Select Doctor</option>
            ${state.doctors
              .map(
                (d) => `<option value="${escapeHtml(d.id)}" ${d.id === a.doctor_id ? "selected" : ""}>${escapeHtml(d.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Date</label>
          <input class="form-control" type="date" name="date" value="${escapeHtml(a.date || "")}" required />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Time</label>
          <input class="form-control" type="time" name="time" value="${escapeHtml(a.time || "")}" required />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Consult Fees</label>
          <input class="form-control" type="number" min="0" step="0.01" name="consult_fees" value="${escapeHtml(a.consult_fees ?? "")}" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Payment Mode</label>
          <select class="form-select" name="payment_mode">
            <option value="">Select Payment Mode</option>
            ${["Cash", "Card", "Insurance", "Online"]
              .map((m) => `<option ${m === a.payment_mode ? "selected" : ""}>${escapeHtml(m)}</option>`)
              .join("")}
          </select>
        </div>
        <div class="col-12 col-md-8">
          <label class="form-label">Description</label>
          <input class="form-control" name="description" value="${escapeHtml(a.description || "")}" />
        </div>
      </form>
    `,
    onSave: () => {
      const form = document.getElementById("appointmentForm");
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      if (!payload.patient_id || !payload.doctor_id || !payload.date || !payload.time) {
        throw new Error("Patient, doctor, date and time are required.");
      }
      payload.consult_fees = payload.consult_fees ? Number(payload.consult_fees) : null;
      if (isEdit) {
        state.appointments = state.appointments.map((x) => (x.id === a.id ? { ...x, ...payload } : x));
        showAlert("success", "Appointment updated.");
      } else {
        state.appointments.unshift({ id: crypto.randomUUID(), ...payload });
        showAlert("success", "Appointment created.");
      }
      saveState();
      appointmentsView();
    }
  });
}

function wirePatientTableActions() {
  view.querySelectorAll("tbody tr[data-id]").forEach((tr) => {
    const id = tr.getAttribute("data-id");
    tr.querySelector(".js-edit").addEventListener("click", () => {
      const patient = state.patients.find((p) => p.id === id);
      if (!patient) return;
      openPatientModal({ mode: "edit", patient });
    });
    tr.querySelector(".js-delete").addEventListener("click", () => {
      const patient = state.patients.find((p) => p.id === id);
      if (!patient) return;
      if (!confirm(`Delete patient "${patient.name}"? This will also remove their appointments.`)) return;
      state.patients = state.patients.filter((p) => p.id !== id);
      state.appointments = state.appointments.filter((a) => a.patient_id !== id);
      saveState();
      patientsView();
      showAlert("success", "Patient deleted.");
    });
  });
}

function wireDoctorTableActions() {
  view.querySelectorAll("tbody tr[data-id]").forEach((tr) => {
    const id = tr.getAttribute("data-id");
    tr.querySelector(".js-edit").addEventListener("click", () => {
      const doctor = state.doctors.find((d) => d.id === id);
      if (!doctor) return;
      openDoctorModal({ mode: "edit", doctor });
    });
    tr.querySelector(".js-delete").addEventListener("click", () => {
      const doctor = state.doctors.find((d) => d.id === id);
      if (!doctor) return;
      if (!confirm(`Delete doctor "${doctor.name}"? This will also remove their appointments.`)) return;
      state.doctors = state.doctors.filter((d) => d.id !== id);
      state.appointments = state.appointments.filter((a) => a.doctor_id !== id);
      saveState();
      doctorsView();
      showAlert("success", "Doctor deleted.");
    });
  });
}

function wireAppointmentTableActions() {
  view.querySelectorAll("tbody tr[data-id]").forEach((tr) => {
    const id = tr.getAttribute("data-id");
    tr.querySelector(".js-edit").addEventListener("click", () => {
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) return;
      openAppointmentModal({ mode: "edit", appointment: appt });
    });
    tr.querySelector(".js-delete").addEventListener("click", () => {
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) return;
      if (!confirm(`Delete appointment on ${appt.date} ${appt.time}?`)) return;
      state.appointments = state.appointments.filter((a) => a.id !== id);
      saveState();
      appointmentsView();
      showAlert("success", "Appointment deleted.");
    });
  });
}

function dashboardView() {
  const cards = [
    { label: "Patients", value: state.patients.length, icon: "bi-people" },
    { label: "Doctors", value: state.doctors.length, icon: "bi-person-badge" },
    { label: "Appointments", value: state.appointments.length, icon: "bi-calendar2-check" }
  ];

  view.innerHTML = `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="page-title">Dashboard</div>
      <button class="btn btn-sm btn-outline-secondary" id="resetBtn"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset demo data</button>
    </div>

    <div class="row g-3 mb-3">
      ${cards
        .map(
          (c) => `
        <div class="col-12 col-md-4">
          <div class="card card-soft">
            <div class="card-body d-flex align-items-center justify-content-between">
              <div>
                <div class="text-muted small">${escapeHtml(c.label)}</div>
                <div class="fs-4 fw-semibold">${escapeHtml(c.value)}</div>
              </div>
              <div class="fs-3 text-muted"><i class="bi ${escapeHtml(c.icon)}"></i></div>
            </div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="card card-soft">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="fw-semibold">Recent Appointments</div>
          <a class="btn btn-sm btn-primary" href="#/appointments">Go to Appointments</a>
        </div>
        ${appointmentsTable(state.appointments.slice(0, 5), { compact: true })}
      </div>
    </div>
  `;

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset to demo data? This will clear your current records on this browser.")) return;
    state = loadState();
    saveState();
    dashboardView();
    showAlert("success", "Demo data restored.");
  });
}

function patientsView() {
  view.innerHTML = `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="page-title">Patient Details</div>
      <button class="btn btn-sm btn-success" id="addPatientBtn"><i class="bi bi-plus-lg me-1"></i>Add Patient</button>
    </div>

    <div class="card card-soft">
      <div class="card-body">
        ${patientsTable(state.patients)}
      </div>
    </div>
  `;

  document.getElementById("addPatientBtn").addEventListener("click", () => {
    openPatientModal({ mode: "create" });
  });

  wirePatientTableActions();
}

function doctorsView() {
  view.innerHTML = `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="page-title">Doctor Details</div>
      <button class="btn btn-sm btn-success" id="addDoctorBtn"><i class="bi bi-plus-lg me-1"></i>Add Doctor</button>
    </div>

    <div class="card card-soft">
      <div class="card-body">
        ${doctorsTable(state.doctors)}
      </div>
    </div>
  `;

  document.getElementById("addDoctorBtn").addEventListener("click", () => {
    openDoctorModal({ mode: "create" });
  });

  wireDoctorTableActions();
}

function appointmentsView() {
  view.innerHTML = `
    <div class="page-title">Add New Appointment</div>

    <div class="card card-soft mb-3">
      <div class="card-body">
        <form id="apptForm" class="row g-3">
          <div class="col-12 col-md-4">
            <label class="form-label">Patient Name</label>
            <select class="form-select" name="patient_id" required>
              <option value="">Select Patient</option>
              ${state.patients.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}
            </select>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Doctor Name</label>
            <select class="form-select" name="doctor_id" required>
              <option value="">Select Doctor</option>
              ${state.doctors.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)}</option>`).join("")}
            </select>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Appointment Date</label>
            <input class="form-control" type="date" name="date" required />
          </div>

          <div class="col-12 col-md-4">
            <label class="form-label">Consult Fees</label>
            <input class="form-control" type="number" min="0" step="0.01" name="consult_fees" placeholder="0.00" />
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Time Preferred</label>
            <input class="form-control" type="time" name="time" required />
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Appointment Time</label>
            <input class="form-control" type="text" value="(same as preferred)" disabled />
          </div>

          <div class="col-12 col-md-4">
            <label class="form-label">Payment Mode</label>
            <select class="form-select" name="payment_mode">
              <option value="">Select Payment Mode</option>
              <option>Cash</option>
              <option>Card</option>
              <option>Insurance</option>
              <option>Online</option>
            </select>
          </div>
          <div class="col-12 col-md-8">
            <label class="form-label">Description</label>
            <input class="form-control" name="description" placeholder="Additional description/details/notes" />
          </div>

          <div class="col-12 d-flex gap-2">
            <button class="btn btn-success" type="submit"><i class="bi bi-check2-circle me-1"></i>Save</button>
            <button class="btn btn-light" type="reset"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card card-soft">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="fw-semibold">Appointments</div>
        </div>
        ${appointmentsTable(state.appointments)}
      </div>
    </div>
  `;

  const apptForm = document.getElementById("apptForm");
  const dateInput = apptForm.querySelector('input[name="date"]');
  const timeInput = apptForm.querySelector('input[name="time"]');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  if (timeInput && !timeInput.value) timeInput.value = "09:00";

  apptForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(apptForm);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.patient_id || !payload.doctor_id || !payload.date || !payload.time) {
      showAlert("danger", "Patient, doctor, date and time are required.");
      return;
    }
    payload.consult_fees = payload.consult_fees ? Number(payload.consult_fees) : null;
    state.appointments.unshift({ id: crypto.randomUUID(), ...payload });
    saveState();
    appointmentsView();
    showAlert("success", "Appointment created.");
    apptForm.reset();
  });

  wireAppointmentTableActions();
}

function reportsView() {
  const byPayment = state.appointments.reduce((acc, a) => {
    const k = (a.payment_mode || "Unspecified").trim() || "Unspecified";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  view.innerHTML = `
    <div class="page-title">Reports</div>
    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="card card-soft">
          <div class="card-body">
            <div class="fw-semibold mb-2">Appointments by Payment Mode</div>
            ${Object.keys(byPayment).length === 0 ? `<div class="text-muted">No data yet.</div>` : ""}
            <ul class="list-group list-group-flush">
              ${Object.entries(byPayment)
                .sort((a, b) => b[1] - a[1])
                .map(
                  ([mode, count]) => `
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${escapeHtml(mode)}</span>
                    <span class="badge text-bg-secondary">${escapeHtml(count)}</span>
                  </li>
                `
                )
                .join("")}
            </ul>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card card-soft">
          <div class="card-body">
            <div class="fw-semibold mb-2">Latest Appointments</div>
            ${appointmentsTable(state.appointments.slice(0, 8), { compact: true })}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function route() {
  const hash = window.location.hash || "#/dashboard";
  const routeName = hash.replace("#/", "").split("?")[0] || "dashboard";
  setActiveNav(routeName);
  closeSidebarOnMobile();

  if (routeName === "dashboard") return dashboardView();
  if (routeName === "patients") return patientsView();
  if (routeName === "doctors") return doctorsView();
  if (routeName === "appointments") return appointmentsView();
  if (routeName === "reports") return reportsView();

  window.location.hash = "#/dashboard";
}

window.addEventListener("hashchange", route);
route();

