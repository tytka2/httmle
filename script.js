// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let cleanPlacesData = [];
let dirtyPlacesData = [];
let userMarkers = [];
let map = null;
let markerGroup = null;
let currentMarkerType = 'clean';
let userMarkerCounter = 0;
let currentUser = null;
let notifications = [];

// Графики
let productionChart = null;
let cropsChart = null;
let ecologyChart = null;

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initScrollToTop();
    initSmoothScroll();
    loadData();
    initCharts();
    initForum();
    initPrices();
    initCalendar();
    initAchievements();
    initChatBot();
});

// ========== ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    }
    
    // Обновляем цвета графиков
    updateChartsTheme();
}

// ========== УВЕДОМЛЕНИЯ ==========
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const id = Date.now();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.id = `notification-${id}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';
    
    notification.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        const notif = document.getElementById(`notification-${id}`);
        if (notif) {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }
    }, 5000);
}

// ========== ПРОКРУТКА ==========
function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollTop');
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function initSmoothScroll() {
    document.querySelectorAll('nav a, .footer-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========== МОДАЛЬНЫЕ ОКНА ==========
function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('userDropdown').classList.remove('show');
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.add('show');
    document.getElementById('userDropdown').classList.remove('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function login(event) {
    event.preventDefault();
    showNotification('Вход выполнен успешно!', 'success');
    closeModal('loginModal');
}

function register(event) {
    event.preventDefault();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    if (password !== confirm) {
        showNotification('Пароли не совпадают!', 'error');
        return;
    }
    
    showNotification('Регистрация успешна!', 'success');
    closeModal('registerModal');
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadData() {
    try {
        // Загружаем чистые места
        const cleanResponse = await fetch('clean_places.json');
        cleanPlacesData = await cleanResponse.json();
        
        // Загружаем грязные места
        const dirtyResponse = await fetch('dirty_places.json');
        dirtyPlacesData = await dirtyResponse.json();
        
        // Загружаем конфигурацию
        const configResponse = await fetch('config.json');
        const config = await configResponse.json();
        
        // Загружаем сохраненные метки пользователей
        loadUserMarkers();
        
        // Инициализируем карту
        initMap();
        
        // Обновляем статистику
        updateStats();
        
        // Отображаем места
        displayPlaces();
        
        // Отображаем конфигурацию
        displayConfig(config);
        
        showNotification('Данные успешно загружены', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

function displayConfig(config) {
    const configInfo = document.getElementById('configInfo');
    if (configInfo) {
        configInfo.innerHTML = `
            <i class="fas fa-sync-alt"></i> Данные обновляются каждые ${config.refreshMinutes} минут |
            <i class="fas fa-city"></i> Город мониторинга: ${config.air.openAqCity}
        `;
    }
}

// ========== КАРТА ==========
function initMap() {
    // Создаем карту с центром в Брянской области
    map = L.map('ecologyMap').setView([52.9, 33.4], 8);
    
    // Добавляем тайлы OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Создаем группу для маркеров
    markerGroup = L.layerGroup().addTo(map);
    
    // Добавляем маркеры из JSON
    addMarkersFromData();
    
    // Добавляем обработчик клика для добавления новых меток
    map.on('click', function(e) {
        addNewMarker(e.latlng);
    });
}

// Добавление маркеров из загруженных данных
function addMarkersFromData() {
    markerGroup.clearLayers();
    
    // Чистые места (зеленые маркеры)
    cleanPlacesData.forEach(place => {
        const marker = L.marker([place.lat, place.lon], {
            icon: createCustomIcon('🌿', 'clean'),
            draggable: false
        }).addTo(markerGroup);
        
        marker.bindPopup(`
            <div class="custom-popup">
                <h4>${place.name}</h4>
                <p>🌿 Чистая зона</p>
                <p>${place.note}</p>
                <p>📍 ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
            </div>
        `);
    });
    
    // Грязные места (красные маркеры)
    dirtyPlacesData.forEach(place => {
        const marker = L.marker([place.lat, place.lon], {
            icon: createCustomIcon('⚠️', 'dirty'),
            draggable: false
        }).addTo(markerGroup);
        
        marker.bindPopup(`
            <div class="custom-popup">
                <h4>${place.name}</h4>
                <p>⚠️ Загрязненная зона</p>
                <p><strong>Степень:</strong> ${place.severity}</p>
                <p><strong>Загрязнители:</strong> ${place.pollutant}</p>
                <p>📍 ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
            </div>
        `);
    });
    
    // Пользовательские метки
    userMarkers.forEach(marker => {
        addUserMarkerToMap(marker);
    });
}

// Создание кастомной иконки
function createCustomIcon(emoji, type) {
    return L.divIcon({
        className: `custom-marker ${type}`,
        html: emoji,
        iconSize: [30, 30],
        popupAnchor: [0, -15]
    });
}

// Добавление новой метки
function addNewMarker(latlng) {
    const title = prompt('Введите название метки:', `Метка ${userMarkers.length + 1}`);
    if (title === null) return;
    
    const description = prompt('Введите описание:', '');
    
    const emoji = {
        'clean': '🌿',
        'dirty': '⚠️',
        'observation': '🔍',
        'problem': '🏭'
    }[currentMarkerType];
    
    const newMarker = {
        id: Date.now(),
        lat: latlng.lat,
        lng: latlng.lng,
        type: currentMarkerType,
        title: title,
        description: description || '',
        date: new Date().toLocaleString()
    };
    
    userMarkers.push(newMarker);
    addUserMarkerToMap(newMarker);
    saveUserMarkers();
    updateUserMarkersList();
    updateStats();
    showNotification('Метка добавлена', 'success');
}

// Добавление пользовательской метки на карту
function addUserMarkerToMap(marker) {
    const emoji = {
        'clean': '🌿',
        'dirty': '⚠️',
        'observation': '🔍',
        'problem': '🏭'
    }[marker.type];
    
    const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(emoji, marker.type),
        draggable: true
    }).addTo(markerGroup);
    
    leafletMarker.bindPopup(`
        <div class="custom-popup">
            <h4>${marker.title}</h4>
            <p>👤 Пользовательская метка</p>
            <p>Тип: ${getMarkerTypeName(marker.type)}</p>
            <p>${marker.description}</p>
            <p>📅 ${marker.date}</p>
            <p>📍 ${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</p>
            <button onclick="deleteUserMarker(${marker.id})" class="popup-btn">
                <i class="fas fa-trash"></i> Удалить
            </button>
        </div>
    `);
    
    leafletMarker.on('dragend', function(e) {
        const newPos = e.target.getLatLng();
        updateMarkerPosition(marker.id, newPos.lat, newPos.lng);
        showNotification('Метка перемещена', 'info');
    });
    
    marker.leafletId = leafletMarker._leaflet_id;
}

// Получение названия типа метки
function getMarkerTypeName(type) {
    const names = {
        'clean': 'Чистая зона',
        'dirty': 'Загрязненная зона',
        'observation': 'Наблюдение',
        'problem': 'Проблемная зона'
    };
    return names[type] || type;
}

// Обновление позиции метки
function updateMarkerPosition(id, lat, lng) {
    const marker = userMarkers.find(m => m.id === id);
    if (marker) {
        marker.lat = lat;
        marker.lng = lng;
        saveUserMarkers();
        updateUserMarkersList();
    }
}

// Удаление пользовательской метки
function deleteUserMarker(id) {
    if (confirm('Удалить эту метку?')) {
        userMarkers = userMarkers.filter(m => m.id !== id);
        
        // Перезагружаем все маркеры на карте
        markerGroup.clearLayers();
        addMarkersFromData();
        
        saveUserMarkers();
        updateUserMarkersList();
        updateStats();
        showNotification('Метка удалена', 'success');
    }
}

// ========== СОХРАНЕНИЕ МЕТОК ==========
function loadUserMarkers() {
    const saved = localStorage.getItem('userMarkers');
    if (saved) {
        try {
            userMarkers = JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка загрузки меток:', e);
        }
    }
}

function saveUserMarkers() {
    localStorage.setItem('userMarkers', JSON.stringify(userMarkers));
}

// ========== УПРАВЛЕНИЕ ТИПАМИ МЕТОК ==========
function setMarkerType(type) {
    currentMarkerType = type;
    
    document.querySelectorAll('.marker-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
}

// ========== ФИЛЬТРАЦИЯ ==========
function filterMarkers(type) {
    // Обновляем активную кнопку
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Очищаем все маркеры
    markerGroup.clearLayers();
    
    // Добавляем маркеры в зависимости от типа фильтра
    if (type === 'all' || type === 'clean') {
        cleanPlacesData.forEach(place => {
            L.marker([place.lat, place.lon], {
                icon: createCustomIcon('🌿', 'clean')
            }).addTo(markerGroup).bindPopup(`
                <div class="custom-popup">
                    <h4>${place.name}</h4>
                    <p>🌿 Чистая зона</p>
                    <p>${place.note}</p>
                </div>
            `);
        });
    }
    
    if (type === 'all' || type === 'dirty') {
        dirtyPlacesData.forEach(place => {
            L.marker([place.lat, place.lon], {
                icon: createCustomIcon('⚠️', 'dirty')
            }).addTo(markerGroup).bindPopup(`
                <div class="custom-popup">
                    <h4>${place.name}</h4>
                    <p>⚠️ Загрязненная зона</p>
                    <p>Степень: ${place.severity}</p>
                    <p>Загрязнители: ${place.pollutant}</p>
                </div>
            `);
        });
    }
    
    if (type === 'all' || type === 'user') {
        userMarkers.forEach(marker => {
            const emoji = {
                'clean': '🌿',
                'dirty': '⚠️',
                'observation': '🔍',
                'problem': '🏭'
            }[marker.type];
            
            L.marker([marker.lat, marker.lng], {
                icon: createCustomIcon(emoji, marker.type)
            }).addTo(markerGroup).bindPopup(`
                <div class="custom-popup">
                    <h4>${marker.title}</h4>
                    <p>👤 Пользовательская метка</p>
                    <p>${marker.description}</p>
                    <p>${marker.date}</p>
                </div>
            `);
        });
    }
    
    // Показываем/скрываем соответствующие секции
    document.getElementById('cleanPlacesSection').style.display = 
        (type === 'all' || type === 'clean') ? 'block' : 'none';
    document.getElementById('dirtyPlacesSection').style.display = 
        (type === 'all' || type === 'dirty') ? 'block' : 'none';
    document.getElementById('userPlacesSection').style.display = 
        (type === 'all' || type === 'user') ? 'block' : 'none';
}

// ========== СТАТИСТИКА ==========
function updateStats() {
    const statsContainer = document.getElementById('ecologyStats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <h4>Чистые зоны</h4>
            <div class="stat-number">${cleanPlacesData.length}</div>
        </div>
        <div class="stat-card">
            <h4>Зоны риска</h4>
            <div class="stat-number">${dirtyPlacesData.length}</div>
        </div>
        <div class="stat-card">
            <h4>Мои метки</h4>
            <div class="stat-number">${userMarkers.length}</div>
        </div>
        <div class="stat-card">
            <h4>Всего объектов</h4>
            <div class="stat-number">${cleanPlacesData.length + dirtyPlacesData.length + userMarkers.length}</div>
        </div>
    `;
    
    // Обновляем счетчики в заголовках
    document.getElementById('cleanCount').textContent = cleanPlacesData.length;
    document.getElementById('dirtyCount').textContent = dirtyPlacesData.length;
    document.getElementById('userCount').textContent = userMarkers.length;
}

