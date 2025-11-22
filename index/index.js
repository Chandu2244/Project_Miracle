let homeSidebar=document.getElementById("homeSidebar");
let customersSidebar=document.getElementById("customersSidebar");
let quantitySidebar=document.getElementById("quantitySidebar");
let deliverySheetSidebar=document.getElementById("deliverySheetSidebar");
let billingSidebar=document.getElementById("billingSidebar");


const eachSection=document.querySelectorAll('.side-bar-each-feature');
const mainContent=document.getElementById("dashboardBody");

let currentCSS = null;
let currentJS= null;

eachSection.forEach(section=>{
    section.addEventListener('click',async ()=> {
        const htmlPath=section.dataset.html;
        const cssPath=section.dataset.css;
        const jsPath=section.dataset.js;

        eachSection.forEach(section=>{
            section.classList.remove("select-item");
        })
        section.classList.add("select-item");

        if (currentCSS){
            currentCSS.remove()
            currentCSS=null;
        }
        if (currentJS){
            currentJS.remove();
            currentJS=null;
        }

        const res= await fetch(htmlPath);
        const html=await res.text();
        mainContent.innerHTML=html;

        currentCSS= document.createElement('link');
        currentCSS.rel='stylesheet';
        currentCSS.href=cssPath
        document.head.appendChild(currentCSS);

        currentJS=document.createElement('script');
        currentJS.src=jsPath;
        document.body.appendChild(currentJS);
    })
})


billingSidebar.click();


