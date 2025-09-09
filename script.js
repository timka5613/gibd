// --- Константы ролей ---
const ROLES = [
    'Начальник ОРЛС',
    'ГУ ГИБДД',
    'Зам Начальника ОРЛС',
    'Старший Инструктор ОРЛС',
    'Инструктор ОРЛС',
    'Стажер ОРЛС'
];

// --- Локальное хранилище ---
let db = JSON.parse(localStorage.getItem('panelDB') || '{}');
if (!db.staff) db.staff = [];
if (!db.parades) db.parades = [];
if (!db.reports) db.reports = [];
if (!db.inactives) db.inactives = [];
if (!db.info) db.info = [];
if (!db.certAttest) db.certAttest = [];
if (!db.certRetest) db.certRetest = [];
if (!db.user) db.user = {nickname: "Timofey_Tenkov", role: "Начальник ОРЛС", avatar: ""};
function saveDB() { localStorage.setItem('panelDB', JSON.stringify(db)); }

// --- Очистка строев в 00:00 ---
function autoClearParades() {
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            db.parades = [];
            saveDB();
            renderParades();
            renderDashboard();
        }
    }, 60000);
}

// --- Выпадающий список ролей ---
function populateRoleSelects() {
    document.querySelectorAll('select[name="role"]').forEach(select => {
        select.innerHTML = '';
        ROLES.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            select.appendChild(option);
        });
    });
}

// --- Модальные окна ---
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// --- Переключение вкладок ---
function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    highlightActiveTab(tab);
    if (tab === 'staff') renderStaffTable();
    if (tab === 'certifications') renderCertTables();
    if (tab === 'parades') renderParades();
    if (tab === 'reports') renderReports();
    if (tab === 'info') renderInfo();
    if (tab === 'dashboard') renderParades();
}

// --- Подсветка активной вкладки ---
function highlightActiveTab(tab) {
    document.querySelectorAll('.sidebar nav ul li a').forEach(a => a.classList.remove('bg-blue-900'));
    const links = document.querySelectorAll('.sidebar nav ul li a');
    links.forEach(a => {
        if (a.getAttribute('onclick') && a.getAttribute('onclick').includes(tab)) {
            a.classList.add('bg-blue-900');
        }
    });
}

// --- Переключение между разделами аттестаций ---
function showCertTab(tab) {
    document.getElementById('certAttest').style.display = tab === 'attest' ? '' : 'none';
    document.getElementById('certRetest').style.display = tab === 'retest' ? '' : 'none';
    renderCertTables();
}

// --- Вспомогательные функции для уведомлений ---
function showNotification(message, type = 'info') {
    let notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// --- Проверка заполнения обязательных полей формы ---
function validateForm(formId, requiredFields) {
    const form = document.getElementById(formId);
    for (let field of requiredFields) {
        if (!form[field].value.trim()) {
            showNotification(`Поле "${form[field].placeholder || field}" обязательно!`, 'error');
            return false;
        }
    }
    return true;
}

// --- Быстрый поиск сотрудника ---
function quickFindStaff(nick) {
    const staff = db.staff.find(s => s.nickname.toLowerCase() === nick.toLowerCase());
    if (staff) {
        showTab('staff');
        document.getElementById('staffFilter').value = staff.nickname;
        renderStaffTable();
        showNotification(`Найден сотрудник: ${staff.nickname}`, 'success');
    } else {
        showNotification('Сотрудник не найден!', 'error');
    }
}

// --- Горячая клавиша для поиска ---
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        let nick = prompt('Введите ник сотрудника для поиска:');
        if (nick) quickFindStaff(nick);
    }
});

// --- Сортировка сотрудников по званию ---
function sortStaffByRank() {
    db.staff.sort((a, b) => a.rank.localeCompare(b.rank));
    renderStaffTable();
    showNotification('Сотрудники отсортированы по званию');
}

// --- Подсказки для пользователей ---
function showHelp() {
    alert(
        'Подсказки:\n' +
        '- Для быстрого поиска сотрудника нажмите Ctrl+F\n' +
        '- Для сортировки сотрудников используйте кнопку над таблицей\n' +
        '- Для добавления информации, отчета, неактива используйте соответствующие кнопки\n' +
        '- Руководство может редактировать и удалять сотрудников, строи и информационные блоки\n' +
        '- Строи автоматически очищаются в 00:00 по Москве'
    );
}

