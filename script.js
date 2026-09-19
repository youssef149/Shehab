// ==========================================
// 1. الثوابت وإعدادات النظام (قابل للتعديل بالكامل)
// ==========================================
let AC_HP_TABLE = [
    { btu: 9000, hp: 1 },
    { btu: 12000, hp: 1.5 },
    { btu: 18000, hp: 2.25 },
    { btu: 24000, hp: 3 },
    { btu: 30000, hp: 4 },
    { btu: 36000, hp: 5 },
    { btu: 48000, hp: 6 },
    { btu: 60000, hp: 7.5 }
];

const AC_CAPACITIES = [9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000];

let CONFIG = {
    baseLoadPerM2: 500, // BTU/h per m2
    roomTypeMultipliers: {
        bedroom: 1.0,
        living: 1.15,
        office: 1.1,
        shop: 1.3,
        restaurant: 1.4,
        admin: 1.1,
        class: 1.25
    },
    sunMultipliers: { low: 0.9, medium: 1.0, high: 1.2 },
    orientationMultipliers: { north: 0.95, south: 1.05, east: 1.10, west: 1.15 }, // المعامل الحراري لاتجاه الغرفة
    insulationMultipliers: { good: 0.85, medium: 1.0, bad: 1.25 },
    appliancePower: { low: 600, medium: 1200, high: 2000 },
    personLoad: 600 // BTU/h per person
};

// تخزين آخر نتيجة حسابية للتفاصيل و"ماذا لو"
let lastCalculationData = null;

// ==========================================
// 2. دوال التحكم بالواجهة (Stepper & Actions)
// ==========================================
function adjustCount(id, amount) {
    let input = document.getElementById(id);
    let val = parseInt(input.value) || 0;
    val = Math.max(0, val + amount);
    input.value = val;
}

function loadSampleData() {
    document.getElementById('room-length').value = 6;
    document.getElementById('room-width').value = 5;
    document.getElementById('room-height').value = 3;
    document.getElementById('room-orientation').value = 'west';
    document.getElementById('persons-count').value = 4;
    document.getElementById('windows-count').value = 2;
    document.getElementById('window-size').value = 'medium';
    document.getElementById('doors-count').value = 1;
    document.getElementById('sun-exposure').value = 'high';
    document.getElementById('room-type').value = 'living';
    document.getElementById('appliances-count').value = 3;
    document.getElementById('appliances-load').value = 'medium';
    document.getElementById('insulation-level').value = 'medium';
    document.getElementById('outdoor-temp').value = '35';
    alert("تم إدخال بيانات تجريبية بنجاح! اضغط الآن على 'احسب قدرة التكييف'");
}

// ==========================================
// 3. المنطق والحسابات الرئيسية
// ==========================================
function getHPForBTU(targetBtu) {
    let matchedCapacity = AC_CAPACITIES[0];
    for (let cap of AC_CAPACITIES) {
        if (targetBtu <= cap) {
            matchedCapacity = cap;
            break;
        }
        matchedCapacity = AC_CAPACITIES[AC_CAPACITIES.length - 1];
    }
    let hpObj = AC_HP_TABLE.find(item => item.btu === matchedCapacity);
    return { btu: matchedCapacity, hp: hpObj ? hpObj.hp : 1 };
}