// ========== ОТОБРАЖЕНИЕ МЕСТ ==========
function displayPlaces() {
    // Чистые места
    const cleanGrid = document.getElementById('cleanPlacesGrid');
    if (cleanGrid) {
        cleanGrid.innerHTML = cleanPlacesData.map(place => `
            <div class="place-card clean">
                <div class="place-badge clean">Чистая зона</div>
                <h4>${place.name}</h4>
                <p><i class="fas fa-map-pin"></i> ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
                <p><i class="fas fa-info-circle"></i> ${place.note}</p>
                <button class="view-on-map" onclick="flyToLocation(${place.lat}, ${place.lon})">
                    <i class="fas fa-eye"></i> Показать на карте
                </button>
            </div>
        `).join('');
    }
    
    // Грязные места
    const dirtyGrid = document.getElementById('dirtyPlacesGrid');
    if (dirtyGrid) {
        dirtyGrid.innerHTML = dirtyPlacesData.map(place => `
            <div class="place-card dirty">
                <div class="place-badge dirty">Зона риска</div>
                <h4>${place.name}</h4>
                <p><i class="fas fa-map-pin"></i> ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
                <p><i class="fas fa-exclamation-triangle"></i> Степень: ${place.severity}</p>
                <p><i class="fas fa-flask"></i> ${place.pollutant}</p>
                <button class="view-on-map" onclick="flyToLocation(${place.lat}, ${place.lon})">
                    <i class="fas fa-eye"></i> Показать на карте
                </button>
            </div>
        `).join('');
    }
    
    // Пользовательские метки
    updateUserMarkersList();
}