// --- Адаптация интерфейса под мобильные устройства ---
function adaptMobile() {
    if (window.innerWidth < 700) {
        document.querySelector('.sidebar').style.width = '100px';
        document.querySelector('.main-content').style.width = 'calc(100% - 100px)';
        document.querySelectorAll('.sidebar nav ul li a').forEach(a => a.style.fontSize = '12px');
    } else {
        document.querySelector('.sidebar').style.width = '250px';
        document.querySelector('.main-content').style.width = 'calc(100% - 250px)';
        document.querySelectorAll('.sidebar nav ul li a').forEach(a => a.style.fontSize = '');
    }
}
window.addEventListener('resize', adaptMobile);

// --- Выход из системы ---
function logout() {
    localStorage.removeItem('panelDB');
    location.reload();
}

// ...existing code...

// --- Таблица сотрудников ---
function staffRowActions(staff) {
    let actions = `<button onclick="editStaff('${staff.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Редактировать</button>`;
    if (['Начальник ОРЛС','ГУ ГИБДД','Зам Начальника ОРЛС'].includes(db.user.role)) {
        actions += `<button onclick="deleteStaff('${staff.id}')" class="bg-red-500 text-white px-2 py-1 rounded ml-2">Удалить</button>`;
    }
    return actions;
}

function renderStaffTable() {
    const filter = document.getElementById('staffFilter').value.toLowerCase();
    const tbody = document.getElementById('staffTable');
    tbody.innerHTML = '';
    db.staff.filter(s => s.nickname.toLowerCase().includes(filter)).forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${s.avatar||''}" class="avatar"></td>
                <td>${s.nickname}</td>
                <td>${s.rank}</td>
                <td><img src="${s.epaulet||''}" style="height:24px"></td>
                <td>${s.warnings||0}</td>
                <td>${s.position}</td>
                <td>${s.personalFile||''}</td>
                <td>${s.report||''}</td>
                <td>${staffRowActions(s)}</td>
            </tr>
        `;
    });
}

function deleteStaff(id) {
    if (!['Начальник ОРЛС','ГУ ГИБДД','Зам Начальника ОРЛС'].includes(db.user.role)) return;
    if (confirm('Удалить сотрудника?')) {
        db.staff = db.staff.filter(st => st.id !== id);
        saveDB();
        renderStaffTable();
    }
}

// --- Аттестации и переаттестации ---
function canEditAttest(a) {
    return a.createdBy === db.user.nickname;
}
function canEditRetest(r) {
    return r.createdBy === db.user.nickname || ['Начальник ОРЛС','ГУ ГИБДД'].includes(db.user.role);
}

function retestFinalActions(retest) {
    if (['Начальник ОРЛС','ГУ ГИБДД'].includes(db.user.role)) {
        return `
            <select onchange="setRetestFinal('${retest.id}', this.value)" class="ml-2 p-1 border rounded">
                <option value="Ожидает" ${retest.final==="Ожидает"?"selected":""}>Ожидает</option>
                <option value="Уволен" ${retest.final==="Уволен"?"selected":""}>Уволен</option>
                <option value="Сдал" ${retest.final==="Сдал"?"selected":""}>Сдал</option>
                <option value="По собственному желанию" ${retest.final==="По собственному желанию"?"selected":""}>По собственному желанию</option>
            </select>
        `;
    }
    return '';
}

function setRetestFinal(id, value) {
    const r = db.certRetest.find(rt => rt.id === id);
    if (r && ['Начальник ОРЛС','ГУ ГИБДД'].includes(db.user.role)) {
        r.final = value;
        saveDB();
        renderCertTables();
    }
}

function renderCertTables() {
    const filter = document.getElementById('certFilter').value.toLowerCase();
    document.getElementById('certAttest').innerHTML = db.certAttest
        .filter(a => a.nickname.toLowerCase().includes(filter))
        .map(a => `
            <div class="mb-2 p-2 border rounded flex justify-between items-center">
                <div>
                    <b>${a.nickname}</b> (${a.acceptedBy}) — ${a.date} — ${a.attempt} попытка — <span class="${a.result==='Сдал'?'text-green-600':'text-red-600'}">${a.result}</span>
                    <a href="${a.proof}" target="_blank" class="text-blue-600 underline ml-2">Доказательство</a>
                </div>
                ${canEditAttest(a) ? `<button onclick="editAttest('${a.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Редактировать</button>` : ''}
            </div>
        `).join('');
    document.getElementById('certRetest').innerHTML = db.certRetest
        .filter(r => r.nickname.toLowerCase().includes(filter))
        .map(r => `
            <div class="mb-2 p-2 border rounded flex justify-between items-center">
                <div>
                    <b>${r.nickname}</b> — ${r.date} — Нарушил: ${r.violation||'-'} — ${r.attempt} попытка — Итог: <span class="font-bold">${r.final}</span>
                    <a href="${r.proof}" target="_blank" class="text-blue-600 underline ml-2">Доказательство</a>
                    ${retestFinalActions(r)}
                </div>
                ${canEditRetest(r) ? `<button onclick="editRetest('${r.id}')" class="bg-purple-500 text-white px-2 py-1 rounded">Редактировать</button>` : ''}
            </div>
        `).join('');
}

// --- Строи ---
function paradeRowActions(parade) {
    let actions = '';
    if (parade.createdBy === db.user.nickname) {
        actions += `<button onclick="editParade('${parade.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Редактировать</button>`;
        actions += `<button onclick="deleteParade('${parade.id}')" class="bg-red-500 text-white px-2 py-1 rounded ml-2">Удалить</button>`;
    }
    return actions;
}