function calculateAC() {
    let length = parseFloat(document.getElementById('room-length').value) || 0;
    let width = parseFloat(document.getElementById('room-width').value) || 0;
    let height = parseFloat(document.getElementById('room-height').value) || 0;

    if (length <= 0 || width <= 0 || height <= 0) {
        alert("يرجى إدخال أبعاد صحيحة للغرفة (لا توجد قيم سالبة أو صفرية).");
        return;
    }

    let orientation = document.getElementById('room-orientation').value;
    let persons = parseInt(document.getElementById('persons-count').value) || 0;
    let windowsCount = parseInt(document.getElementById('windows-count').value) || 0;
    let windowSize = document.getElementById('window-size').value;
    let doorsCount = parseInt(document.getElementById('doors-count').value) || 0;
    let sun = document.getElementById('sun-exposure').value;
    let roomType = document.getElementById('room-type').value;
    let appliancesCount = parseInt(document.getElementById('appliances-count').value) || 0;
    let appliancesLoad = document.getElementById('appliances-load').value;
    let insulation = document.getElementById('insulation-level').value;
    let outdoorTemp = parseFloat(document.getElementById('outdoor-temp').value) || 30;

    let area = length * width;
    let volume = area * height;

    // الحمل الأساسي
    let baseLoad = area * CONFIG.baseLoadPerM2;

    // حساب تأثير الأشخاص
    let personsLoad = persons * CONFIG.personLoad;

    // حساب تأثير الشمس والنوافذ واتجاه الغرفة
    let windowFactor = windowSize === 'small' ? 1000 : (windowSize === 'medium' ? 2000 : 3500);
    let sunFactor = CONFIG.sunMultipliers[sun];
    let orientFactor = CONFIG.orientationMultipliers[orientation] || 1.0;
    let sunLoad = (windowsCount * windowFactor) * sunFactor * orientFactor;

    // الأجهزة الكهربائية (كل وات يعادل تقريباً 3.41 BTU/h)
    let appWatts = CONFIG.appliancePower[appliancesLoad] * appliancesCount;
    let appLoad = appWatts * 3.41;

    // العزل والنوع والحرارة الخارجية
    let insFactor = CONFIG.insulationMultipliers[insulation];
    let typeFactor = CONFIG.roomTypeMultipliers[roomType];
    let tempFactor = 1 + ((outdoorTemp - 30) * 0.02); // زيادة 2% لكل درجة فوق 30

    let subTotal = (baseLoad + personsLoad + sunLoad + appLoad) * typeFactor * insFactor * tempFactor;
    let finalBtu = Math.round(subTotal);

    // القدرة التجارية المقترحة
    let recommended = getHPForBTU(finalBtu);

    // التحويلات القياسية
    let kwCooling = (finalBtu / 3412.14).toFixed(2);
    let tr = (finalBtu / 12000).toFixed(2);

    lastCalculationData = {
        length, width, height, area, volume, orientation, persons, windowsCount, doorsCount,
        sun, roomType, appliancesCount, insulation, outdoorTemp,
        baseLoad: Math.round(baseLoad),
        personsLoad: Math.round(personsLoad),
        sunLoad: Math.round(sunLoad),
        appLoad: Math.round(appLoad),
        finalBtu, kwCooling, tr,
        recommended
    };

    // حفظ في LocalStorage
    localStorage.setItem('ac_calc_last', JSON.stringify(lastCalculationData));

    // عرض النتائج في الواجهة
    displayResults(lastCalculationData);
}

function calculateCostLive() {
    if (!lastCalculationData) return;
    let hours = parseFloat(document.getElementById('cost-hours').value) || 8;
    let rate = parseFloat(document.getElementById('cost-rate').value) || 1.5;

    // القدرة الكهربائية المسحوبة التقريبية (استناداً إلى معامل كفاءة COP ~ 3.1)
    let electricKw = (lastCalculationData.kwCooling / 3.1).toFixed(2);
    let monthlyKwh = Math.round(electricKw * hours * 30);
    let monthlyCost = Math.round(monthlyKwh * rate);

    document.getElementById('res-electric-kw').innerText = `${electricKw} kW`;
    document.getElementById('res-kwh-month').innerText = `${monthlyKwh.toLocaleString()} kWh`;
    document.getElementById('res-cost-month').innerText = `${monthlyCost.toLocaleString()} ج.م`;
}

