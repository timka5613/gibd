// server.js - бэкенд для управления панелью ГИБДД
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const port = 3000;

// ----- Настройки и подключение к базе данных MongoDB -----
const mongoURI = 'mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Успешное подключение к MongoDB!'))
    .catch(err => console.error('Ошибка подключения к MongoDB:', err));

app.use(cors());
app.use(express.json());

// ----- Определение схем (Models) -----
const employeeSchema = new mongoose.Schema({
    nickname: { type: String, required: true, unique: true },
    rank: { type: String, required: true },
    warnings: { type: Number, default: 0 },
    position: String,
    role: String
});
const Employee = mongoose.model('Employee', employeeSchema);

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creatorNickname: { type: String, required: true },
    date: { type: Date, required: true },
    dateCreated: { type: Date, default: Date.now },
});
const Event = mongoose.model('Event', eventSchema);

const certificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['certification', 'recertification'], required: true },
    employeeNickname: { type: String, required: true },
    attesterNickname: String,
    date: { type: Date, required: true },
    attempt: Number,
    status: { type: String, enum: ['Сдал', 'Не сдал', 'Уволен', 'Ожидает'], required: true },
    evidenceLink: String,
    violation: String,
    conclusion: String,
    editorRole: String
});
const Certification = mongoose.model('Certification', certificationSchema);

const reportSchema = new mongoose.Schema({
    employeeNickname: { type: String, required: true },
    reportType: { type: String, enum: ['Неактив', 'Отпуск'], required: true },
    status: { type: String, default: 'Показан' }
});
const Report = mongoose.model('Report', reportSchema);

const infoBlockSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorRole: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now }
});
const InfoBlock = mongoose.model('InfoBlock', infoBlockSchema);

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [String],
    answer: { type: String, required: true }
});

const testSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [questionSchema]
});
const Test = mongoose.model('Test', testSchema);


// ----- Маршруты API (Endpoints) -----
// Сотрудники
app.post('/api/employees', async (req, res) => {
    try {
        const newEmployee = new Employee(req.body);
        await newEmployee.save();
        res.status(201).json(newEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Строи
app.post('/api/events', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Аттестации
app.post('/api/certifications', async (req, res) => {
    try {
        const newCert = new Certification(req.body);
        await newCert.save();
        res.status(201).json(newCert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
app.get('/api/certifications', async (req, res) => {
    try {
        const query = req.query.nickname ? { employeeNickname: req.query.nickname } : {};
        const certifications = await Certification.find(query);
        res.json(certifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Отчеты
app.post('/api/reports', async (req, res) => {
    try {
        const newReport = new Report(req.body);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await Report.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Информационные блоки
app.post('/api/infoblocks', async (req, res) => {
    try {
        const newInfoBlock = new InfoBlock(req.body);
        await newInfoBlock.save();
        res.status(201).json(newInfoBlock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
app.get('/api/infoblocks', async (req, res) => {
    try {
        const infoBlocks = await InfoBlock.find();
        res.json(infoBlocks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Тесты
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await Test.find();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/tests', async (req, res) => {
    try {
        const newTest = new Test(req.body);
        await newTest.save();
        res.status(201).json(newTest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/tests/:id', async (req, res) => {
    try {
        const updatedTest = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTest) return res.status(404).json({ message: 'Тест не найден' });
        res.json(updatedTest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/tests/:id', async (req, res) => {
    try {
        const deletedTest = await Test.findByIdAndDelete(req.params.id);
        if (!deletedTest) return res.status(404).json({ message: 'Тест не найден' });
        res.json({ message: 'Тест успешно удален' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ----- Планировщик задач (Cron Job) для автоматического удаления строев -----
cron.schedule('0 21 * * *', async () => {
    try {
        const now = new Date();
        const result = await Event.deleteMany({ date: { $lt: now } });
        console.log(`Удалено ${result.deletedCount} прошедших строев.`);
    } catch (err) {
        console.error('Ошибка при удалении старых строев:', err);
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