function renderParades() {
    document.getElementById('paradesTable').innerHTML = db.parades.map(p => `
        <li class="mb-2 p-2 border rounded flex justify-between items-center">
            <div>
                <b>${p.department}</b> — ${p.paradeTime}<br>${p.paradeText}
            </div>
            ${paradeRowActions(p)}
        </li>
    `).join('');
    document.getElementById('paradeList').innerHTML = db.parades.length
        ? db.parades.map(p => `<div class="mb-2 p-2 border rounded"><b>${p.department}</b> — ${p.paradeTime}<br>${p.paradeText}</div>`).join('')
        : '<div class="text-gray-500">Нет предстоящих строев.</div>';
}

function deleteParade(id) {
    const parade = db.parades.find(p => p.id === id);
    if (parade && parade.createdBy === db.user.nickname) {
        if (confirm('Удалить строй?')) {
            db.parades = db.parades.filter(p => p.id !== id);
            saveDB();
            renderParades();
            renderDashboard();
        }
    }
}

// --- Информационные блоки ---
function infoRowActions(info) {
    let actions = '';
    if ((db.user.role === 'Начальник ОРЛС' || db.user.role === 'Зам Начальника ОРЛС') && info.createdBy === db.user.nickname) {
        actions += `<button onclick="editInfo('${info.id}')" class="bg-blue-500 text-white px-2 py-1 rounded mt-2">Редактировать</button>`;
        actions += `<button onclick="deleteInfo('${info.id}')" class="bg-red-500 text-white px-2 py-1 rounded mt-2 ml-2">Удалить</button>`;
    }
    return actions;
}

function renderInfo() {
    const blocks = db.info.map(i => `
        <div class="mb-4 p-4 border rounded">
            <h4 class="font-bold">${i.title}</h4>
            <div>${i.content}</div>
            ${infoRowActions(i)}
        </div>
    `).join('');
    document.getElementById('infoBlocks').innerHTML = blocks;
}

function deleteInfo(id) {
    if (!['Начальник ОРЛС','Зам Начальника ОРЛС'].includes(db.user.role)) return;
    if (confirm('Удалить информационный блок?')) {
        db.info = db.info.filter(i => i.id !== id);
        saveDB();
        renderInfo();
    }
}

