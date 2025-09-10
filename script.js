// Глобальная переменная для имитации базы данных
let fakeDatabase = {
    accounts: [
        { id: 1, nickname: 'Admin', auth_code: '123456', special_code: 'admin123', role: 'ГУ ГИБДД', last_active: new Date() },
        { id: 2, nickname: 'ORLS_boss', auth_code: '111111', special_code: 'orls_boss', role: 'Начальник ОРЛС', last_active: new Date() },
        { id: 3, nickname: 'Staff_member', auth_code: '222222', special_code: 'member_special', role: 'Сотрудник', last_active: new Date() }
    ],
    tests: [],
    testPassword: '5sJp@L8x',
    assignedTests: [],
    certificationResults: [],
    parades: [],
    candidates: [],
    reports: [],
    lastId: 3
};

// Функция для сохранения данных в localStorage
function saveData() {
    localStorage.setItem('fakeDatabase', JSON.stringify(fakeDatabase));
}

// Функция для загрузки данных из localStorage
function loadData() {
    const data = localStorage.getItem('fakeDatabase');
    if (data) {
        fakeDatabase = JSON.parse(data);
    }
}

// Функции-обработчики для форм
function handleLogin(event) {
    event.preventDefault();
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const account = fakeDatabase.accounts.find(
        acc => acc.nickname === login && acc.auth_code === password
    );

    if (account) {
        // Устанавливаем текущего пользователя и перенаправляем на панель
        localStorage.setItem('currentUser', JSON.stringify(account));
        window.location.href = 'panel.html';
    } else {
        alert('Неверный логин или пароль');
    }
}

function handleSpecialCode(event) {
    event.preventDefault();
    const specialCode = document.getElementById('specialCodeInput').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser && currentUser.special_code === specialCode) {
        // Успешная авторизация, можно отображать панель
        document.querySelector('.sidebar').style.display = 'flex';
        document.querySelector('.main-content').style.display = 'block';
        document.getElementById('specialCodeModal').style.display = 'none';
        setupPermissions(currentUser.role);
        showTab('dashboard');
    } else {
        alert('Неверный специальный код');
    }
}

function handleAddAccount(event) {
    event.preventDefault();
    const form = event.target;
    const newId = ++fakeDatabase.lastId;
    const newAccount = {
        id: newId,
        nickname: form.nickname.value,
        role: form.role.value,
        auth_code: form.auth_code.value,
        special_code: form.special_code.value,
        last_active: new Date()
    };
    fakeDatabase.accounts.push(newAccount);
    saveData();
    closeModal('addAccountModal');
    loadAccounts();
    alert('Аккаунт успешно добавлен!');
}

function handleEditAccount(event) {
    event.preventDefault();
    const form = event.target;
    const accountId = parseInt(document.getElementById('editAccountId').value);
    const account = fakeDatabase.accounts.find(acc => acc.id === accountId);
    if (account) {
        account.nickname = form.nickname.value;
        account.role = form.role.value;
        account.auth_code = form.auth_code.value;
        account.special_code = form.special_code.value;
        saveData();
        closeModal('editAccountModal');
        loadAccounts();
        alert('Изменения сохранены!');
    }
}

function handleAssignTest(event) {
    event.preventDefault();
    const form = event.target;
    const accountId = parseInt(document.getElementById('assignTestAccountId').value);
    const testId = parseInt(form.assignTestSelect.value);
    const timeLimit = parseInt(form.testTimeInput.value);

    fakeDatabase.assignedTests.push({
        accountId,
        testId,
        timeLimit,
        isCompleted: false
    });
    saveData();
    closeModal('assignTestModal');
    alert('Аттестация успешно назначена!');
}

function handleAddTest(event) {
    event.preventDefault();
    const form = event.target;
    const newId = ++fakeDatabase.lastId;
    const newTest = {
        id: newId,
        name: form.testName.value,
        description: form.description.value,
        questions: []
    };
    fakeDatabase.tests.push(newTest);
    saveData();
    closeModal('addTestModal');
    loadTests();
    alert('Новый тест успешно добавлен!');
}

