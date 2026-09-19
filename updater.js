/* AC Calculator - Update System
 * Current app version: 1.0.0
 * Change ONLY the values in update.json when publishing a new release.
 */
const AC_APP_UPDATE = {
    currentVersion: "1.0.0",
    // IMPORTANT: upload update.json to a public HTTPS URL and put its URL here.
    updateJsonUrl: "https://YOUR-UPDATE-URL-HERE/update.json",
    fallbackDownloadUrl: "https://www.mediafire.com/file/oacgybnvjfdhrln/AC_Calculator.apk/file",
    checkOnStartup: true
};

function acVersionParts(v) {
    return String(v || "0").replace(/^v/i, "").split(".").map(n => parseInt(n,10) || 0);
}

function acIsNewerVersion(remote, local) {
    const a=acVersionParts(remote), b=acVersionParts(local);
    for(let i=0;i<Math.max(a.length,b.length);i++){
        if((a[i]||0)>(b[i]||0)) return true;
        if((a[i]||0)<(b[i]||0)) return false;
    }
    return false;
}

function acEscapeHtml(value){
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function acShowUpdateModal(info){
    const modal=document.getElementById("ac-update-modal");
    if(!modal) return;
    document.getElementById("ac-update-version").textContent="الإصدار الجديد: "+(info.version||"غير معروف");
    const notes=Array.isArray(info.notes)?info.notes:[];
    document.getElementById("ac-update-notes").innerHTML=notes.length
        ? notes.map(n=>`<li>✓ ${acEscapeHtml(n)}</li>`).join("")
        : "<li>✓ تحسينات وإصلاحات جديدة</li>";
    const url=info.download_url || AC_APP_UPDATE.fallbackDownloadUrl;
    document.getElementById("ac-update-button").onclick=()=>{ if(url) window.location.href=url; };
    modal.classList.remove("hidden");
}

function acCloseUpdateModal(){
    const modal=document.getElementById("ac-update-modal");
    if(modal) modal.classList.add("hidden");
}

async function checkACUpdate(showMessage=false){
    if(!navigator.onLine){ if(showMessage) alert("لا يوجد اتصال بالإنترنت حاليًا."); return false; }
    if(AC_APP_UPDATE.updateJsonUrl.includes("YOUR-UPDATE-URL-HERE")){
        if(showMessage) alert("نظام التحديث جاهز، لكن يجب وضع رابط update.json في updater.js أولًا.");
        return false;
    }
    try{
        const sep=AC_APP_UPDATE.updateJsonUrl.includes("?")?"&":"?";
        const response=await fetch(AC_APP_UPDATE.updateJsonUrl+sep+"t="+Date.now(),{cache:"no-store"});
        if(!response.ok) throw new Error("HTTP "+response.status);
        const info=await response.json();
        if(acIsNewerVersion(info.version,AC_APP_UPDATE.currentVersion)){
            acShowUpdateModal(info);
            return true;
        }
        if(showMessage) alert("أنت تستخدم أحدث إصدار حاليًا ✅");
        return false;
    }catch(error){
        console.warn("AC Calculator update check failed:",error);
        if(showMessage) alert("تعذر التحقق من التحديث الآن. تأكد من اتصال الإنترنت.");
        return false;
    }
}

window.addEventListener("DOMContentLoaded",()=>{
    if(AC_APP_UPDATE.checkOnStartup) setTimeout(()=>checkACUpdate(false),1500);
});
