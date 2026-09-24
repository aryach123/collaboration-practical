/* Administrator governance pages. */
(function (global) {
  function pageOverview() {
    const policies = ALMSState.get().policies;
    const pending = ALMSState.get().exceptions.filter(function (e) { return e.status !== "Resolved"; });
    const policyAudits = ALMSState.get().audit.filter(function (a) {
      return a.event.toLowerCase().indexOf("policy") !== -1;
    }).slice(0, 4);
    return (
      '<div class="page-header"><h2>System Overview</h2><p>Governance status for policies, autonomous rules, and significant exceptions. Day-to-day loans are not managed here.</p></div>' +
      '<div class="summary-grid" style="margin-bottom:16px">' +
      '<div class="summary-card"><div class="label">System status</div><div class="value">Operational</div><div class="meta">Autonomous rules active</div></div>' +
      '<div class="summary-card"><div class="label">Active policies</div><div class="value">4</div><div class="meta">Borrowing, Fine, Reservation, Extension</div></div>' +
      '<div class="summary-card"><div class="label">Significant exceptions</div><div class="value">' +
      pending.length +
      '</div><div class="meta">Awaiting librarian review</div></div>' +
      '<div class="summary-card"><div class="label">Loan duration</div><div class="value">' +
      policies.borrowing.loanDurationDays +
      ' days</div><div class="meta">Max loans ' +
      policies.borrowing.maxActiveLoans +
      "</div></div></div>" +
      '<div class="two-col"><section class="card card-pad"><h3>Recent policy changes</h3>' +
      (policyAudits.length
        ? policyAudits
            .map(function (a) {
              return (
                '<div class="notif-item"><div><strong>' +
                ALMSUI.esc(a.event) +
                '</strong><div class="secondary">' +
                ALMSUI.esc(a.change) +
                '</div><div class="muted">' +
                ALMSUI.formatDateTime(a.time) +
                "</div></div></div>"
              );
            })
            .join("")
        : "<p class='muted'>No recent policy edits in this session.</p>") +
      '</section><section class="card card-pad"><h3>Important audit events</h3>' +
      ALMSState.get()
        .audit.slice(0, 5)
        .map(function (a) {
          return (
            '<div class="notif-item"><div><strong>' +
            ALMSUI.esc(a.actor) +
            " · " +
            ALMSUI.esc(a.event) +
            '</strong><div class="secondary">' +
            ALMSUI.esc(a.change) +
            "</div></div></div>"
          );
        })
        .join("") +
      "</section></div>"
    );
  }

  function pageUsers() {
    const users = Object.values(ALMSState.get().users);
    return (
      '<div class="page-header"><h2>Users & Access</h2><p>Role assignment and account status. Circulation work is not performed from this page.</p></div>' +
      '<section class="card"><div class="table-wrap"><div class="activity-row table-head"><div>Name</div><div>ID</div><div>Role</div><div>Status</div><div>Email</div><div></div></div>' +
      users
        .map(function (u) {
          return (
            '<div class="activity-row"><div>' +
            ALMSUI.esc(u.name) +
            "</div><div>" +
            ALMSUI.esc(u.institutionalId) +
            "</div><div>" +
            ALMSUI.esc(ALMSNav.roleLabel(u.role)) +
            "</div><div>" +
            ALMSUI.badge(u.status) +
            "</div><div>" +
            ALMSUI.esc(u.email) +
            "</div><div></div></div>"
          );
        })
        .join("") +
      "</div></section>"
    );
  }

  function pagePolicies(query) {
    const tab = query.tab || "borrowing";
    const p = ALMSState.get().policies;
    const tabs = [
      ["borrowing", "Borrowing Policy"],
      ["fines", "Fine Policy"],
      ["reservations", "Reservation Policy"],
      ["extensions", "Extension Policy"]
    ];
    let form = "";
    if (tab === "borrowing") {
      form =
        '<form class="policy-form" data-action="save-policy" data-policy="borrowing">' +
        field("maxActiveLoans", "Maximum Active Loans", p.borrowing.maxActiveLoans) +
        field("loanDurationDays", "Loan Duration (days)", p.borrowing.loanDurationDays) +
        field("maxStandardExtensions", "Maximum Standard Extensions", p.borrowing.maxStandardExtensions) +
        '<button class="btn btn-primary" type="submit">Save Changes</button></form>';
    }
    if (tab === "fines") {
      form =
        '<form class="policy-form" data-action="save-policy" data-policy="fines">' +
        field("perDay", "Fine Per Overdue Day (₹)", p.fines.perDay) +
        field("gracePeriodDays", "Grace Period (days)", p.fines.gracePeriodDays) +
        '<p class="hint">Future simulated fines use these values. Autonomous behaviour is governed by institutional policy.</p>' +
        '<button class="btn btn-primary" type="submit">Save Changes</button></form>';
    }
    if (tab === "reservations") {
      form =
        '<form class="policy-form" data-action="save-policy" data-policy="reservations">' +
        field("maxReservations", "Maximum reservations", p.reservations.maxReservations) +
        field("collectionPeriodDays", "Collection period (days)", p.reservations.collectionPeriodDays) +
        field("expiryDays", "Reservation expiry (days)", p.reservations.expiryDays) +
        '<button class="btn btn-primary" type="submit">Save Changes</button></form>';
    }
    if (tab === "extensions") {
      form =
        '<form class="policy-form" data-action="save-policy" data-policy="extensions">' +
        '<div class="field"><label for="allowed">Extensions allowed</label>' +
        '<select class="select" id="allowed" name="allowed"><option value="true"' +
        (p.extensions.allowed ? " selected" : "") +
        ">Yes</option><option value='false'" +
        (!p.extensions.allowed ? " selected" : "") +
        ">No</option></select></div>" +
        field("maxPerLoan", "Maximum per loan", p.extensions.maxPerLoan) +
        '<button class="btn btn-primary" type="submit">Save Changes</button></form>';
    }
    return (
      '<div class="page-header"><h2>Policies</h2><p>These settings bound autonomous evaluations for students.</p></div>' +
      '<div class="tabs">' +
      tabs
        .map(function (t) {
          return (
            '<a class="tab' +
            (tab === t[0] ? " is-active" : "") +
            '" href="#/admin/policies?tab=' +
            t[0] +
            '">' +
            t[1] +
            "</a>"
          );
        })
        .join("") +
      '</div><section class="card card-pad">' +
      form +
      "</section>"
    );
  }

  function field(name, label, value) {
    return (
      '<div class="field"><label for="' +
      name +
      '">' +
      ALMSUI.esc(label) +
      '</label><input class="input" id="' +
      name +
      '" name="' +
      name +
      '" type="number" min="0" value="' +
      ALMSUI.esc(value) +
      '" required></div>'
    );
  }

  function pageRules() {
    const rules = [
      {
        title: "Borrowing Eligibility Rule",
        policy: "Borrowing Policy",
        trigger: "Student requests borrowing.",
        behavior: "Eligible → Create Loan. Not eligible → Reject with explanation. Ambiguous → Create Exception."
      },
      {
        title: "Due Date Rule",
        policy: "Borrowing Policy",
        trigger: "Loan is created.",
        behavior: "Assign due date as issue date plus configured loan duration."
      },
      {
        title: "Overdue Rule",
        policy: "Fine Policy",
        trigger: "An active loan passes its due date.",
        behavior: "Mark overdue, determine overdue days, and continue to fine calculation."
      },
      {
        title: "Fine Calculation Rule",
        policy: "Fine Policy",
        trigger: "Overdue detected.",
        behavior: "Charge (overdue days − grace) × fine per day. Do not waive without human review."
      },
      {
        title: "Reservation Rule",
        policy: "Reservation Policy",
        trigger: "Student requests a reservation on an unavailable reservable title.",
        behavior: "Eligible → queue. Limit or duplicate → reject with explanation."
      },
      {
        title: "Notification Rule",
        policy: "Notification Rule",
        trigger: "Loan created, due soon, overdue, fine created, reservation available, or request resolved.",
        behavior: "Create a student notification linked to the related record."
      },
      {
        title: "Exception Detection Rule",
        policy: "Exception Policy",
        trigger: "A situation requires judgment, dispute, or physical verification.",
        behavior: "Stop automatic resolution and place the case in the librarian exception queue."
      }
    ];
    return (
      '<div class="page-header"><h2>Autonomous Rules</h2><p>Readable summaries of how the system behaves. This is not a programming interface.</p></div>' +
      '<div class="rule-grid">' +
      rules
        .map(function (r) {
          return (
            '<article class="card card-pad">' +
            ALMSUI.badge("Active") +
            "<h3 style='margin-top:8px'>" +
            ALMSUI.esc(r.title) +
            "</h3>" +
            ALMSUI.kv([
              ["Related policy", ALMSUI.esc(r.policy)],
              ["Trigger", ALMSUI.esc(r.trigger)],
              ["Behavior", ALMSUI.esc(r.behavior)]
            ]) +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function pageReports() {
    const loans = ALMSState.get().loans;
    const overdue = loans.filter(function (l) { return l.status === "Overdue"; }).length;
    const fines = ALMSState.get().fines.reduce(function (s, f) { return s + f.amount; }, 0);
    const reservations = ALMSState.get().reservations.length;
    const exceptions = ALMSState.get().exceptions.length;
    return (
      '<div class="page-header"><h2>Reports</h2><p>Simple operational summaries for demonstration.</p></div>' +
      '<div class="summary-grid">' +
      '<div class="summary-card"><div class="label">Borrowing</div><div class="value">' +
      loans.length +
      '</div><div class="meta">Loan records in demo data</div></div>' +
      '<div class="summary-card"><div class="label">Overdue</div><div class="value">' +
      overdue +
      '</div><div class="meta">Currently overdue</div></div>' +
      '<div class="summary-card"><div class="label">Fines</div><div class="value">' +
      ALMSUI.rupees(fines) +
      '</div><div class="meta">Current recorded amount</div></div>' +
      '<div class="summary-card"><div class="label">Reservations</div><div class="value">' +
      reservations +
      '</div><div class="meta">Queue records</div></div></div>' +
      '<div class="summary-card" style="margin-top:12px"><div class="label">Exceptions</div><div class="value">' +
      exceptions +
      '</div><div class="meta">Including resolved cases</div></div>'
    );
  }

  function pageAudit() {
    return (
      '<div class="page-header"><h2>Audit</h2><p>Policy changes and operational events share one trail.</p></div>' +
      '<section class="card">' +
      ALMSLibrarian.auditTable() +
      "</section>"
    );
  }

  global.ALMSAdmin = {
    pageOverview: pageOverview,
    pageUsers: pageUsers,
    pagePolicies: pagePolicies,
    pageRules: pageRules,
    pageReports: pageReports,
    pageAudit: pageAudit
  };
})(window);