function handleEditTest(testId) {
    currentEditingTestId = testId;
    const test = fakeDatabase.tests.find(t => t.id === testId);
    if (test) {
        document.getElementById('editTestName').textContent = test.name;
        const container = document.getElementById('questionsContainer');
        container.innerHTML = '';
        test.questions.forEach((q, index) => {
            const div = document.createElement('div');
            div.className = 'question-item';
            div.dataset.id = q.id;
            div.innerHTML = `
                <div class="mb-2">
                    <label class="block text-gray-700">Вопрос:</label>
                    <input type="text" data-field="text" value="${q.text}" class="shadow border rounded w-full py-2 px-3">
                </div>
                <div class="mb-2">
                    <label class="block text-gray-700">Варианты ответов (через запятую):</label>
                    <input type="text" data-field="options" value="${q.options.join(', ')}" class="shadow border rounded w-full py-2 px-3">
                </div>
                <div class="mb-2">
                    <label class="block text-gray-700">Правильный ответ:</label>
                    <input type="text" data-field="answer" value="${q.answer}" class="shadow border rounded w-full py-2 px-3">
                </div>
                <button type="button" onclick="deleteQuestion(${q.id})" class="bg-red-500 text-white py-1 px-2 rounded text-sm">Удалить вопрос</button>
            `;
            container.appendChild(div);
        });
        openModal('editTestModal');
    }
}

function handleAddParade(event) {
    event.preventDefault();
    const form = event.target;
    const newId = ++fakeDatabase.lastId;
    const newParade = {
        id: newId,
        department: form.department.value,
        paradeTime: form.paradeTime.value,
        paradeText: form.paradeText.value
    };
    fakeDatabase.parades.push(newParade);
    saveData();
    closeModal('addParadeModal');
    loadParades();
    alert('Строй успешно запланирован!');
}

function handleReport(event) {
    event.preventDefault();
    const form = event.target;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const newId = ++fakeDatabase.lastId;
    const newReport = {
        id: newId,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        role: currentUser.role,
        type: 'report',
        subject: form.reportSubject.value,
        text: form.reportText.value,
        date: new Date().toISOString()
    };
    fakeDatabase.reports.push(newReport);
    saveData();
    closeModal('reportModal');
    loadMyReports();
    alert('Заявление успешно отправлено!');
}

function handleInactive(event) {
    event.preventDefault();
    const form = event.target;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const newId = ++fakeDatabase.lastId;
    const newInactive = {
        id: newId,
        userId: currentUser.id,
        nickname: currentUser.nickname,
        role: currentUser.role,
        type: 'inactive',
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        reason: form.reason.value,
        date: new Date().toISOString()
    };
    fakeDatabase.reports.push(newInactive);
    saveData();
    closeModal('inactiveModal');
    loadMyReports();
    alert('Неактив успешно отправлен!');
}

// Универсальная функция для открытия модальных окон
function openModal(id, ...args) {
    document.getElementById(id).classList.add('active');
    if (id === 'editAccountModal') {
        const accountId = args[0];
        const account = fakeDatabase.accounts.find(acc => acc.id === accountId);
        if (account) {
            document.getElementById('editAccountId').value = account.id;
            document.getElementById('editAccountNickname').value = account.nickname;
            document.getElementById('editAccountRole').value = account.role;
            document.getElementById('editAccountCode').value = account.auth_code;
            document.getElementById('editSpecialCode').value = account.special_code;
            document.getElementById('assignTestAccountId').value = account.id;
        }
    } else if (id === 'assignTestModal') {
        const testSelect = document.getElementById('assignTestSelect');
        testSelect.innerHTML = fakeDatabase.tests.map(test => `<option value="${test.id}">${test.name}</option>`).join('');
    } else if (id === 'reportModal') {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        document.getElementById('reportUserRole').value = currentUser.role;
    }
}

