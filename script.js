const form = document.querySelector("#request-form");
const requestType = document.querySelector("#request-type");
const emailSubject = document.querySelector("#email-subject");
const requestSummary = document.querySelector("#request-summary");
const fallback = document.querySelector("#mailto-fallback");
const tabs = document.querySelectorAll(".tab");
const posts = document.querySelectorAll(".post");
const dialog = document.querySelector("#post-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogTitle = document.querySelector("#dialog-title");
const dialogClose = document.querySelector(".dialog-close");

function fieldValue(id) {
  return document.querySelector(id)?.value.trim() || "";
}

function buildEmailBody() {
  const lines = [
    `Email: ${fieldValue("#email") || "Not provided"}`,
    `Request type: ${fieldValue("#request-type") || "Not selected"}`,
    `Reference link: ${fieldValue("#references") || "Not provided"}`,
    "",
    "Message:",
    fieldValue("#message") || "Not provided",
  ];

  return lines.join("\n");
}

function syncFormMeta() {
  const type = requestType.value || "Custom request";
  emailSubject.value = `New request: ${type}`;
  requestSummary.value = buildEmailBody();
  fallback.href = `mailto:bflyzone@gmail.com?subject=${encodeURIComponent(emailSubject.value)}&body=${encodeURIComponent(requestSummary.value)}`;
}

if (form) {
  form.addEventListener("input", syncFormMeta);
  form.addEventListener("change", syncFormMeta);
  syncFormMeta();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    syncFormMeta();

    const btn = form.querySelector("button[type=submit]");
    const originalText = btn.textContent;

    btn.textContent = "Sending…";
    btn.disabled = true;

    try {
      const res = await fetch("https://formsubmit.co/ajax/bflyzone@gmail.com", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (data.success) {
        form.reset();
        syncFormMeta();
        btn.textContent = "Sent!";
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 3000);
      } else {
        throw new Error("submission failed");
      }
    } catch {
      btn.textContent = "Failed — try email instead";
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = originalText;
      }, 4000);
    }
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const filter = tab.dataset.filter;

    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    posts.forEach((post) => {
      post.classList.toggle("hidden", filter !== "all" && post.dataset.filter !== filter);
    });
  });
});

posts.forEach((post) => {
  post.addEventListener("click", () => {
    dialogImage.src = post.dataset.src;
    dialogImage.alt = post.querySelector("img").alt;
    dialogTitle.textContent = post.dataset.title;
    dialog.classList.toggle("clean-preview", post.dataset.clean === "true");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }
  });
});

dialogClose?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});