// --- Отчеты и неактивы ---
function renderReports() {
    // Мои отчеты
    document.getElementById('myReports').innerHTML = db.reports.filter(r => r.nickname === db.user.nickname)
        .map(r => `<div class="mb-2 p-2 border rounded flex justify-between items-center">
            <div><b>${r.subject}</b><br>${r.text}</div>
            <button onclick="editReport('${r.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Редактировать</button>
        </div>`).join('') || '<div class="text-gray-500">Нет отчетов.</div>';
    // Мои неактивы
    document.getElementById('myInactives').innerHTML = db.inactives.filter(n => n.nickname === db.user.nickname)
        .map(n => `<div class="mb-2 p-2 border rounded flex justify-between items-center">
            <div>${n.start} — ${n.end}<br>${n.reason}</div>
            <button onclick="editInactive('${n.id}')" class="bg-yellow-500 text-white px-2 py-1 rounded">Редактировать</button>
        </div>`).join('') || '<div class="text-gray-500">Нет неактивов.</div>';
    // Все отчеты (для руководства)
    document.getElementById('allReports').innerHTML = ['Начальник ОРЛС','ГУ ГИБДД','Зам Начальника ОРЛС'].includes(db.user.role)
        ? db.reports.map(r => `<div class="mb-2 p-2 border rounded"><b>${r.nickname}</b>: ${r.subject}<br>${r.text}</div>`).join('')
        : '';
    // Все неактивы (для руководства)
    document.getElementById('allInactives').innerHTML = ['Начальник ОРЛС','ГУ ГИБДД','Зам Начальника ОРЛС'].includes(db.user.role)
        ? db.inactives.map(n => `<div class="mb-2 p-2 border rounded"><b>${n.nickname}</b>: ${n.start} — ${n.end}<br>${n.reason}</div>`).join('')
        : '';
}

// ...existing code...

// --- CRUD: Добавление, редактирование, обработка форм ---

// Добавление сотрудника
document.getElementById('staffForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('staffForm', ['nickname', 'role', 'rank', 'position'])) return;
    const f = e.target;
    const staff = {
        id: Date.now().toString(),
        nickname: f.nickname.value,
        role: f.role.value,
        rank: f.rank.value,
        avatar: f.avatar.value,
        epaulet: f.epaulet.value,
        warnings: parseInt(f.warnings.value)||0,
        position: f.position.value,
        personalFile: f.personalFile.value,
        report: f.report.value
    };
    db.staff.push(staff);
    saveDB();
    renderStaffTable();
    closeModal('addStaffModal');
    f.reset();
    showNotification('Сотрудник добавлен!', 'success');
};

// Редактирование сотрудника
function editStaff(id) {
    const s = db.staff.find(st => st.id === id);
    if (!s) return;
    const f = document.getElementById('editStaffForm');
    f.id.value = s.id;
    f.nickname.value = s.nickname;
    f.role.value = s.role;
    f.rank.value = s.rank;
    f.avatar.value = s.avatar;
    f.epaulet.value = s.epaulet;
    f.warnings.value = s.warnings;
    f.position.value = s.position;
    f.personalFile.value = s.personalFile;
    f.report.value = s.report;
    openModal('editStaffModal');
}
document.getElementById('editStaffForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editStaffForm', ['nickname', 'role', 'rank', 'position'])) return;
    const f = e.target;
    const s = db.staff.find(st => st.id === f.id.value);
    if (s) {
        s.nickname = f.nickname.value;
        s.role = f.role.value;
        s.rank = f.rank.value;
        s.avatar = f.avatar.value;
        s.epaulet = f.epaulet.value;
        s.warnings = parseInt(f.warnings.value)||0;
        s.position = f.position.value;
        s.personalFile = f.personalFile.value;
        s.report = f.report.value;
        saveDB();
        renderStaffTable();
        closeModal('editStaffModal');
        showNotification('Данные сотрудника обновлены', 'success');
    }
};

// Добавление аттестации
document.getElementById('attestForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('attestForm', ['nickname', 'acceptedBy', 'date'])) return;
    const f = e.target;
    db.certAttest.push({
        id: Date.now().toString(),
        nickname: f.nickname.value,
        acceptedBy: f.acceptedBy.value,
        date: f.date.value,
        attempt: f.attempt.value,
        result: f.result.value,
        proof: f.proof.value,
        createdBy: db.user.nickname
    });
    saveDB();
    renderCertTables();
    closeModal('addAttestModal');
    f.reset();
    showNotification('Аттестация добавлена!', 'success');
};