// Универсальная функция для закрытия модальных окон
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Функция для переключения вкладок
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Загрузка данных для активной вкладки
    switch (tabId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'manage-staff':
            loadAccounts();
            break;
        case 'manage-certifications':
            loadTests();
            break;
        case 'manage-parades':
            loadParades();
            break;
        case 'manage-candidates':
            loadCandidates();
            break;
        case 'certification-results':
            loadCertificationResults();
            break;
        case 'reports':
            loadMyReports();
            break;
        case 'orls-reports':
            loadAllReports();
            break;
        case 'weekly-reports':
            loadWeeklyReports();
            break;
        case 'certification':
            loadTraineeTests();
            break;
    }
}

// Функции загрузки данных
function loadContent() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    document.querySelector('.sidebar').style.display = 'flex';
    document.querySelector('.main-content').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.nickname;
    document.getElementById('userRole').textContent = currentUser.role;
    setupPermissions(currentUser.role);
    showTab('dashboard');
}

function loadDashboard() {
    const totalAccounts = fakeDatabase.accounts.length;
    const totalTests = fakeDatabase.tests.length;
    const completedCertifications = fakeDatabase.certificationResults.length;
    document.getElementById('totalAccounts').textContent = totalAccounts;
    document.getElementById('totalTests').textContent = totalTests;
    document.getElementById('completedCertifications').textContent = completedCertifications;
    renderUpcomingParades(fakeDatabase.parades);
}