function displayResults(data) {
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('res-btu').innerText = `${data.finalBtu.toLocaleString()} BTU/h`;
    document.getElementById('res-kw').innerText = `${data.kwCooling} kW`;
    document.getElementById('res-tr').innerText = `${data.tr} TR`;

    document.getElementById('res-rec-btu').innerText = `${data.recommended.btu.toLocaleString()} BTU/h`;
    document.getElementById('res-rec-hp').innerText = `${data.recommended.hp} HP`;

    document.getElementById('conv-btu').innerText = `${data.finalBtu.toLocaleString()} BTU/h`;
    document.getElementById('conv-kw').innerText = `${data.kwCooling} kW`;
    document.getElementById('conv-tr').innerText = `${data.tr} TR`;
    document.getElementById('conv-hp').innerText = `${data.recommended.hp} HP`;

    // حساب الكهرباء والتكلفة
    calculateCostLive();

    // تعبئة قسم ماذا لو
    document.getElementById('wi-persons').value = data.persons;
    document.getElementById('wi-temp').value = data.outdoorTemp;

    // ترجمة الاتجاه
    let orientText = {
        north: "بحري / شمالي",
        south: "قبلي / جنوبي",
        east: "شرقي",
        west: "غربي"
    }[data.orientation] || data.orientation;

    // تفاصيل الحساب
    let detailsList = document.getElementById('details-list');
    detailsList.innerHTML = `
        <li><span>مساحة الغرفة:</span> <strong>${data.area} m²</strong></li>
        <li><span>حجم الغرفة:</span> <strong>${data.volume} m³</strong></li>
        <li><span>اتجاه الواجهة:</span> <strong>${orientText}</strong></li>
        <li><span>الحمل الأساسي:</span> <strong>${data.baseLoad} BTU/h</strong></li>
        <li><span>إضافة الأشخاص:</span> <strong>+${data.personsLoad} BTU/h</strong></li>
        <li><span>تأثير الشمس والنوافذ:</span> <strong>+${data.sunLoad} BTU/h</strong></li>
        <li><span>تأثير الأجهزة:</span> <strong>+${data.appLoad} BTU/h</strong></li>
    `;

    // رسم بياني مبسط
    let chartEl = document.getElementById('simple-chart');
    let total = data.baseLoad + data.personsLoad + data.sunLoad + data.appLoad || 1;
    chartEl.innerHTML = `
        <div class="bar-item">
            <div class="bar-label"><span>الحمل الأساسي</span><span>${Math.round((data.baseLoad/total)*100)}%</span></div>
            <div class="bar-track"><div class="bar-fill" style="width: ${Math.min(100, (data.baseLoad/total)*100)}%;"></div></div>
        </div>
        <div class="bar-item">
            <div class="bar-label"><span>الأشخاص</span><span>${Math.round((data.personsLoad/total)*100)}%</span></div>
            <div class="bar-track"><div class="bar-fill" style="width: ${Math.min(100, (data.personsLoad/total)*100)}%;"></div></div>
        </div>
        <div class="bar-item">
            <div class="bar-label"><span>الشمس والشبابيك والتوجيه</span><span>${Math.round((data.sunLoad/total)*100)}%</span></div>
            <div class="bar-track"><div class="bar-fill" style="width: ${Math.min(100, (data.sunLoad/total)*100)}%;"></div></div>
        </div>
        <div class="bar-item">
            <div class="bar-label"><span>الأجهزة</span><span>${Math.round((data.appLoad/total)*100)}%</span></div>
            <div class="bar-track"><div class="bar-fill" style="width: ${Math.min(100, (data.appLoad/total)*100)}%;"></div></div>
        </div>
    `;

    window.location.hash = '#results-section';
}

// ميزة ماذا لو الحية
function runWhatIf() {
    if (!lastCalculationData) return;
    let p = parseInt(document.getElementById('wi-persons').value) || 0;
    let t = parseFloat(document.getElementById('wi-temp').value) || 30;
    
    let diffPersons = (p - lastCalculationData.persons) * CONFIG.personLoad;
    let diffTemp = (t - lastCalculationData.outdoorTemp) * 0.02 * lastCalculationData.finalBtu;
    let newBtu = Math.round(lastCalculationData.finalBtu + diffPersons + diffTemp);
    let rec = getHPForBTU(newBtu);

    document.getElementById('res-btu').innerText = `${newBtu.toLocaleString()} BTU/h`;
    document.getElementById('res-rec-btu').innerText = `${rec.btu.toLocaleString()} BTU/h`;
    document.getElementById('res-rec-hp').innerText = `${rec.hp} HP`;
    document.getElementById('conv-hp').innerText = `${rec.hp} HP`;
}

function toggleDetails() {
    let box = document.getElementById('calculation-details');
    box.classList.toggle('hidden');
}

// حاسبة تحويل الوحدات السريعة
function convertUnitsLive() {
    let val = parseFloat(document.getElementById('unit-convert-input').value) || 0;
    document.getElementById('uc-kw').innerText = (val / 3412.14).toFixed(2);
    document.getElementById('uc-tr').innerText = (val / 12000).toFixed(2);
    let hp = getHPForBTU(val).hp;
    document.getElementById('uc-hp').innerText = `${hp} HP`;
}