function flyToLocation(lat, lng) {
    map.flyTo([lat, lng], 12);
}

// Обновление списка пользовательских меток
function updateUserMarkersList() {
    const userGrid = document.getElementById('userPlacesGrid');
    if (!userGrid) return;
    
    if (userMarkers.length === 0) {
        userGrid.innerHTML = '<p class="no-markers">Нет пользовательских меток</p>';
        return;
    }
    
    userGrid.innerHTML = userMarkers.map(marker => `
        <div class="place-card ${marker.type}">
            <div class="place-badge" style="background: var(--primary-color)">Моя метка</div>
            <h4>${marker.title}</h4>
            <p><i class="fas fa-tag"></i> ${getMarkerTypeName(marker.type)}</p>
            <p><i class="fas fa-map-pin"></i> ${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</p>
            <p><i class="fas fa-align-left"></i> ${marker.description}</p>
            <p><i class="fas fa-calendar"></i> ${marker.date}</p>
            <div style="display: flex; gap: 10px;">
                <button class="view-on-map" onclick="flyToLocation(${marker.lat}, ${marker.lng})" style="flex: 1;">
                    <i class="fas fa-eye"></i> Показать
                </button>
                <button onclick="deleteUserMarker(${marker.id})" class="delete-btn" style="flex: 1;">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// ========== ЭКСПОРТ/ИМПОРТ МЕТОК ==========
function exportMarkers() {
    const dataStr = JSON.stringify(userMarkers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `markers_export_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Метки экспортированы', 'success');
}

function importMarkers() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    userMarkers = [...userMarkers, ...imported];
                    saveUserMarkers();
                    
                    // Обновляем карту
                    markerGroup.clearLayers();
                    addMarkersFromData();
                    
                    updateUserMarkersList();
                    updateStats();
                    
                    showNotification(`Импортировано ${imported.length} меток`, 'success');
                }
            } catch (error) {
                showNotification('Ошибка при импорте файла', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllMarkers() {
    if (confirm('Удалить все пользовательские метки?')) {
        userMarkers = [];
        saveUserMarkers();
        
        markerGroup.clearLayers();
        addMarkersFromData();
        
        updateUserMarkersList();
        updateStats();
        
        showNotification('Все метки удалены', 'success');
    }
}

// ========== ГРАФИКИ ==========
function initCharts() {
    initProductionChart();
    initCropsChart();
    initEcologyChart();
}

function initProductionChart() {
    const ctx = document.getElementById('productionChart');
    if (!ctx) return;
    
    productionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
            datasets: [{
                label: 'Зерновые (тыс. т)',
                data: [450, 480, 510, 550, 590, 630],
                borderColor: '#6b8e23',
                backgroundColor: 'rgba(107, 142, 35, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Картофель (тыс. т)',
                data: [320, 340, 360, 390, 420, 450],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: getChartOptions()
    });
}

function initCropsChart() {
    const ctx = document.getElementById('cropsChart');
    if (!ctx) return;
    
    cropsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Зерновые', 'Картофель', 'Овощи', 'Кормовые', 'Технические'],
            datasets: [{
                data: [45, 25, 15, 10, 5],
                backgroundColor: [
                    '#6b8e23',
                    '#2196F3',
                    '#ff9800',
                    '#9c27b0',
                    '#f44336'
                ]
            }]
        },
        options: getChartOptions()
    });
}

