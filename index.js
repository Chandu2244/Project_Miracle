let homeSidebar=document.getElementById("homeSidebar");
let customersSidebar=document.getElementById("customersSidebar");
let quantitySidebar=document.getElementById("quantitySidebar");
let deliverySheetSidebar=document.getElementById("deliverySheetSidebar");
let billingSidebar=document.getElementById("billingSidebar");


const eachSection = document.querySelectorAll('.side-bar-each-feature');
const mainContent = document.getElementById("dashboardBody");

let currentCSS = null;
let currentJS = null;

// Clear localStorage on a fresh site visit (first load)
if (!document.referrer) {
    localStorage.clear();
}


// Function to load a section (can be reused)
async function loadSection(section) {
    const htmlPath = section.dataset.html;
    const cssPath = section.dataset.css;
    const jsPath = section.dataset.js;

    // Remove existing CSS & JS
    if (currentCSS) currentCSS.remove();
    if (currentJS) currentJS.remove();

    // Load HTML
    const res = await fetch(htmlPath);
    const html = await res.text();
    mainContent.innerHTML = html;

    // Load CSS
    currentCSS = document.createElement('link');
    currentCSS.rel = 'stylesheet';
    currentCSS.href = cssPath;
    document.head.appendChild(currentCSS);

    // Load JS
    currentJS = document.createElement("script");
    currentJS.src = jsPath + "?v=" + Date.now();
    currentJS.onload = () => {
        if (typeof window.initQuantityModule === "function") window.initQuantityModule();
        if (typeof window.initCustomerModule === "function") window.initCustomerModule();
        if (typeof window.initBillingModule === "function") window.initBillingModule();
    };
    document.body.appendChild(currentJS);
}

// Sidebar click listener
eachSection.forEach(section => {
    section.addEventListener('click', async () => {
        eachSection.forEach(s => s.classList.remove("select-item"));
        section.classList.add("select-item");

        // Save active section
        localStorage.setItem("activeSection", section.id);

        await loadSection(section);
    });
});

// Restore highlight + reload section if needed
window.addEventListener("DOMContentLoaded", () => {
    const active = localStorage.getItem("activeSection");
    if (active) {
        const section = document.getElementById(active);
        section.classList.add("select-item");
        loadSection(section); // Reload same section UI
    }
});