function loadAccounts() {
    const tableBody = document.getElementById('accountsTableBody');
    tableBody.innerHTML = '';
    const positionFilter = document.getElementById('position-filter');
    const roles = [...new Set(fakeDatabase.accounts.map(acc => acc.role))];
    positionFilter.innerHTML = '<option value="all">Все должности</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        positionFilter.appendChild(option);
    });
    fakeDatabase.accounts.forEach(account => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-4 border-b">${account.id}</td>
            <td class="py-2 px-4 border-b">${account.nickname}</td>
            <td class="py-2 px-4 border-b"><img src="${getRoleImage(account.role)}" alt="${account.role}" class="rank-image"></td>
            <td class="py-2 px-4 border-b">${new Date(account.last_active).toLocaleString()}</td>
            <td class="py-2 px-4 border-b">
                <button onclick="openModal('editAccountModal', ${account.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">Редактировать</button>
            </td>`;
        tableBody.appendChild(tr);
    });
}

function loadTests() {
    const list = document.getElementById('testsList');
    list.innerHTML = '';
    if (fakeDatabase.tests.length === 0) {
        list.innerHTML = '<p class="text-gray-500">Тестов пока нет.</p>';
        return;
    }
    fakeDatabase.tests.forEach(test => {
        const li = document.createElement('li');
        li.className = 'py-4 flex justify-between items-center';
        li.innerHTML = `
            <div>
                <p class="text-lg font-bold">${test.name}</p>
                <p class="text-sm text-gray-600">${test.description}</p>
            </div>
            <div>
                <button onclick="handleEditTest(${test.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2">Редактировать</button>
                <button onclick="deleteTest(${test.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Удалить</button>
            </div>`;
        list.appendChild(li);
    });
}

function loadParades() {
    const list = document.getElementById('paradesList');
    list.innerHTML = '';
    if (fakeDatabase.parades.length === 0) {
        list.innerHTML = '<p class="text-gray-500">Запланированных строев нет.</p>';
        return;
    }
    fakeDatabase.parades.forEach(parade => {
        const li = document.createElement('li');
        li.className = 'py-4 flex justify-between items-center';
        li.innerHTML = `
            <div>
                <p class="text-lg font-bold">Подразделение: ${parade.department}</p>
                <p class="text-sm text-gray-600">Время: ${parade.paradeTime}</p>
                <p class="text-sm text-gray-600">Текст: ${parade.paradeText}</p>
            </div>
            <div>
                <button onclick="deleteParade(${parade.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Удалить</button>
            </div>`;
        list.appendChild(li);
    });
}

function loadCandidates() {
    const list = document.getElementById('candidatesList');
    list.innerHTML = '';
    if (fakeDatabase.candidates.length === 0) {
        list.innerHTML = '<p class="text-gray-500">Нет кандидатов в начальники.</p>';
        return;
    }
    fakeDatabase.candidates.forEach(candidate => {
        const li = document.createElement('li');
        li.className = 'py-4 flex justify-between items-center';
        li.innerHTML = `
            <div>
                <p class="text-lg font-bold">${candidate.nickname}</p>
                <p class="text-sm text-gray-600">ID: ${candidate.id}</p>
            </div>
            <div>
                <button onclick="approveCandidate(${candidate.id})" class="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2">Одобрить</button>
                <button onclick="rejectCandidate(${candidate.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Отклонить</button>
            </div>`;
        list.appendChild(li);
    });
}

function loadCertificationResults() {
    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = '';
    if (fakeDatabase.certificationResults.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-500">Нет результатов аттестаций.</td></tr>`;
        return;
    }
    fakeDatabase.certificationResults.forEach(result => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-4 border-b">${result.nickname}</td>
            <td class="py-2 px-4 border-b">${result.testName}</td>
            <td class="py-2 px-4 border-b">${new Date(result.date).toLocaleString()}</td>
            <td class="py-2 px-4 border-b">${result.result}</td>
            <td class="py-2 px-4 border-b">
                <button onclick="showDetailedResults(${result.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">Показать</button>
            </td>`;
        tableBody.appendChild(tr);
    });
}

function loadMyReports() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const userReports = fakeDatabase.reports.filter(r => r.userId === currentUser.id);

    const reportsList = document.getElementById('myReportsList');
    reportsList.innerHTML = '';
    const myReports = userReports.filter(r => r.type === 'report');
    if (myReports.length === 0) {
        reportsList.innerHTML = '<p class="text-gray-500">Вы пока не подавали заявлений.</p>';
    } else {
        myReports.forEach(report => {
            const li = document.createElement('li');
            li.className = 'py-4';
            li.innerHTML = `<p class="text-lg font-bold">${report.subject}</p><p class="text-sm text-gray-600">${report.text}</p><p class="text-xs text-gray-400">Отправлено: ${new Date(report.date).toLocaleString()}</p>`;
            reportsList.appendChild(li);
        });
    }

    const inactivesList = document.getElementById('myInactivesList');
    inactivesList.innerHTML = '';
    const myInactives = userReports.filter(r => r.type === 'inactive');
    if (myInactives.length === 0) {
        inactivesList.innerHTML = '<p class="text-gray-500">Вы пока не оставляли неактивов.</p>';
    } else {
        myInactives.forEach(inactive => {
            const li = document.createElement('li');
            li.className = 'py-4';
            li.innerHTML = `<p class="text-lg font-bold">Неактив: ${inactive.startDate} по ${inactive.endDate}</p><p class="text-sm text-gray-600">Причина: ${inactive.reason}</p><p class="text-xs text-gray-400">Отправлено: ${new Date(inactive.date).toLocaleString()}</p>`;
            inactivesList.appendChild(li);
        });
    }
}

function loadAllReports() {
    const reportsList = document.getElementById('allReportsList');
    reportsList.innerHTML = '';
    const allReports = fakeDatabase.reports.filter(r => r.type === 'report');
    if (allReports.length === 0) {
        reportsList.innerHTML = '<p class="text-gray-500">Заявлений пока нет.</p>';
    } else {
        allReports.forEach(report => {
            const li = document.createElement('li');
            li.className = 'py-4';
            li.innerHTML = `<p class="text-lg font-bold">${report.subject} от ${report.nickname}</p><p class="text-sm text-gray-600">${report.text}</p><p class="text-xs text-gray-400">Отправлено: ${new Date(report.date).toLocaleString()}</p>`;
            reportsList.appendChild(li);
        });
    }

    const inactivesList = document.getElementById('allInactivesList');
    inactivesList.innerHTML = '';
    const allInactives = fakeDatabase.reports.filter(r => r.type === 'inactive');
    if (allInactives.length === 0) {
        inactivesList.innerHTML = '<p class="text-gray-500">Неактивов пока нет.</p>';
    } else {
        allInactives.forEach(inactive => {
            const li = document.createElement('li');
            li.className = 'py-4';
            li.innerHTML = `<p class="text-lg font-bold">Неактив: ${inactive.startDate} по ${inactive.endDate} от ${inactive.nickname}</p><p class="text-sm text-gray-600">Причина: ${inactive.reason}</p><p class="text-xs text-gray-400">Отправлено: ${new Date(inactive.date).toLocaleString()}</p>`;
            inactivesList.appendChild(li);
        });
    }
}

function loadTraineeTests() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const traineeTests = fakeDatabase.assignedTests.filter(t => t.accountId === currentUser.id && !t.isCompleted);
    const list = document.getElementById('traineeTestsList');
    list.innerHTML = '';
    if (traineeTests.length === 0) {
        list.innerHTML = '<p class="text-gray-500">Вам не назначено ни одной аттестации.</p>';
        return;
    }
    traineeTests.forEach(assignedTest => {
        const test = fakeDatabase.tests.find(t => t.id === assignedTest.testId);
        if (test) {
            const li = document.createElement('li');
            li.className = 'py-4 flex justify-between items-center';
            li.innerHTML = `
                <div>
                    <p class="text-lg font-bold">${test.name}</p>
                    <p class="text-sm text-gray-600">Время на прохождение: ${assignedTest.timeLimit} минут</p>
                </div>
                <div>
                    <button onclick="startTest(${assignedTest.id})" class="bg-green-500 text-white px-3 py-1 rounded text-sm">Начать</button>
                </div>`;
            list.appendChild(li);
        }
    });
}

function loadWeeklyReports() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyCertifications = fakeDatabase.certificationResults.filter(r => new Date(r.date) > oneWeekAgo).length;
    const weeklyReports = fakeDatabase.reports.filter(r => r.type === 'report' && new Date(r.date) > oneWeekAgo).length;
    const weeklyInactives = fakeDatabase.reports.filter(r => r.type === 'inactive' && new Date(r.date) > oneWeekAgo).length;
    const weeklyActivities = fakeDatabase.reports.filter(r => new Date(r.date) > oneWeekAgo);

    document.getElementById('weeklyCertifications').textContent = weeklyCertifications;
    document.getElementById('weeklyReports').textContent = weeklyReports;
    document.getElementById('weeklyInactives').textContent = weeklyInactives;

    renderWeeklyActivityList(weeklyActivities);
}

// Функции-утилиты и рендеринг
function setupPermissions(role) {
    const adminItems = ['manageStaffLink', 'manageCertificationsLink', 'manageParadesLink', 'manageCandidatesLink', 'orlsReportsLink', 'fullResetLink', 'weeklyReportsLink'];
    document.querySelectorAll('.sidebar li').forEach(li => li.style.display = 'none');
    document.querySelector('.sidebar a[onclick="logout()"]').parentElement.style.display = 'block';
    document.querySelector('.sidebar a[onclick="showTab(\'dashboard\')"]').parentElement.style.display = 'block';
    document.querySelector('.sidebar a[onclick="showTab(\'reports\')"]').parentElement.style.display = 'block';

    if (role === 'Начальник ОРЛС' || role === 'ГУ ГИБДД') {
        adminItems.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'block';
        });
    }

    if (role === 'Сотрудник') {
        document.getElementById('certificationLink').style.display = 'block';
        document.getElementById('certificationResultsLink').style.display = 'block';
    }
}

function renderUpcomingParades(parades) {
    const list = document.getElementById('upcomingParadesList');
    list.innerHTML = '';
    const now = new Date();
    const upcoming = parades.filter(p => {
        const [hours, minutes] = p.paradeTime.split(':').map(Number);
        const paradeDate = new Date();
        paradeDate.setHours(hours, minutes, 0, 0);
        return paradeDate > now;
    }).sort((a, b) => {
        const [aHours, aMinutes] = a.paradeTime.split(':').map(Number);
        const [bHours, bMinutes] = b.paradeTime.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });

    if (upcoming.length === 0) {
        list.innerHTML = '<p class="text-gray-500">Предстоящих строев нет.</p>';
        return;
    }

    upcoming.forEach(parade => {
        const li = document.createElement('li');
        li.className = 'py-3';
        li.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm font-medium text-gray-900">${parade.department}</p>
                    <p class="text-sm text-gray-500">Время: ${parade.paradeTime}</p>
                    <p class="text-sm text-gray-500">Текст: ${parade.paradeText}</p>
                </div>
            </div>`;
        list.appendChild(li);
    });
}