// Редактирование аттестации
function editAttest(id) {
    const a = db.certAttest.find(at => at.id === id);
    if (!a) return;
    const f = document.getElementById('editAttestForm');
    f.id.value = a.id;
    f.nickname.value = a.nickname;
    f.acceptedBy.value = a.acceptedBy;
    f.date.value = a.date;
    f.attempt.value = a.attempt;
    f.result.value = a.result;
    f.proof.value = a.proof;
    openModal('editAttestModal');
}
document.getElementById('editAttestForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editAttestForm', ['nickname', 'acceptedBy', 'date'])) return;
    const f = e.target;
    const a = db.certAttest.find(at => at.id === f.id.value);
    if (a && canEditAttest(a)) {
        a.nickname = f.nickname.value;
        a.acceptedBy = f.acceptedBy.value;
        a.date = f.date.value;
        a.attempt = f.attempt.value;
        a.result = f.result.value;
        a.proof = f.proof.value;
        saveDB();
        renderCertTables();
        closeModal('editAttestModal');
        showNotification('Аттестация обновлена', 'success');
    }
};

// Добавление переаттестации
document.getElementById('retestForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('retestForm', ['nickname', 'date'])) return;
    const f = e.target;
    db.certRetest.push({
        id: Date.now().toString(),
        nickname: f.nickname.value,
        date: f.date.value,
        violation: f.violation.value,
        proof: f.proof.value,
        attempt: f.attempt.value,
        acceptedBy: f.acceptedBy.value,
        final: f.final.value,
        createdBy: db.user.nickname
    });
    saveDB();
    renderCertTables();
    closeModal('addRetestModal');
    f.reset();
    showNotification('Переаттестация добавлена!', 'success');
};

// Редактирование переаттестации
function editRetest(id) {
    const r = db.certRetest.find(rt => rt.id === id);
    if (!r) return;
    const f = document.getElementById('editRetestForm');
    f.id.value = r.id;
    f.nickname.value = r.nickname;
    f.date.value = r.date;
    f.violation.value = r.violation;
    f.proof.value = r.proof;
    f.attempt.value = r.attempt;
    f.acceptedBy.value = r.acceptedBy;
    f.final.value = r.final;
    openModal('editRetestModal');
}
document.getElementById('editRetestForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editRetestForm', ['nickname', 'date'])) return;
    const f = e.target;
    const r = db.certRetest.find(rt => rt.id === f.id.value);
    if (r && canEditRetest(r)) {
        r.nickname = f.nickname.value;
        r.date = f.date.value;
        r.violation = f.violation.value;
        r.proof = f.proof.value;
        r.attempt = f.attempt.value;
        r.acceptedBy = f.acceptedBy.value;
        r.final = f.final.value;
        saveDB();
        renderCertTables();
        closeModal('editRetestModal');
        showNotification('Переаттестация обновлена', 'success');
    }
};

// Добавление блока информации
document.getElementById('infoForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('infoForm', ['title', 'content'])) return;
    const f = e.target;
    db.info.push({
        id: Date.now().toString(),
        title: f.title.value,
        content: f.content.value,
        createdBy: db.user.nickname
    });
    saveDB();
    renderInfo();
    closeModal('addInfoModal');
    f.reset();
    showNotification('Информационный блок добавлен!', 'success');
};

// Редактирование блока информации
function editInfo(id) {
    const info = db.info.find(i => i.id === id);
    if (!info) return;
    const f = document.getElementById('editInfoForm');
    f.id.value = info.id;
    f.title.value = info.title;
    f.content.value = info.content;
    openModal('editInfoModal');
}
document.getElementById('editInfoForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editInfoForm', ['title', 'content'])) return;
    const f = e.target;
    const info = db.info.find(i => i.id === f.id.value);
    if (info && (db.user.role === 'Начальник ОРЛС' || db.user.role === 'Зам Начальника ОРЛС')) {
        info.title = f.title.value;
        info.content = f.content.value;
        saveDB();
        renderInfo();
        closeModal('editInfoModal');
        showNotification('Информационный блок обновлен', 'success');
    }
};

// Добавление отчета
document.getElementById('reportForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('reportForm', ['subject', 'text'])) return;
    const f = e.target;
    db.reports.push({
        id: Date.now().toString(),
        nickname: db.user.nickname,
        subject: f.subject.value,
        text: f.text.value,
        createdBy: db.user.nickname
    });
    saveDB();
    renderReports();
    closeModal('addReportModal');
    f.reset();
    showNotification('Отчет добавлен!', 'success');
};