function initEcologyChart() {
    const ctx = document.getElementById('ecologyChart');
    if (!ctx) return;
    
    ecologyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
            datasets: [{
                label: 'Чистые зоны',
                data: [8, 10, 12, 15, 18, 22],
                backgroundColor: '#4CAF50'
            }, {
                label: 'Зоны риска',
                data: [15, 14, 13, 12, 11, 10],
                backgroundColor: '#f44336'
            }]
        },
        options: getChartOptions()
    });
}

function getChartOptions() {
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
    const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: borderColor
                },
                ticks: {
                    color: textColor
                }
            },
            x: {
                grid: {
                    color: borderColor
                },
                ticks: {
                    color: textColor
                }
            }
        }
    };
}

function updateChartsTheme() {
    const options = getChartOptions();
    if (productionChart) productionChart.options = options;
    if (cropsChart) cropsChart.options = options;
    if (ecologyChart) ecologyChart.options = options;
    
    if (productionChart) productionChart.update();
    if (cropsChart) cropsChart.update();
    if (ecologyChart) ecologyChart.update();
}

// ========== ФОРУМ ==========
function initForum() {
    const topicsList = document.getElementById('topicsList');
    if (!topicsList) return;
    
    const topics = [
        {
            title: 'Оптимальные сроки посева озимых',
            author: 'Иван Петров',
            replies: 12,
            lastActive: '2 часа назад'
        },
        {
            title: 'Борьба с колорадским жуком',
            author: 'Елена Смирнова',
            replies: 8,
            lastActive: '5 часов назад'
        },
        {
            title: 'Выбор удобрений для картофеля',
            author: 'Алексей Иванов',
            replies: 15,
            lastActive: 'вчера'
        },
        {
            title: 'Современные теплицы',
            author: 'Мария Сидорова',
            replies: 6,
            lastActive: 'вчера'
        }
    ];
    
    topicsList.innerHTML = topics.map(topic => `
        <div class="topic-item" onclick="showTopic('${topic.title}')">
            <div class="topic-title">${topic.title}</div>
            <div class="topic-meta">
                <span><i class="fas fa-user"></i> ${topic.author}</span>
                <span><i class="fas fa-comment"></i> ${topic.replies}</span>
                <span><i class="fas fa-clock"></i> ${topic.lastActive}</span>
            </div>
        </div>
    `).join('');
    
    // Активные пользователи
    const activeUsers = document.getElementById('activeUsers');
    activeUsers.innerHTML = `
        <div class="user-item"><i class="fas fa-user-circle"></i> Иван Петров (онлайн)</div>
        <div class="user-item"><i class="fas fa-user-circle"></i> Елена Смирнова (онлайн)</div>
        <div class="user-item"><i class="fas fa-user-circle"></i> Алексей Иванов (15 мин)</div>
        <div class="user-item"><i class="fas fa-user-circle"></i> Мария Сидорова (30 мин)</div>
    `;
}