// ==========================================
// 4. الإعدادات وLocalStorage
// ==========================================
function openSettingsModal() {
    document.getElementById('set-base-load').value = CONFIG.baseLoadPerM2;
    renderHpSettingsTable();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function renderHpSettingsTable() {
    let container = document.getElementById('settings-hp-container');
    let html = `<table style="width:100%; text-align:right; font-size:0.9rem;">
        <tr><th>BTU/h</th><th>الحصان (HP)</th></tr>`;
    AC_HP_TABLE.forEach((item, index) => {
        html += `<tr>
            <td><input type="number" id="set-btu-${index}" value="${item.btu}" style="padding:6px; margin:3px 0;"></td>
            <td><input type="number" step="0.25" id="set-hp-${index}" value="${item.hp}" style="padding:6px; margin:3px 0;"></td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
}

function saveSettings() {
    CONFIG.baseLoadPerM2 = parseFloat(document.getElementById('set-base-load').value) || 500;
    AC_HP_TABLE.forEach((item, index) => {
        let b = parseInt(document.getElementById(`set-btu-${index}`).value);
        let h = parseFloat(document.getElementById(`set-hp-${index}`).value);
        if (!isNaN(b)) item.btu = b;
        if (!isNaN(h)) item.hp = h;
    });
    alert("تم حفظ الإعدادات بنجاح!");
    closeSettingsModal();
    if (lastCalculationData) calculateAC();
}

// LocalStorage للاحتفاظ بآخر جلسة
window.addEventListener('DOMContentLoaded', () => {
    let saved = localStorage.getItem('ac_calc_last');
    if (saved) {
        document.getElementById('saved-session-banner').classList.remove('hidden');
    }
});

function restoreLastSession() {
    let saved = localStorage.getItem('ac_calc_last');
    if (saved) {
        lastCalculationData = JSON.parse(saved);
        displayResults(lastCalculationData);
        document.getElementById('saved-session-banner').classList.hidden = true;
    }
}

function clearLastSession() {
    localStorage.removeItem('ac_calc_last');
    document.getElementById('saved-session-banner').classList.add('hidden');
}

// ==========================================
// 5. التقرير والطباعة
// ==========================================
function openReportModal() {
    if (!lastCalculationData) return;
    let d = lastCalculationData;
    let hours = document.getElementById('cost-hours').value || 8;
    let rate = document.getElementById('cost-rate').value || 1.5;
    let electricKw = (d.kwCooling / 3.1).toFixed(2);
    let monthlyKwh = Math.round(electricKw * hours * 30);
    let monthlyCost = Math.round(monthlyKwh * rate);

    let orientText = {
        north: "بحري / شمالي",
        south: "قبلي / جنوبي",
        east: "شرقي",
        west: "غربي"
    }[d.orientation] || d.orientation;

    let content = `
        <p><strong>🏠 بيانات الغرفة والبيئة:</strong></p>
        <ul>
            <li>الأبعاد: ${d.length} م (طول) × ${d.width} م (عرض) × ${d.height} م (ارتفاع)</li>
            <li>المساحة: ${d.area} م² | الحجم: ${d.volume} م³</li>
            <li>اتجاه الواجهة: <strong>${orientText}</strong></li>
            <li>عدد الأشخاص: ${d.persons} | عدد الشبابيك: ${d.windowsCount}</li>
            <li>التعرض للشمس: ${d.sun} | العزل: ${d.insulation}</li>
        </ul>
        <hr style="border-color: #ddd; margin: 12px 0;">
        <p><strong>📊 نتائج الأحمال الحرارية:</strong></p>
        <ul>
            <li>الحمل التبريدي المطلوب: <strong>${d.finalBtu.toLocaleString()} BTU/h</strong></li>
            <li>القدرة بالتبريد: <strong>${d.kwCooling} kW cooling</strong></li>
            <li>القدرة بطن التبريد: <strong>${d.tr} TR</strong></li>
            <li>قدرة التكييف التجارية المقترحة: <strong style="color:#0284c7;">${d.recommended.btu.toLocaleString()} BTU/h (${d.recommended.hp} HP)</strong></li>
        </ul>
        <hr style="border-color: #ddd; margin: 12px 0;">
        <p><strong>⚡ تقدير استهلاك الكهرباء والتكلفة:</strong></p>
        <ul>
            <li>القدرة الكهربائية المسحوبة التقريبية: <strong>${electricKw} kW</strong></li>
            <li>ساعات التشغيل اليومية: <strong>${hours} ساعات</strong></li>
            <li>الاستهلاك الشهري: <strong>${monthlyKwh.toLocaleString()} kWh</strong></li>
            <li>التكلفة الشهريـة التقريبية: <strong style="color:#d97706;">${monthlyCost.toLocaleString()} ج.م</strong></li>
        </ul>
        <p style="margin-top: 15px; font-size: 0.85rem; color: #64748b;">
            ⚠️ ملاحظة: هذا التقرير هندسي تقريبي مبني على معادلات الأحمال الحرارية للغرف.
        </p>
    `;
    document.getElementById('report-body-content').innerHTML = content;
    document.getElementById('report-modal').classList.remove('hidden');
}

function closeReportModal() {
    document.getElementById('report-modal').classList.add('hidden');
}