// Редактирование отчета
function editReport(id) {
    const r = db.reports.find(rep => rep.id === id);
    if (!r) return;
    const f = document.getElementById('editReportForm');
    f.id.value = r.id;
    f.subject.value = r.subject;
    f.text.value = r.text;
    openModal('editReportModal');
}
document.getElementById('editReportForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editReportForm', ['subject', 'text'])) return;
    const f = e.target;
    const r = db.reports.find(rep => rep.id === f.id.value);
    if (r && r.createdBy === db.user.nickname) {
        r.subject = f.subject.value;
        r.text = f.text.value;
        saveDB();
        renderReports();
        closeModal('editReportModal');
        showNotification('Отчет обновлен', 'success');
    }
};

// Добавление неактива
document.getElementById('inactiveForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('inactiveForm', ['start', 'end', 'reason'])) return;
    const f = e.target;
    db.inactives.push({
        id: Date.now().toString(),
        nickname: db.user.nickname,
        start: f.start.value,
        end: f.end.value,
        reason: f.reason.value,
        createdBy: db.user.nickname
    });
    saveDB();
    renderReports();
    closeModal('addInactiveModal');
    f.reset();
    showNotification('Неактив добавлен!', 'success');
};

// Редактирование неактива
function editInactive(id) {
    const n = db.inactives.find(ina => ina.id === id);
    if (!n) return;
    const f = document.getElementById('editInactiveForm');
    f.id.value = n.id;
    f.start.value = n.start;
    f.end.value = n.end;
    f.reason.value = n.reason;
    openModal('editInactiveModal');
}
document.getElementById('editInactiveForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editInactiveForm', ['start', 'end', 'reason'])) return;
    const f = e.target;
    const n = db.inactives.find(ina => ina.id === f.id.value);
    if (n && n.createdBy === db.user.nickname) {
        n.start = f.start.value;
        n.end = f.end.value;
        n.reason = f.reason.value;
        saveDB();
        renderReports();
        closeModal('editInactiveModal');
        showNotification('Неактив обновлен', 'success');
    }
};

// Добавление строя
document.getElementById('addParadeForm') && (document.getElementById('addParadeForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('addParadeForm', ['department', 'paradeTime', 'paradeText'])) return;
    const f = e.target;
    db.parades.push({
        id: Date.now().toString(),
        department: f.department.value,
        paradeTime: f.paradeTime.value,
        paradeText: f.paradeText.value,
        createdBy: db.user.nickname
    });
    saveDB();
    renderParades();
    renderDashboard();
    closeModal('addParadeModal');
    f.reset();
    showNotification('Строй добавлен!', 'success');
});

// Редактирование строя
function editParade(id) {
    const p = db.parades.find(pa => pa.id === id);
    if (!p) return;
    const f = document.getElementById('editParadeForm');
    f.id.value = p.id;
    f.department.value = p.department;
    f.paradeTime.value = p.paradeTime;
    f.paradeText.value = p.paradeText;
    openModal('editParadeModal');
}
document.getElementById('editParadeForm') && (document.getElementById('editParadeForm').onsubmit = function(e) {
    e.preventDefault();
    if (!validateForm('editParadeForm', ['department', 'paradeTime', 'paradeText'])) return;
    const f = e.target;
    const p = db.parades.find(pa => pa.id === f.id.value);
    if (p && p.createdBy === db.user.nickname) {
        p.department = f.department.value;
        p.paradeTime = f.paradeTime.value;
        p.paradeText = f.paradeText.value;
        saveDB();
        renderParades();
        renderDashboard();
        closeModal('editParadeModal');
        showNotification('Строй обновлен', 'success');
    }
});



// --- Главная страница (отображение строев) ---
function renderDashboard() {
    document.getElementById('paradeList').innerHTML = db.parades.length
        ? db.parades.map(p => `<div class="mb-2 p-2 border rounded"><b>${p.department}</b> — ${p.paradeTime}<br>${p.paradeText}</div>`).join('')
        : '<div class="text-gray-500">Нет предстоящих строев.</div>';
}

// --- Инициализация ---
window.onload = function() {
    populateRoleSelects();
    adaptMobile();
    renderStaffTable();
    renderCertTables();
    renderParades();
    renderReports();
    renderInfo();
    showCertTab('attest');
    showTab('dashboard');
    autoClearParades();
};


// --- Остальные функции (renderStaffTable, renderCertTables, renderParades, renderReports, renderInfo, CRUD-операции) ---
// Их реализация аналогична тому, что было в предыдущих ответах.
// Для компактности вынесите их в отдельные файлы или добавьте сюда по