function showTopic(title) {
    showNotification(`Открыта тема: ${title}`, 'info');
}

function showNewTopicForm() {
    showNotification('Форма создания темы', 'info');
}

// ========== РЫНОЧНЫЕ ЦЕНЫ ==========
function initPrices() {
    const pricesBody = document.getElementById('pricesTableBody');
    if (!pricesBody) return;
    
    const prices = [
        { product: 'Пшеница 3 класс', price: '15.20 ₽', change: '+2.5%', forecast: 'Рост' },
        { product: 'Ячмень', price: '12.80 ₽', change: '+1.8%', forecast: 'Стабильно' },
        { product: 'Кукуруза', price: '14.50 ₽', change: '-0.5%', forecast: 'Спад' },
        { product: 'Подсолнечник', price: '28.90 ₽', change: '+3.2%', forecast: 'Рост' },
        { product: 'Картофель', price: '18.30 ₽', change: '+1.2%', forecast: 'Стабильно' },
        { product: 'Молоко', price: '45.00 ₽', change: '+0.8%', forecast: 'Стабильно' },
        { product: 'Говядина', price: '350.00 ₽', change: '+1.5%', forecast: 'Рост' },
        { product: 'Свинина', price: '280.00 ₽', change: '-1.2%', forecast: 'Спад' }
    ];
    
    pricesBody.innerHTML = prices.map(item => `
        <tr>
            <td>${item.product}</td>
            <td><strong>${item.price}</strong></td>
            <td class="${item.change.startsWith('+') ? 'price-up' : 'price-down'}">${item.change}</td>
            <td>${item.forecast}</td>
        </tr>
    `).join('');
}

// ========== КАЛЕНДАРЬ ==========
function initCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const works = [
        { period: '1-15 марта', work: 'Внесение удобрений', type: 'spring' },
        { period: '15-30 марта', work: 'Посев яровых', type: 'spring' },
        { period: '1-15 апреля', work: 'Посадка картофеля', type: 'spring' },
        { period: '15-30 апреля', work: 'Защита растений', type: 'spring' },
        { period: '1-15 мая', work: 'Прополка', type: 'summer' },
        { period: '15-30 мая', work: 'Полив', type: 'summer' },
        { period: '1-15 июня', work: 'Обработка от вредителей', type: 'summer' },
        { period: '15-30 июня', work: 'Сенокос', type: 'summer' }
    ];
    
    calendarGrid.innerHTML = works.map(work => `
        <div class="calendar-item ${work.type}">
            <strong>${work.period}</strong>
            <p>${work.work}</p>
        </div>
    `).join('');
}