function renderWeeklyActivityList(activities) {
    const list = document.getElementById('weeklyActivityList');
    list.innerHTML = '';
    if (activities.length === 0) {
        list.innerHTML = '<p class="text-gray-500">За последнюю неделю не было отчетов или неактивов.</p>';
        return;
    }
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'py-4';
        let activityDetails = '';
        if (activity.type === 'report') {
            activityDetails = `подал(-а) отчет "<strong>${activity.subject}</strong>"`;
        } else if (activity.type === 'inactive') {
            activityDetails = `оставил(-а) неактив`;
        }
        li.innerHTML = `<p class="text-lg font-bold">${activity.nickname}</p><p class="text-sm text-gray-600">${activityDetails} от ${new Date(activity.date).toLocaleDateString()}</p>`;
        list.appendChild(li);
    });
}

// Новая функция для получения пути к изображению погона по роли
function getRoleImage(role) {
    switch (role) {
        case 'ГУ ГИБДД':
            return 'images/gu_gibdd_rank.png';
        case 'Начальник ОРЛС':
            return 'images/orls_boss_rank.png';
        case 'Сотрудник':
            return 'images/staff_rank.png';
        default:
            return ''; // Возвращает пустую строку, если роль не найдена
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const loginForm = document.getElementById('loginForm');
    const specialCodeForm = document.getElementById('specialCodeForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (specialCodeForm) {
        specialCodeForm.addEventListener('submit', handleSpecialCode);
    }
    const addAccountForm = document.getElementById('addAccountForm');
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', handleAddAccount);
    }
    const editAccountForm = document.getElementById('editAccountForm');
    if (editAccountForm) {
        editAccountForm.addEventListener('submit', handleEditAccount);
    }
    const assignTestForm = document.getElementById('assignTestForm');
    if (assignTestForm) {
        assignTestForm.addEventListener('submit', handleAssignTest);
    }
    const addTestForm = document.getElementById('addTestForm');
    if (addTestForm) {
        addTestForm.addEventListener('submit', handleAddTest);
    }
    const addParadeForm = document.getElementById('addParadeForm');
    if (addParadeForm) {
        addParadeForm.addEventListener('submit', handleAddParade);
    }
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReport);
    }
    const inactiveForm = document.getElementById('inactiveForm');
    if (inactiveForm) {
        inactiveForm.addEventListener('submit', handleInactive);
    }
    // Проверка, находимся ли мы на панели
    if (document.body.id === 'panel-page') {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            // Если пользователь есть, проверяем его специальный код
            openModal('specialCodeModal');
        } else {
            // Если пользователя нет, перенаправляем на страницу входа
            window.location.href = 'index.html';
        }
    }
});