// ========== ДОСТИЖЕНИЯ ==========
function initAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (!achievementsGrid) return;
    
    const achievements = [
        { name: 'Первооткрыватель', desc: 'Добавьте первую метку', icon: '🗺️', unlocked: userMarkers.length > 0 },
        { name: 'Исследователь', desc: 'Добавьте 10 меток', icon: '🔍', unlocked: userMarkers.length >= 10 },
        { name: 'Эколог', desc: 'Отметьте 5 чистых зон', icon: '🌿', unlocked: false },
        { name: 'Активист', desc: 'Участвуйте в форуме', icon: '💬', unlocked: false },
        { name: 'Эксперт', desc: 'Получите 100 лайков', icon: '🏆', unlocked: false },
        { name: 'Ветеран', desc: 'Год на сайте', icon: '⭐', unlocked: false }
    ];
    
    achievementsGrid.innerHTML = achievements.map(ach => `
        <div class="achievement-card ${!ach.unlocked ? 'locked' : ''}">
            <div class="achievement-icon">${ach.icon}</div>
            <h4>${ach.name}</h4>
            <p>${ach.desc}</p>
            ${ach.unlocked ? '<span class="unlocked">✓ Получено</span>' : ''}
        </div>
    `).join('');
}

// ========== БАЗА ЗНАНИЙ ==========
function showCropGuide() {
    showNotification('Справочник культур (в разработке)', 'info');
}

function showFertilizerGuide() {
    showNotification('Руководство по удобрениям (в разработке)', 'info');
}

function showPestGuide() {
    showNotification('Справочник вредителей (в разработке)', 'info');
}

function showDiseaseGuide() {
    showNotification('Справочник болезней (в разработке)', 'info');
}

// ========== КАЛЬКУЛЯТОР ==========
function calculateProfit() {
    const crop = document.getElementById('cropSelect').value;
    const area = parseFloat(document.getElementById('areaInput').value) || 0;
    const costs = parseFloat(document.getElementById('costsInput').value) || 0;
    
    const cropData = {
        'wheat': { yield: 45, price: 15 },
        'barley': { yield: 40, price: 12 },
        'corn': { yield: 60, price: 14 },
        'sunflower': { yield: 25, price: 28 }
    };
    
    const data = cropData[crop];
    const totalYield = data.yield * area * 100; // в кг
    const income = totalYield * data.price / 1000; // в тыс. руб
    const totalCosts = costs * area / 1000; // в тыс. руб
    const profit = income - totalCosts;
    const profitability = (profit / totalCosts * 100).toFixed(1);
    
    document.getElementById('incomeResult').textContent = formatMoney(income);
    document.getElementById('totalCostsResult').textContent = formatMoney(totalCosts);
    document.getElementById('profitResult').textContent = formatMoney(profit);
    document.getElementById('profitabilityResult').textContent = profitability + '%';
}

function formatMoney(amount) {
    return Math.round(amount).toLocaleString() + ' тыс. ₽';
}

// ========== ЧАТ-БОТ ==========
function initChatBot() {
    const chatBody = document.getElementById('chatBody');
    chatBody.classList.add('collapsed');
}

function toggleChat() {
    const chatBody = document.getElementById('chatBody');
    const icon = document.getElementById('chatToggleIcon');
    
    chatBody.classList.toggle('collapsed');
    icon.classList.toggle('fa-chevron-up');
    icon.classList.toggle('fa-chevron-down');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    // Добавляем сообщение пользователя
    addMessage(message, 'user');
    input.value = '';
    
    // Имитация ответа бота
    setTimeout(() => {
        const responses = [
            'Спасибо за вопрос! Я передам его специалисту.',
            'Информация по этому вопросу есть в базе знаний.',
            'Рекомендую обратиться к разделу "Удобрения".',
            'Сейчас проверю актуальные данные...',
            'По вашему вопросу есть несколько статей.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Делаем функции глобальными
window.setMarkerType = setMarkerType;
window.filterMarkers = filterMarkers;
window.deleteUserMarker = deleteUserMarker;
window.exportMarkers = exportMarkers;
window.importMarkers = importMarkers;
window.clearAllMarkers = clearAllMarkers;
window.scrollToTop = scrollToTop;
window.toggleUserMenu = toggleUserMenu;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeModal = closeModal;
window.login = login;
window.register = register;
window.flyToLocation = flyToLocation;
window.showTopic = showTopic;
window.showNewTopicForm = showNewTopicForm;
window.showCropGuide = showCropGuide;
window.showFertilizerGuide = showFertilizerGuide;
window.showPestGuide = showPestGuide;
window.showDiseaseGuide = showDiseaseGuide;
window.calculateProfit = calculateProfit;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
