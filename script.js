// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let cleanPlacesData = [];
let dirtyPlacesData = [];
let userMarkers = [];
let map = null;
let markerGroup = null;
let heatLayer = null;
let currentMarkerType = 'clean';
let currentUser = null;
let notifications = [];
let weatherData = null;
let marketplaceItems = [];
let companies = [];
let achievements = [];
let diagnosisHistory = [];
let coopOffers = [];

// Графики
let productionChart = null;
let cropsChart = null;
let ecologyChart = null;
let yieldForecastChart = null;
let weatherImpactChart = null;
let soilChart = null;
let priceHistoryChart = null;

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
    initWeather();
    initMarketplace();
    initCooperation();
    loadCompanies();
    loadDiagnosisHistory();
    checkAchievements();
    startAutoRefresh();
});

// ========== АВТООБНОВЛЕНИЕ ==========
function startAutoRefresh() {
    // Обновление цен каждые 30 минут
    setInterval(refreshPrices, 30 * 60 * 1000);
    
    // Обновление погоды каждый час
    setInterval(refreshWeather, 60 * 60 * 1000);
    
    // Обновление курсов валют раз в день
    setInterval(updateCurrencyRates, 24 * 60 * 60 * 1000);
}

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
    
    updateChartsTheme();
    showNotification('Тема успешно изменена', 'success');
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
        <button onclick="document.getElementById('notification-${id}').remove()" class="notification-close">×</button>
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

// ========== ПРОГРЕСС-БАР ЗАГРУЗКИ ==========
function showProgress(message) {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar-container';
    progressDiv.id = 'progressBar';
    progressDiv.innerHTML = `
        <div class="progress-message">${message}</div>
        <div class="progress-track">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
    `;
    document.body.appendChild(progressDiv);
    
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => progressDiv.remove(), 500);
        } else {
            width += 10;
            progressDiv.querySelector('.progress-fill').style.width = width + '%';
        }
    }, 200);
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadData() {
    showProgress('Загрузка данных...');
    
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
            <i class="fas fa-city"></i> Город мониторинга: ${config.air.openAqCity} |
            <i class="fas fa-cloud-sun"></i> Погода: Брянск
        `;
    }
}

// ========== ЗАГРУЗКА КОМПАНИЙ ==========
function loadCompanies() {
    companies = [
        {
            id: 1,
            name: 'Агрофирма "Брянский Нива"',
            specialization: 'Зерновые, картофель',
            soil: 'Дерново-подзолистые',
            area: 12000,
            rating: 4.5,
            employees: 320,
            turnover: 850
        },
        {
            id: 2,
            name: 'ЗАО "Брянская мясная компания"',
            specialization: 'Животноводство',
            soil: 'Серые лесные',
            area: 8500,
            rating: 4.2,
            employees: 280,
            turnover: 720
        },
        {
            id: 3,
            name: 'ООО "Агрохолдинг Добрунь"',
            specialization: 'Овощеводство',
            soil: 'Торфяно-болотные',
            area: 1200,
            rating: 4.8,
            employees: 150,
            turnover: 450
        },
        {
            id: 4,
            name: 'ООО "ЭкоАгро Брянск"',
            specialization: 'Органическое',
            soil: 'Дерново-подзолистые',
            area: 2500,
            rating: 5.0,
            employees: 95,
            turnover: 380
        },
        {
            id: 5,
            name: 'СПК "Красный Октябрь"',
            specialization: 'Молочное животноводство',
            soil: 'Дерново-подзолистые',
            area: 6800,
            rating: 4.3,
            employees: 210,
            turnover: 520
        },
        {
            id: 6,
            name: 'ООО "Брянская зерновая"',
            specialization: 'Зерновые',
            soil: 'Серые лесные',
            area: 15000,
            rating: 4.6,
            employees: 180,
            turnover: 950
        }
    ];
    
    displayCompanies();
}

function displayCompanies() {
    const companyList = document.getElementById('companyList');
    if (!companyList) return;
    
    companyList.innerHTML = companies.map(company => `
        <div class="company-item" onclick="showCompanyDetails(${company.id})">
            <h4>${company.name}</h4>
            <p><i class="fas fa-tag"></i> ${company.specialization}</p>
            <p><i class="fas fa-mountain"></i> ${company.soil}</p>
            <p><i class="fas fa-chart-area"></i> ${company.area.toLocaleString()} га</p>
            <p><i class="fas fa-star"></i> Рейтинг: ${company.rating}/5</p>
            <p><i class="fas fa-users"></i> ${company.employees} сотрудников</p>
        </div>
    `).join('');
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
    
    // Добавляем масштаб
    L.control.scale().addTo(map);
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
                <button onclick="addToRoute(${place.lat}, ${place.lon})" class="popup-btn">
                    <i class="fas fa-route"></i> Добавить в маршрут
                </button>
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
                <button onclick="reportPollution('${place.name}')" class="popup-btn warning">
                    <i class="fas fa-flag"></i> Сообщить об ухудшении
                </button>
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
        html: `<div class="marker-emoji">${emoji}</div>`,
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
        'problem': '🏭',
        'sampling': '🧪'
    }[currentMarkerType];
    
    const newMarker = {
        id: Date.now(),
        lat: latlng.lat,
        lng: latlng.lng,
        type: currentMarkerType,
        title: title,
        description: description || '',
        date: new Date().toLocaleString(),
        userId: currentUser?.id || 'guest'
    };
    
    userMarkers.push(newMarker);
    addUserMarkerToMap(newMarker);
    saveUserMarkers();
    updateUserMarkersList();
    updateStats();
    checkMarkerAchievements();
    showNotification('Метка добавлена', 'success');
}

// Добавление пользовательской метки на карту
function addUserMarkerToMap(marker) {
    const emoji = {
        'clean': '🌿',
        'dirty': '⚠️',
        'observation': '🔍',
        'problem': '🏭',
        'sampling': '🧪'
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
            <div class="popup-actions">
                <button onclick="editUserMarker(${marker.id})" class="popup-btn edit">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button onclick="deleteUserMarker(${marker.id})" class="popup-btn delete">
                    <i class="fas fa-trash"></i> Удалить
                </button>
                <button onclick="shareMarker(${marker.id})" class="popup-btn share">
                    <i class="fas fa-share"></i> Поделиться
                </button>
            </div>
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
        'problem': 'Проблемная зона',
        'sampling': 'Проба почвы'
    };
    return names[type] || type;
}

// Редактирование метки
function editUserMarker(id) {
    const marker = userMarkers.find(m => m.id === id);
    if (!marker) return;
    
    const newTitle = prompt('Введите новое название:', marker.title);
    if (newTitle === null) return;
    
    const newDescription = prompt('Введите новое описание:', marker.description);
    
    marker.title = newTitle;
    marker.description = newDescription || marker.description;
    
    saveUserMarkers();
    markerGroup.clearLayers();
    addMarkersFromData();
    updateUserMarkersList();
    showNotification('Метка обновлена', 'success');
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

// Поделиться меткой
function shareMarker(id) {
    const marker = userMarkers.find(m => m.id === id);
    if (!marker) return;
    
    const shareText = `Метка на карте: ${marker.title}\nКоординаты: ${marker.lat}, ${marker.lng}\nОписание: ${marker.description}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Агро-Брянск: Метка на карте',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText);
        showNotification('Скопировано в буфер обмена', 'success');
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
    
    showNotification(`Выбран тип: ${getMarkerTypeName(type)}`, 'info');
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
                'problem': '🏭',
                'sampling': '🧪'
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
    
    showNotification(`Фильтр применен: ${type === 'all' ? 'все объекты' : type}`, 'info');
}

// ========== ТЕПЛОВАЯ КАРТА ==========
function toggleHeatMap() {
    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
        showNotification('Тепловая карта отключена', 'info');
        return;
    }
    
    const heatData = [
        ...cleanPlacesData.map(p => [p.lat, p.lon, 0.3]),
        ...dirtyPlacesData.map(p => [p.lat, p.lon, 0.8]),
        ...userMarkers.map(m => [m.lat, m.lng, 0.5])
    ];
    
    heatLayer = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'red'}
    }).addTo(map);
    
    showNotification('Тепловая карта активирована', 'success');
}

// ========== СПУТНИКОВЫЙ РЕЖИМ ==========
let satelliteMode = false;

function toggleSatellite() {
    satelliteMode = !satelliteMode;
    
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    if (satelliteMode) {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri',
            maxZoom: 18
        }).addTo(map);
        showNotification('Спутниковый режим', 'success');
    } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18
        }).addTo(map);
        showNotification('Схематический режим', 'success');
    }
    
    // Восстанавливаем маркеры
    markerGroup.addTo(map);
}

// ========== ИЗМЕРЕНИЕ РАССТОЯНИЯ ==========
let distancePoints = [];
let distancePolyline = null;

function measureDistance() {
    distancePoints = [];
    if (distancePolyline) {
        map.removeLayer(distancePolyline);
        distancePolyline = null;
    }
    
    showNotification('Кликните на карту, чтобы выбрать начальную точку', 'info');
    
    map.once('click', function(e) {
        distancePoints.push([e.latlng.lat, e.latlng.lng]);
        showNotification('Кликните для выбора конечной точки', 'info');
        
        map.once('click', function(e) {
            distancePoints.push([e.latlng.lat, e.latlng.lng]);
            
            distancePolyline = L.polyline(distancePoints, {color: 'red'}).addTo(map);
            
            const distance = map.distance(
                L.latLng(distancePoints[0][0], distancePoints[0][1]),
                L.latLng(distancePoints[1][0], distancePoints[1][1])
            );
            
            const distanceKm = (distance / 1000).toFixed(2);
            showNotification(`Расстояние: ${distanceKm} км`, 'success');
            
            // Добавляем маркеры
            L.marker(distancePoints[0]).addTo(map).bindPopup('Точка A').openPopup();
            L.marker(distancePoints[1]).addTo(map).bindPopup('Точка B');
        });
    });
}

// ========== ТЕКУЩЕЕ МЕСТОПОЛОЖЕНИЕ ==========
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Геолокация не поддерживается', 'error');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            map.flyTo([lat, lng], 12);
            
            L.marker([lat, lng], {
                icon: createCustomIcon('📍', 'current')
            }).addTo(map).bindPopup('Вы здесь').openPopup();
            
            showNotification('Местоположение определено', 'success');
        },
        function(error) {
            showNotification('Ошибка определения местоположения', 'error');
        }
    );
}

// ========== ДОБАВЛЕНИЕ В МАРШРУТ ==========
let routePoints = [];

function addToRoute(lat, lng) {
    routePoints.push([lat, lng]);
    
    if (routePoints.length >= 2) {
        L.polyline(routePoints, {color: 'blue', weight: 5}).addTo(map);
        
        const totalDistance = calculateRouteDistance(routePoints);
        showNotification(`Маршрут построен. Общая длина: ${totalDistance} км`, 'success');
        
        routePoints = [];
    } else {
        showNotification('Добавьте следующую точку маршрута', 'info');
    }
}

function calculateRouteDistance(points) {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += map.distance(
            L.latLng(points[i][0], points[i][1]),
            L.latLng(points[i + 1][0], points[i + 1][1])
        );
    }
    return (total / 1000).toFixed(2);
}

// ========== СТАТИСТИКА ==========
function updateStats() {
    const statsContainer = document.getElementById('ecologyStats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <h4>Чистые зоны</h4>
            <div class="stat-number">${cleanPlacesData.length}</div>
            <div class="stat-trend positive">+2 за месяц</div>
        </div>
        <div class="stat-card">
            <h4>Зоны риска</h4>
            <div class="stat-number">${dirtyPlacesData.length}</div>
            <div class="stat-trend negative">-1 за месяц</div>
        </div>
        <div class="stat-card">
            <h4>Мои метки</h4>
            <div class="stat-number">${userMarkers.length}</div>
            <div class="stat-trend">+${userMarkers.length > 0 ? 'активно' : 'нет меток'}</div>
        </div>
        <div class="stat-card">
            <h4>Всего объектов</h4>
            <div class="stat-number">${cleanPlacesData.length + dirtyPlacesData.length + userMarkers.length}</div>
            <div class="stat-trend">в мониторинге</div>
        </div>
        <div class="stat-card">
            <h4>Пробы почвы</h4>
            <div class="stat-number">${userMarkers.filter(m => m.type === 'sampling').length}</div>
            <div class="stat-trend">требуют анализа</div>
        </div>
        <div class="stat-card">
            <h4>Индекс чистоты</h4>
            <div class="stat-number">${calculateCleanlinessIndex()}</div>
            <div class="stat-trend">из 100</div>
        </div>
    `;
    
    // Обновляем счетчики в заголовках
    document.getElementById('cleanCount').textContent = cleanPlacesData.length;
    document.getElementById('dirtyCount').textContent = dirtyPlacesData.length;
    document.getElementById('userCount').textContent = userMarkers.length;
}

function calculateCleanlinessIndex() {
    const total = cleanPlacesData.length + dirtyPlacesData.length;
    if (total === 0) return 0;
    return Math.round((cleanPlacesData.length / total) * 100);
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
                <div class="place-actions">
                    <button class="view-on-map" onclick="flyToLocation(${place.lat}, ${place.lon})">
                        <i class="fas fa-eye"></i> Показать
                    </button>
                    <button class="add-to-route" onclick="addToRoute(${place.lat}, ${place.lon})">
                        <i class="fas fa-route"></i> Маршрут
                    </button>
                </div>
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
                <div class="place-actions">
                    <button class="view-on-map" onclick="flyToLocation(${place.lat}, ${place.lon})">
                        <i class="fas fa-eye"></i> Показать
                    </button>
                    <button class="report-btn" onclick="reportPollution('${place.name}')">
                        <i class="fas fa-flag"></i> Сообщить
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Пользовательские метки
    updateUserMarkersList();
}

function flyToLocation(lat, lng) {
    map.flyTo([lat, lng], 12);
}

function reportPollution(placeName) {
    showNotification(`Сообщение об ухудшении отправлено по адресу: ${placeName}`, 'success');
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
            <p><i class="fas fa-align-left"></i> ${marker.description || 'Нет описания'}</p>
            <p><i class="fas fa-calendar"></i> ${marker.date}</p>
            <div class="place-actions" style="display: flex; gap: 10px;">
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
    const exportData = {
        markers: userMarkers,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `markers_export_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification(`Экспортировано ${userMarkers.length} меток`, 'success');
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
                const markersToAdd = imported.markers || imported;
                
                if (Array.isArray(markersToAdd)) {
                    userMarkers = [...userMarkers, ...markersToAdd];
                    saveUserMarkers();
                    
                    // Обновляем карту
                    markerGroup.clearLayers();
                    addMarkersFromData();
                    
                    updateUserMarkersList();
                    updateStats();
                    
                    showNotification(`Импортировано ${markersToAdd.length} меток`, 'success');
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

// ========== ПОГОДА ==========
async function initWeather() {
    showProgress('Загрузка погодных данных...');
    
    // Имитация загрузки погоды
    weatherData = {
        current: {
            temp: 18,
            feels_like: 17,
            humidity: 65,
            wind_speed: 3.5,
            wind_direction: 'СЗ',
            pressure: 752,
            condition: 'облачно',
            icon: '☁️'
        },
        forecast: [
            { day: 'Пн', temp: 19, condition: '☀️', precipitation: 0 },
            { day: 'Вт', temp: 21, condition: '☀️', precipitation: 0 },
            { day: 'Ср', temp: 20, condition: '⛅', precipitation: 10 },
            { day: 'Чт', temp: 17, condition: '☁️', precipitation: 30 },
            { day: 'Пт', temp: 15, condition: '🌧️', precipitation: 70 },
            { day: 'Сб', temp: 16, condition: '☁️', precipitation: 20 },
            { day: 'Вс', temp: 18, condition: '☀️', precipitation: 0 }
        ],
        agro: {
            gdd: 145, // сумма эффективных температур
            frost_risk: 'Низкий',
            soil_temp: 14,
            soil_moisture: 65,
            evaporation: 3.2
        }
    };
    
    displayWeather();
    displayAgroRecommendations();
}

function displayWeather() {
    const weatherGrid = document.getElementById('weatherGrid');
    if (!weatherGrid) return;
    
    weatherGrid.innerHTML = `
        <div class="weather-current">
            <div class="weather-icon-large">${weatherData.current.icon}</div>
            <div class="weather-temp-large">${weatherData.current.temp}°C</div>
            <div class="weather-condition">${weatherData.current.condition}</div>
            <div class="weather-details">
                <span><i class="fas fa-tint"></i> ${weatherData.current.humidity}%</span>
                <span><i class="fas fa-wind"></i> ${weatherData.current.wind_speed} м/с</span>
                <span><i class="fas fa-compress"></i> ${weatherData.current.pressure} мм</span>
            </div>
        </div>
        <div class="weather-forecast">
            ${weatherData.forecast.map(day => `
                <div class="weather-day">
                    <div class="day-name">${day.day}</div>
                    <div class="day-icon">${day.condition}</div>
                    <div class="day-temp">${day.temp}°</div>
                    <div class="day-precip">${day.precipitation}%</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Агропоказатели
    const agroIndicators = document.getElementById('agroIndicators');
    if (agroIndicators) {
        agroIndicators.innerHTML = `
            <div class="indicator">
                <span>Сумма температур</span>
                <strong>${weatherData.agro.gdd}°C</strong>
            </div>
            <div class="indicator">
                <span>Риск заморозков</span>
                <strong class="${weatherData.agro.frost_risk === 'Низкий' ? 'safe' : 'warning'}">${weatherData.agro.frost_risk}</strong>
            </div>
            <div class="indicator">
                <span>Температура почвы</span>
                <strong>${weatherData.agro.soil_temp}°C</strong>
            </div>
            <div class="indicator">
                <span>Влажность почвы</span>
                <strong>${weatherData.agro.soil_moisture}%</strong>
            </div>
            <div class="indicator">
                <span>Испаряемость</span>
                <strong>${weatherData.agro.evaporation} мм</strong>
            </div>
        `;
    }
}

function displayAgroRecommendations() {
    const recommendations = document.getElementById('workRecommendations');
    if (!recommendations) return;
    
    const workList = [];
    
    if (weatherData.current.temp > 15 && weatherData.current.precipitation < 30) {
        workList.push('✅ Благоприятные условия для полевых работ');
        workList.push('🌱 Можно начинать посев яровых');
        workList.push('🧪 Рекомендуется отбор проб почвы');
    } else if (weatherData.current.precipitation > 50) {
        workList.push('⚠️ Высокая влажность - отложите полевые работы');
        workList.push('📋 Планирование работ в помещении');
        workList.push('🔧 Техническое обслуживание оборудования');
    } else {
        workList.push('🔄 Умеренные условия - возможны ограниченные работы');
    }
    
    if (weatherData.agro.frost_risk === 'Высокий') {
        workList.push('❄️ Риск заморозков! Защитите посевы');
    }
    
    if (weatherData.agro.soil_moisture < 40) {
        workList.push('💧 Недостаток влаги - требуется полив');
    }
    
    recommendations.innerHTML = workList.map(item => `<li>${item}</li>`).join('');
}

function refreshWeather() {
    showNotification('Обновление погодных данных...', 'info');
    setTimeout(() => {
        initWeather();
        showNotification('Погода обновлена', 'success');
    }, 1000);
}

// ========== МАРКЕТПЛЕЙС ==========
function initMarketplace() {
    marketplaceItems = [
        {
            id: 1,
            name: 'Пшеница озимая, сорт "Московская-56"',
            category: 'seeds',
            price: 25,
            unit: 'kg',
            seller: 'ООО "Агросемена"',
            description: 'Элитные семена, всхожесть 98%',
            phone: '+7 (4832) 55-55-55',
            date: '2026-03-15',
            image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=200&q=80'
        },
        {
            id: 2,
            name: 'Аммиачная селитра',
            category: 'fertilizers',
            price: 38,
            unit: 'kg',
            seller: 'АО "БрянскХим"',
            description: 'Азотное удобрение, мешки по 50 кг',
            phone: '+7 (4832) 66-66-66',
            date: '2026-03-14',
            image: 'https://images.unsplash.com/photo-1585314614250-d2138765c1d8?auto=format&fit=crop&w=200&q=80'
        },
        {
            id: 3,
            name: 'Трактор МТЗ-82.1',
            category: 'equipment',
            price: 1800000,
            unit: 'piece',
            seller: 'ООО "Технопарк"',
            description: '2022 г.в., наработка 500 м/ч, идеальное состояние',
            phone: '+7 (4832) 77-77-77',
            date: '2026-03-10',
            image: 'https://images.unsplash.com/photo-1531722569936-825d3dd91b15?auto=format&fit=crop&w=200&q=80'
        },
        {
            id: 4,
            name: 'Картофель продовольственный',
            category: 'crops',
            price: 18,
            unit: 'kg',
            seller: 'ООО "Брянский картофель"',
            description: 'Урожай 2025, сорт "Гала", фасованный',
            phone: '+7 (4832) 88-88-88',
            date: '2026-03-12',
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80'
        },
        {
            id: 5,
            name: 'Услуги по вспашке',
            category: 'services',
            price: 2500,
            unit: 'ha',
            seller: 'ИП Иванов',
            description: 'Вспашка, культивация, дискование. Своя техника.',
            phone: '+7 (900) 123-45-67',
            date: '2026-03-13',
            image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b9b?auto=format&fit=crop&w=200&q=80'
        },
        {
            id: 6,
            name: 'Кукуруза на зерно',
            category: 'crops',
            price: 14,
            unit: 'kg',
            seller: 'Агрофирма "Нива"',
            description: 'Фуражная кукуруза, влажность 14%',
            phone: '+7 (4832) 99-99-99',
            date: '2026-03-11',
            image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=200&q=80'
        }
    ];
    
    displayMarketplace('all');
}

function displayMarketplace(category = 'all') {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;
    
    const filtered = category === 'all' 
        ? marketplaceItems 
        : marketplaceItems.filter(item => item.category === category);
    
    grid.innerHTML = filtered.map(item => `
        <div class="marketplace-card" onclick="showProductDetails(${item.id})">
            <img src="${item.image}" alt="${item.name}" class="marketplace-image">
            <div class="marketplace-content">
                <span class="marketplace-category">${getCategoryName(item.category)}</span>
                <h4>${item.name}</h4>
                <p class="marketplace-price">${formatPrice(item.price, item.unit)}</p>
                <p class="marketplace-seller"><i class="fas fa-user"></i> ${item.seller}</p>
                <p class="marketplace-date"><i class="fas fa-calendar"></i> ${item.date}</p>
                <button class="btn-contact" onclick="contactSeller('${item.phone}', event)">
                    <i class="fas fa-phone"></i> Связаться
                </button>
            </div>
        </div>
    `).join('');
}

function getCategoryName(category) {
    const names = {
        'seeds': 'Семена',
        'fertilizers': 'Удобрения',
        'equipment': 'Техника',
        'crops': 'Урожай',
        'services': 'Услуги'
    };
    return names[category] || category;
}

function formatPrice(price, unit) {
    const unitNames = {
        'kg': '₽/кг',
        'ton': '₽/т',
        'piece': '₽/шт',
        'hour': '₽/час',
        'ha': '₽/га'
    };
    return `${price.toLocaleString()} ${unitNames[unit]}`;
}

function filterMarketplace(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayMarketplace(category);
}

function sortMarketplace() {
    const sortBy = document.getElementById('marketplaceSort').value;
    const searchTerm = document.getElementById('marketplaceSearch').value.toLowerCase();
    
    let filtered = marketplaceItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.description.toLowerCase().includes(searchTerm)
    );
    
    switch(sortBy) {
        case 'priceAsc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'priceDesc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'popular':
            // Имитация популярности
            filtered.sort(() => Math.random() - 0.5);
            break;
    }
    
    displayFilteredMarketplace(filtered);
}

function displayFilteredMarketplace(items) {
    const grid = document.getElementById('marketplaceGrid');
    grid.innerHTML = items.map(item => `
        <div class="marketplace-card" onclick="showProductDetails(${item.id})">
            <img src="${item.image}" alt="${item.name}" class="marketplace-image">
            <div class="marketplace-content">
                <span class="marketplace-category">${getCategoryName(item.category)}</span>
                <h4>${item.name}</h4>
                <p class="marketplace-price">${formatPrice(item.price, item.unit)}</p>
                <p class="marketplace-seller"><i class="fas fa-user"></i> ${item.seller}</p>
                <button class="btn-contact" onclick="contactSeller('${item.phone}', event)">
                    <i class="fas fa-phone"></i> Связаться
                </button>
            </div>
        </div>
    `).join('');
}

function showProductDetails(id) {
    const product = marketplaceItems.find(p => p.id === id);
    if (!product) return;
    
    alert(`
        ${product.name}
        
        Категория: ${getCategoryName(product.category)}
        Цена: ${formatPrice(product.price, product.unit)}
        Продавец: ${product.seller}
        Телефон: ${product.phone}
        
        Описание: ${product.description}
        
        Дата публикации: ${product.date}
    `);
}

function contactSeller(phone, event) {
    event.stopPropagation();
    window.location.href = `tel:${phone}`;
}

function showAddProductModal() {
    document.getElementById('addProductModal').classList.add('show');
}

function addProduct(event) {
    event.preventDefault();
    
    const newProduct = {
        id: marketplaceItems.length + 1,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        unit: document.getElementById('productUnit').value,
        description: document.getElementById('productDescription').value,
        phone: document.getElementById('productPhone').value,
        seller: 'Пользователь',
        date: new Date().toISOString().split('T')[0],
        image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=200&q=80'
    };
    
    marketplaceItems.unshift(newProduct);
    displayMarketplace('all');
    closeModal('addProductModal');
    showNotification('Товар добавлен', 'success');
}

// ========== КООПЕРАЦИЯ ==========
function initCooperation() {
    coopOffers = [
        {
            id: 1,
            type: 'offer',
            title: 'Совместная покупка удобрений',
            category: 'fertilizers',
            description: 'Ищем партнеров для оптовой закупки аммиачной селитры',
            participants: 3,
            needed: 5,
            price: 32, // цена за кг при опте
            deadline: '2026-04-01',
            organizer: 'ИП Петров'
        },
        {
            id: 2,
            type: 'request',
            title: 'Требуется трактор с сеялкой',
            category: 'equipment',
            description: 'Для посева яровых на 50 га',
            period: 'Апрель 2026',
            budget: 'договорная',
            contact: 'Агрофирма "Рассвет"'
        },
        {
            id: 3,
            type: 'joint',
            title: 'Совместная переработка молока',
            category: 'processing',
            description: 'Создание кооператива по переработке молока',
            participants: 2,
            needed: 8,
            investment: '500 тыс. ₽',
            organizer: 'СПК "Молочный край"'
        }
    ];
    
    displayCooperation('offers');
}

function displayCooperation(tab) {
    const container = document.getElementById('coopOffers');
    if (!container) return;
    
    const filtered = tab === 'offers' 
        ? coopOffers.filter(o => o.type === 'offer')
        : tab === 'requests'
        ? coopOffers.filter(o => o.type === 'request')
        : coopOffers.filter(o => o.type === 'joint');
    
    container.innerHTML = filtered.map(offer => `
        <div class="coop-card">
            <h4>${offer.title}</h4>
            <p>${offer.description}</p>
            <div class="coop-details">
                ${renderCoopDetails(offer)}
            </div>
            <button class="btn-join-coop" onclick="joinCooperation(${offer.id})">
                <i class="fas fa-handshake"></i> Участвовать
            </button>
        </div>
    `).join('');
}

function renderCoopDetails(offer) {
    if (offer.type === 'offer') {
        return `
            <p><i class="fas fa-users"></i> Участников: ${offer.participants}/${offer.needed}</p>
            <p><i class="fas fa-tag"></i> Цена: ${offer.price} ₽/кг</p>
            <p><i class="fas fa-calendar"></i> Дедлайн: ${offer.deadline}</p>
            <p><i class="fas fa-user"></i> Организатор: ${offer.organizer}</p>
        `;
    } else if (offer.type === 'request') {
        return `
            <p><i class="fas fa-clock"></i> Период: ${offer.period}</p>
            <p><i class="fas fa-money-bill"></i> Бюджет: ${offer.budget}</p>
            <p><i class="fas fa-user"></i> Контакт: ${offer.contact}</p>
        `;
    } else {
        return `
            <p><i class="fas fa-users"></i> Участников: ${offer.participants}/${offer.needed}</p>
            <p><i class="fas fa-money-bill"></i> Инвестиции: ${offer.investment}</p>
            <p><i class="fas fa-user"></i> Организатор: ${offer.organizer}</p>
        `;
    }
}

function showCoopTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayCooperation(tab);
}

function joinCooperation(id) {
    showNotification('Заявка на участие отправлена', 'success');
}

function showAddCoopModal() {
    showNotification('Форма создания кооперации', 'info');
}

// ========== РАСПОЗНАВАНИЕ БОЛЕЗНЕЙ ==========
function identifyDisease(input) {
    const file = input.files[0];
    if (!file) return;
    
    showProgress('Анализ изображения...');
    
    // Имитация распознавания
    setTimeout(() => {
        const diseases = [
            {
                name: 'Фитофтороз',
                probability: 0.87,
                description: 'Грибковое заболевание, поражает листья и плоды',
                treatment: 'Обработка препаратами Ридомил Голд, Акробат МЦ',
                prevention: 'Соблюдение севооборота, удаление растительных остатков'
            },
            {
                name: 'Мучнистая роса',
                probability: 0.12,
                description: 'Появляется белый налет на листьях',
                treatment: 'Опрыскивание Топазом или серосодержащими препаратами',
                prevention: 'Избегать загущения посадок'
            },
            {
                name: 'Септориоз',
                probability: 0.01,
                description: 'Бурые пятна на листьях',
                treatment: 'Фунгициды на основе пропиконазола',
                prevention: 'Протравливание семян'
            }
        ];
        
        // Выбираем с наибольшей вероятностью
        const result = diseases.reduce((max, d) => d.probability > max.probability ? d : max);
        
        displayDiagnosisResult(result, file);
    }, 2000);
}

function displayDiagnosisResult(disease, file) {
    const resultDiv = document.getElementById('recognitionResult');
    resultDiv.style.display = 'block';
    
    resultDiv.innerHTML = `
        <h4>Результат диагностики:</h4>
        <div class="diagnosis-card ${disease.probability > 0.7 ? 'high' : 'medium'}">
            <div class="diagnosis-name">${disease.name}</div>
            <div class="diagnosis-probability">Вероятность: ${(disease.probability * 100).toFixed(1)}%</div>
            <p>${disease.description}</p>
            <h5>Лечение:</h5>
            <p>${disease.treatment}</p>
            <h5>Профилактика:</h5>
            <p>${disease.prevention}</p>
            <button onclick="addDiagnosisToHistory('${disease.name}')" class="btn-save-diagnosis">
                <i class="fas fa-save"></i> Сохранить в историю
            </button>
        </div>
    `;
    
    // Сохраняем фото для истории
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('lastDiagnosisImage', e.target.result);
    };
    reader.readAsDataURL(file);
}

function addDiagnosisToHistory(diseaseName) {
    const diagnosis = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        disease: diseaseName,
        image: localStorage.getItem('lastDiagnosisImage')
    };
    
    diagnosisHistory.unshift(diagnosis);
    localStorage.setItem('diagnosisHistory', JSON.stringify(diagnosisHistory));
    
    showNotification('Диагноз сохранен в историю', 'success');
}

function loadDiagnosisHistory() {
    const saved = localStorage.getItem('diagnosisHistory');
    if (saved) {
        diagnosisHistory = JSON.parse(saved);
    }
    
    displayDiagnosisHistory();
}

function displayDiagnosisHistory() {
    const historyDiv = document.getElementById('diagnosisHistory');
    if (!historyDiv) return;
    
    if (diagnosisHistory.length === 0) {
        historyDiv.innerHTML = '<p class="no-history">История диагностики пуста</p>';
        return;
    }
    
    historyDiv.innerHTML = diagnosisHistory.slice(0, 5).map(d => `
        <div class="history-item" onclick="showDiagnosisDetails(${d.id})">
            <img src="${d.image}" alt="Диагноз" class="history-thumb">
            <div class="history-info">
                <strong>${d.disease}</strong>
                <small>${d.date}</small>
            </div>
        </div>
    `).join('');
}

// ========== КАЛЬКУЛЯТОР НОРМ ВЫСЕВА ==========
function calculateSeedingRate() {
    const cropSelect = document.getElementById('seedingCropSelect');
    const crop = cropSelect.value;
    const germination = parseFloat(document.getElementById('germination').value) || 95;
    const desiredPlants = parseFloat(document.getElementById('desiredPlants').value) || 450;
    
    const seedWeight = {
        'wheat': 40,
        'barley': 45,
        'corn': 300,
        'sunflower': 70
    }[crop] || 40;
    
    // Расчет нормы высева
    const seedingRate = (desiredPlants * seedWeight) / (germination / 100) / 1000; // в кг/га
    
    const resultDiv = document.getElementById('seedingResult');
    resultDiv.innerHTML = `
        <h4>Результат:</h4>
        <div class="result-item">
            <span>Норма высева:</span>
            <span class="result-value">${seedingRate.toFixed(1)} кг/га</span>
        </div>
        <div class="result-item">
            <span>Требуется семян на 100 га:</span>
            <span class="result-value">${(seedingRate * 100 / 1000).toFixed(1)} т</span>
        </div>
        <div class="result-item">
            <span>Количество семян на га:</span>
            <span class="result-value">${Math.round(desiredPlants * 1000)} шт</span>
        </div>
    `;
    
    showNotification('Норма высева рассчитана', 'success');
}

// ========== КАЛЬКУЛЯТОР УДОБРЕНИЙ ==========
function calculateFertilizer() {
    const crop = document.getElementById('fertilizerCropSelect').value;
    const area = parseFloat(document.getElementById('fertilizerArea').value) || 100;
    const fertilizerType = document.getElementById('fertilizerType').value;
    
    const norms = {
        'wheat': { N: 90, P: 60, K: 60 },
        'barley': { N: 80, P: 50, K: 50 },
        'corn': { N: 120, P: 80, K: 100 },
        'potato': { N: 100, P: 90, K: 120 }
    }[crop] || { N: 90, P: 60, K: 60 };
    
    const fertilizerComposition = {
        'ammophos': { N: 12, P: 52, K: 0 },
        'urea': { N: 46, P: 0, K: 0 },
        'saltpeter': { N: 34, P: 0, K: 0 },
        'nitroammophos': { N: 16, P: 16, K: 16 }
    }[fertilizerType] || { N: 16, P: 16, K: 16 };
    
    // Расчет потребности в удобрениях
    const needN = (norms.N / fertilizerComposition.N * 100) || 0;
    const needP = (norms.P / fertilizerComposition.P * 100) || 0;
    const needK = (norms.K / fertilizerComposition.K * 100) || 0;
    
    const totalNeed = Math.max(needN, needP, needK) * area / 1000; // в тоннах
    
    const resultDiv = document.getElementById('fertilizerResult');
    resultDiv.innerHTML = `
        <h4>Результат:</h4>
        <div class="result-item">
            <span>Требуется удобрений:</span>
            <span class="result-value">${totalNeed.toFixed(1)} т</span>
        </div>
        <div class="result-item">
            <span>В пересчете на NPK:</span>
        </div>
        <div class="result-item">
            <span>Азот (N):</span>
            <span class="result-value">${(norms.N * area / 1000).toFixed(1)} т</span>
        </div>
        <div class="result-item">
            <span>Фосфор (P):</span>
            <span class="result-value">${(norms.P * area / 1000).toFixed(1)} т</span>
        </div>
        <div class="result-item">
            <span>Калий (K):</span>
            <span class="result-value">${(norms.K * area / 1000).toFixed(1)} т</span>
        </div>
    `;
}

// ========== НОВЫЕ ГРАФИКИ ==========
function initYieldForecastChart() {
    const ctx = document.getElementById('yieldForecastChart');
    if (!ctx) return;
    
    yieldForecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026 (прогноз)'],
            datasets: [{
                label: 'Урожайность пшеницы (ц/га)',
                data: [32, 34, 35, 37, 39, 41, 44],
                borderColor: '#6b8e23',
                backgroundColor: 'rgba(107, 142, 35, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Урожайность кукурузы (ц/га)',
                data: [45, 48, 50, 53, 56, 59, 63],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: getChartOptions()
    });
}

function initWeatherImpactChart() {
    const ctx = document.getElementById('weatherImpactChart');
    if (!ctx) return;
    
    weatherImpactChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Температура', 'Осадки', 'Влажность', 'Солнечные дни'],
            datasets: [{
                label: 'Влияние на урожай (%)',
                data: [35, 25, 20, 20],
                backgroundColor: ['#ff9800', '#2196F3', '#4CAF50', '#ffc107']
            }]
        },
        options: getChartOptions()
    });
}

function initSoilChart() {
    const ctx = document.getElementById('soilChart');
    if (!ctx) return;
    
    soilChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Дерново-подзолистые', 'Серые лесные', 'Торфяно-болотные', 'Черноземы', 'Пойменные'],
            datasets: [{
                data: [45, 25, 15, 10, 5],
                backgroundColor: [
                    '#8B4513',
                    '#A0522D',
                    '#654321',
                    '#2c3e50',
                    '#556B2F'
                ]
            }]
        },
        options: getChartOptions()
    });
}

function initPriceHistoryChart() {
    const ctx = document.getElementById('priceHistoryChart');
    if (!ctx) return;
    
    priceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            datasets: [{
                label: 'Пшеница (₽/кг)',
                data: [14.5, 14.8, 15.2, 15.5, 15.3, 15.0, 14.8, 15.1, 15.4, 15.8, 16.0, 16.2],
                borderColor: '#6b8e23',
                tension: 0.4
            }, {
                label: 'Кукуруза (₽/кг)',
                data: [13.2, 13.5, 13.8, 14.0, 14.2, 14.1, 13.9, 14.3, 14.5, 14.7, 14.9, 15.1],
                borderColor: '#2196F3',
                tension: 0.4
            }]
        },
        options: getChartOptions()
    });
}

// ========== ОБНОВЛЕНИЕ ГРАФИКОВ ==========
function initCharts() {
    initProductionChart();
    initCropsChart();
    initEcologyChart();
    initYieldForecastChart();
    initWeatherImpactChart();
    initSoilChart();
    initPriceHistoryChart();
}

// ========== КОМПАНИИ ==========
function showAddCompanyModal() {
    document.getElementById('addCompanyModal').classList.add('show');
}

function addCompany(event) {
    event.preventDefault();
    
    const newCompany = {
        id: companies.length + 1,
        name: document.getElementById('companyName').value,
        specialization: document.getElementById('companySpecialization').value,
        area: parseFloat(document.getElementById('companyArea').value),
        soil: document.getElementById('companySoil').value,
        rating: 4.0,
        employees: 0,
        turnover: 0
    };
    
    companies.push(newCompany);
    displayCompanies();
    closeModal('addCompanyModal');
    showNotification('Предприятие добавлено', 'success');
}

function showCompanyDetails(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    alert(`
        ${company.name}
        
        Специализация: ${company.specialization}
        Площадь: ${company.area} га
        Тип почв: ${company.soil}
        Рейтинг: ${company.rating}/5
        Сотрудников: ${company.employees}
        Оборот: ${company.turnover} млн ₽
    `);
}

// ========== ДОСТИЖЕНИЯ ==========
function checkAchievements() {
    achievements = [
        {
            id: 1,
            name: 'Первооткрыватель',
            description: 'Добавьте первую метку на карту',
            icon: '🗺️',
            condition: () => userMarkers.length > 0,
            unlocked: userMarkers.length > 0,
            progress: userMarkers.length > 0 ? 100 : 0
        },
        {
            id: 2,
            name: 'Исследователь',
            description: 'Добавьте 10 меток на карту',
            icon: '🔍',
            condition: () => userMarkers.length >= 10,
            unlocked: userMarkers.length >= 10,
            progress: Math.min(100, (userMarkers.length / 10) * 100)
        },
        {
            id: 3,
            name: 'Эколог',
            description: 'Отметьте 5 чистых зон',
            icon: '🌿',
            condition: () => userMarkers.filter(m => m.type === 'clean').length >= 5,
            unlocked: userMarkers.filter(m => m.type === 'clean').length >= 5,
            progress: Math.min(100, (userMarkers.filter(m => m.type === 'clean').length / 5) * 100)
        },
        {
            id: 4,
            name: 'Активист',
            description: 'Опубликуйте 3 сообщения на форуме',
            icon: '💬',
            condition: () => false,
            unlocked: false,
            progress: 0
        },
        {
            id: 5,
            name: 'Агроном-эксперт',
            description: 'Проведите 10 диагностик болезней',
            icon: '🧪',
            condition: () => diagnosisHistory.length >= 10,
            unlocked: diagnosisHistory.length >= 10,
            progress: Math.min(100, (diagnosisHistory.length / 10) * 100)
        },
        {
            id: 6,
            name: 'Бизнесмен',
            description: 'Разместите 5 товаров в маркетплейсе',
            icon: '💰',
            condition: () => false,
            unlocked: false,
            progress: 0
        },
        {
            id: 7,
            name: 'Метеоролог',
            description: 'Проверяйте погоду 30 дней подряд',
            icon: '☀️',
            condition: () => false,
            unlocked: false,
            progress: 0
        },
        {
            id: 8,
            name: 'Путешественник',
            description: 'Посетите 20 различных мест на карте',
            icon: '✈️',
            condition: () => userMarkers.length >= 20,
            unlocked: userMarkers.length >= 20,
            progress: Math.min(100, (userMarkers.length / 20) * 100)
        }
    ];
    
    displayAchievements();
}

function displayAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const progressPercent = (unlockedCount / achievements.length) * 100;
    
    document.querySelector('.progress-bar').style.width = progressPercent + '%';
    document.querySelector('.achievement-points span').textContent = unlockedCount * 50 + ' очков';
    
    grid.innerHTML = achievements.map(ach => `
        <div class="achievement-card ${!ach.unlocked ? 'locked' : ''}">
            <div class="achievement-icon">${ach.icon}</div>
            <h4>${ach.name}</h4>
            <p>${ach.description}</p>
            <div class="achievement-progress-bar">
                <div class="progress-fill" style="width: ${ach.progress}%"></div>
            </div>
            <span class="progress-text">${ach.progress}%</span>
            ${ach.unlocked ? '<span class="unlocked-badge">✓ Получено</span>' : ''}
        </div>
    `).join('');
}

function checkMarkerAchievements() {
    checkAchievements();
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
            lastActive: '2 часа назад',
            views: 245
        },
        {
            title: 'Борьба с колорадским жуком',
            author: 'Елена Смирнова',
            replies: 8,
            lastActive: '5 часов назад',
            views: 189
        },
        {
            title: 'Выбор удобрений для картофеля',
            author: 'Алексей Иванов',
            replies: 15,
            lastActive: 'вчера',
            views: 312
        },
        {
            title: 'Современные теплицы',
            author: 'Мария Сидорова',
            replies: 6,
            lastActive: 'вчера',
            views: 156
        },
        {
            title: 'Как повысить урожайность пшеницы',
            author: 'Дмитрий Козлов',
            replies: 23,
            lastActive: '3 часа назад',
            views: 478
        },
        {
            title: 'Органическое земледелие: опыт',
            author: 'Сергей Николаев',
            replies: 9,
            lastActive: '1 день назад',
            views: 203
        }
    ];
    
    topicsList.innerHTML = topics.map(topic => `
        <div class="topic-item" onclick="showTopic('${topic.title}')">
            <div class="topic-title">${topic.title}</div>
            <div class="topic-meta">
                <span><i class="fas fa-user"></i> ${topic.author}</span>
                <span><i class="fas fa-comment"></i> ${topic.replies}</span>
                <span><i class="fas fa-eye"></i> ${topic.views}</span>
                <span><i class="fas fa-clock"></i> ${topic.lastActive}</span>
            </div>
        </div>
    `).join('');
    
    // Активные пользователи
    const activeUsers = document.getElementById('activeUsers');
    if (activeUsers) {
        activeUsers.innerHTML = `
            <div class="user-item online"><i class="fas fa-user-circle"></i> Иван Петров</div>
            <div class="user-item online"><i class="fas fa-user-circle"></i> Елена Смирнова</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Алексей Иванов (15 мин)</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Мария Сидорова (30 мин)</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Дмитрий Козлов (онлайн)</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Сергей Николаев (1 час)</div>
        `;
    }
    
    // Рейтинг
    const ratingList = document.getElementById('ratingList');
    if (ratingList) {
        ratingList.innerHTML = `
            <div class="rating-item"><span class="rating-place">1</span> Иван Петров <span class="rating-score">2450</span></div>
            <div class="rating-item"><span class="rating-place">2</span> Алексей Иванов <span class="rating-score">2180</span></div>
            <div class="rating-item"><span class="rating-place">3</span> Елена Смирнова <span class="rating-score">1940</span></div>
            <div class="rating-item"><span class="rating-place">4</span> Дмитрий Козлов <span class="rating-score">1820</span></div>
            <div class="rating-item"><span class="rating-place">5</span> Мария Сидорова <span class="rating-score">1560</span></div>
        `;
    }
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
        { product: 'Пшеница 3 класс', price: '15.20 ₽', change: '+2.5%', forecast: 'Рост', volume: 'Высокий' },
        { product: 'Ячмень', price: '12.80 ₽', change: '+1.8%', forecast: 'Стабильно', volume: 'Средний' },
        { product: 'Кукуруза', price: '14.50 ₽', change: '-0.5%', forecast: 'Спад', volume: 'Высокий' },
        { product: 'Подсолнечник', price: '28.90 ₽', change: '+3.2%', forecast: 'Рост', volume: 'Средний' },
        { product: 'Картофель', price: '18.30 ₽', change: '+1.2%', forecast: 'Стабильно', volume: 'Низкий' },
        { product: 'Молоко', price: '45.00 ₽', change: '+0.8%', forecast: 'Стабильно', volume: 'Средний' },
        { product: 'Говядина', price: '350.00 ₽', change: '+1.5%', forecast: 'Рост', volume: 'Низкий' },
        { product: 'Свинина', price: '280.00 ₽', change: '-1.2%', forecast: 'Спад', volume: 'Средний' },
        { product: 'Яйца (десяток)', price: '85.00 ₽', change: '+2.1%', forecast: 'Рост', volume: 'Высокий' },
        { product: 'Гречиха', price: '22.50 ₽', change: '+4.5%', forecast: 'Рост', volume: 'Низкий' }
    ];
    
    pricesBody.innerHTML = prices.map(item => `
        <tr>
            <td><strong>${item.product}</strong></td>
            <td class="price-value">${item.price}</td>
            <td class="${item.change.startsWith('+') ? 'price-up' : 'price-down'}">${item.change}</td>
            <td>${item.forecast}</td>
            <td>${item.volume}</td>
        </tr>
    `).join('');
    
    document.getElementById('priceUpdateTime').textContent = new Date().toLocaleString();
}

function refreshPrices() {
    showNotification('Обновление цен...', 'info');
    setTimeout(() => {
        initPrices();
        showNotification('Цены обновлены', 'success');
    }, 1000);
}

function updateCurrencyRates() {
    // Имитация обновления курсов валют
    console.log('Курсы валют обновлены');
}

// ========== КАЛЕНДАРЬ ==========
let currentMonth = 2; // Март (0-11)
let currentYear = 2026;

function initCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    document.getElementById('currentMonthYear').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
    
    const works = [
        { day: 1, work: 'Внесение удобрений', type: 'spring' },
        { day: 5, work: 'Посев яровых', type: 'spring' },
        { day: 10, work: 'Посадка картофеля', type: 'spring' },
        { day: 15, work: 'Защита растений', type: 'spring' },
        { day: 20, work: 'Прополка', type: 'summer' },
        { day: 25, work: 'Полив', type: 'summer' },
        { day: 28, work: 'Обработка от вредителей', type: 'summer' }
    ];
    
    // Создаем календарь
    let calendarHtml = '';
    for (let i = 1; i <= 31; i++) {
        const dayWork = works.find(w => w.day === i);
        calendarHtml += `
            <div class="calendar-day ${dayWork ? 'has-work' : ''}" onclick="showDayWork(${i})">
                <span class="day-number">${i}</span>
                ${dayWork ? `<span class="day-work ${dayWork.type}">${dayWork.work}</span>` : ''}
            </div>
        `;
    }
    
    calendarGrid.innerHTML = calendarHtml;
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function showDayWork(day) {
    showNotification(`Работы на ${day} марта`, 'info');
}

function showAddEventModal() {
    showNotification('Форма добавления события', 'info');
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
    
    // Генерируем ответ бота
    setTimeout(() => {
        const response = generateBotResponse(message);
        addMessage(response, 'bot');
    }, 1000);
}

function generateBotResponse(message) {
    message = message.toLowerCase();
    
    if (message.includes('погода') || message.includes('температура')) {
        return `Сейчас в Брянске ${weatherData.current.temp}°C, ${weatherData.current.condition}. 
                Влажность ${weatherData.current.humidity}%, ветер ${weatherData.current.wind_speed} м/с.
                Рекомендации для полевых работ: ${weatherData.current.temp > 15 ? 'благоприятно' : 'прохладно'}.`;
    }
    
    if (message.includes('норма') || message.includes('высев')) {
        return 'Нормы высева основных культур:\n' +
               '• Пшеница: 200-250 кг/га\n' +
               '• Ячмень: 180-220 кг/га\n' +
               '• Кукуруза: 20-30 кг/га\n' +
               '• Подсолнечник: 5-8 кг/га\n\n' +
               'Точный расчет можно сделать в калькуляторе норм высева.';
    }
    
    if (message.includes('удобрение')) {
        return 'Рекомендации по удобрениям:\n' +
               '• Азотные: вносить весной\n' +
               '• Фосфорные: осенью под зябь\n' +
               '• Калийные: в зависимости от почвы\n\n' +
               'Используйте калькулятор удобрений для точного расчета.';
    }
    
    if (message.includes('болезнь') || message.includes
function generateBotResponse(message) {
    message = message.toLowerCase();
    
    if (message.includes('погода') || message.includes('температура')) {
        return `Сейчас в Брянске ${weatherData.current.temp}°C, ${weatherData.current.condition}. 
                Влажность ${weatherData.current.humidity}%, ветер ${weatherData.current.wind_speed} м/с.
                Рекомендации для полевых работ: ${weatherData.current.temp > 15 ? 'благоприятно' : 'прохладно'}.`;
    }
    
    if (message.includes('норма') || message.includes('высев')) {
        return 'Нормы высева основных культур:\n' +
               '• Пшеница: 200-250 кг/га\n' +
               '• Ячмень: 180-220 кг/га\n' +
               '• Кукуруза: 20-30 кг/га\n' +
               '• Подсолнечник: 5-8 кг/га\n\n' +
               'Точный расчет можно сделать в калькуляторе норм высева.';
    }
    
    if (message.includes('удобрение')) {
        return 'Рекомендации по удобрениям:\n' +
               '• Азотные: вносить весной\n' +
               '• Фосфорные: осенью под зябь\n' +
               '• Калийные: в зависимости от почвы\n\n' +
               'Используйте калькулятор удобрений для точного расчета.';
    }
    
    if (message.includes('болезнь') || message.includes('диагностика')) {
        return 'Для диагностики болезней растений:\n' +
               '1. Загрузите фото в разделе "Распознавание болезней"\n' +
               '2. Получите мгновенный анализ\n' +
               '3. Узнайте методы лечения\n\n' +
               'Или опишите симптомы подробнее.';
    }
    
    if (message.includes('цена') || message.includes('стоимость')) {
        const randomPrice = (Math.random() * 20 + 10).toFixed(2);
        return `Актуальные цены на сегодня:\n` +
               `• Пшеница: 15.20 ₽/кг\n` +
               `• Кукуруза: 14.50 ₽/кг\n` +
               `• Подсолнечник: 28.90 ₽/кг\n\n` +
               `Подробнее в разделе "Рыночные цены".`;
    }
    
    if (message.includes('привет') || message.includes('здравствуй')) {
        return 'Здравствуйте! Я ваш агро-помощник. Чем могу помочь?';
    }
    
    if (message.includes('спасибо')) {
        return 'Пожалуйста! Обращайтесь ещё 😊';
    }
    
    // Ответ по умолчанию
    return 'Я понял ваш вопрос. Для точного ответа рекомендую обратиться к разделам:\n' +
           '• База знаний\n' +
           '• Форум агрономов\n' +
           '• Калькуляторы\n\n' +
           'Или уточните вопрос.';
}

function addMessage(text, sender) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function quickQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

// ========== ВИРТУАЛЬНЫЙ ТУР ==========
function startVirtualTour(location) {
    showNotification(`Запуск виртуального тура: ${location}`, 'info');
    
    // Здесь можно интегрировать 3D/360 просмотр
    setTimeout(() => {
        showNotification('Виртуальный тур (в разработке)', 'warning');
    }, 1000);
}

// ========== СРАВНЕНИЕ КУЛЬТУР ==========
function compareCrops() {
    const crop1 = document.getElementById('compareCrop1').value;
    const crop2 = document.getElementById('compareCrop2').value;
    
    if (!crop1 || !crop2) {
        showNotification('Выберите обе культуры для сравнения', 'warning');
        return;
    }
    
    const cropsData = {
        'wheat': { name: 'Пшеница', yield: 45, price: 15, cost: 30, profitability: 125 },
        'barley': { name: 'Ячмень', yield: 40, price: 12, cost: 25, profitability: 92 },
        'corn': { name: 'Кукуруза', yield: 60, price: 14, cost: 35, profitability: 140 },
        'sunflower': { name: 'Подсолнечник', yield: 25, price: 28, cost: 40, profitability: 75 }
    };
    
    const data1 = cropsData[crop1];
    const data2 = cropsData[crop2];
    
    const comparisonHtml = `
        <div class="comparison-result">
            <h4>Сравнение: ${data1.name} vs ${data2.name}</h4>
            <table class="comparison-table">
                <tr>
                    <th>Показатель</th>
                    <th>${data1.name}</th>
                    <th>${data2.name}</th>
                    <th>Разница</th>
                </tr>
                <tr>
                    <td>Урожайность (ц/га)</td>
                    <td>${data1.yield}</td>
                    <td>${data2.yield}</td>
                    <td class="${data1.yield > data2.yield ? 'positive' : 'negative'}">
                        ${((data1.yield - data2.yield) / data2.yield * 100).toFixed(1)}%
                    </td>
                </tr>
                <tr>
                    <td>Цена (₽/кг)</td>
                    <td>${data1.price}</td>
                    <td>${data2.price}</td>
                    <td class="${data1.price > data2.price ? 'positive' : 'negative'}">
                        ${((data1.price - data2.price) / data2.price * 100).toFixed(1)}%
                    </td>
                </tr>
                <tr>
                    <td>Затраты (тыс.₽/га)</td>
                    <td>${data1.cost}</td>
                    <td>${data2.cost}</td>
                    <td class="${data1.cost < data2.cost ? 'positive' : 'negative'}">
                        ${((data1.cost - data2.cost) / data2.cost * 100).toFixed(1)}%
                    </td>
                </tr>
                <tr>
                    <td>Рентабельность (тыс.₽/га)</td>
                    <td>${data1.profitability}</td>
                    <td>${data2.profitability}</td>
                    <td class="${data1.profitability > data2.profitability ? 'positive' : 'negative'}">
                        ${((data1.profitability - data2.profitability) / data2.profitability * 100).toFixed(1)}%
                    </td>
                </tr>
            </table>
            <div class="recommendation">
                ${data1.profitability > data2.profitability 
                    ? `✅ Рекомендуется ${data1.name} (выше рентабельность на ${((data1.profitability - data2.profitability) / data2.profitability * 100).toFixed(1)}%)` 
                    : `✅ Рекомендуется ${data2.name} (выше рентабельность на ${((data2.profitability - data1.profitability) / data1.profitability * 100).toFixed(1)}%)`}
            </div>
        </div>
    `;
    
    // Показываем результат во всплывающем окне
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            ${comparisonHtml}
        </div>
    `;
    document.body.appendChild(modal);
}

// ========== ПОИСК ПО БАЗЕ ЗНАНИЙ ==========
function searchKnowledge() {
    const query = document.getElementById('knowledgeSearch').value.trim();
    if (!query) {
        showNotification('Введите поисковый запрос', 'warning');
        return;
    }
    
    showNotification(`Поиск: "${query}"`, 'info');
    
    // Имитация поиска
    setTimeout(() => {
        const results = [
            { title: 'Пшеница: технология возделывания', relevance: 95 },
            { title: 'Болезни пшеницы и их лечение', relevance: 87 },
            { title: 'Удобрения для озимой пшеницы', relevance: 82 },
            { title: 'Сроки посева яровой пшеницы', relevance: 78 }
        ];
        
        const resultsHtml = results.map(r => 
            `<div class="search-result" onclick="showArticle('${r.title}')">
                <strong>${r.title}</strong>
                <span>Релевантность: ${r.relevance}%</span>
            </div>`
        ).join('');
        
        showNotification(`Найдено ${results.length} статей`, 'success');
    }, 1500);
}

function showArticle(title) {
    showNotification(`Открыта статья: ${title}`, 'info');
}

// ========== БАЗА ЗНАНИЙ ==========
function showCropGuide() {
    showNotification('Справочник культур (загрузка...)', 'info');
    setTimeout(() => {
        alert(`СПРАВОЧНИК КУЛЬТУР\n\n` +
              `Основные культуры Брянской области:\n\n` +
              `1. Пшеница озимая\n` +
              `   - Срок сева: 25 августа - 15 сентября\n` +
              `   - Норма высева: 4-5 млн зерен/га\n` +
              `   - Уборка: июль\n\n` +
              `2. Ячмень яровой\n` +
              `   - Срок сева: апрель-май\n` +
              `   - Норма высева: 4-5 млн зерен/га\n` +
              `   - Уборка: август\n\n` +
              `3. Картофель\n` +
              `   - Посадка: май\n` +
              `   - Густота: 40-50 тыс/га\n` +
              `   - Уборка: август-сентябрь\n\n` +
              `4. Кукуруза\n` +
              `   - Посев: май\n` +
              `   - Густота: 60-80 тыс/га\n` +
              `   - Уборка: сентябрь-октябрь`);
    }, 500);
}

function showFertilizerGuide() {
    showNotification('Руководство по удобрениям', 'info');
    setTimeout(() => {
        alert(`РУКОВОДСТВО ПО УДОБРЕНИЯМ\n\n` +
              `Основные удобрения:\n\n` +
              `Азотные:\n` +
              `- Аммиачная селитра (N 34%)\n` +
              `  Норма: 100-200 кг/га\n` +
              `- Мочевина (N 46%)\n` +
              `  Норма: 80-150 кг/га\n\n` +
              `Фосфорные:\n` +
              `- Суперфосфат (P 20%)\n` +
              `  Норма: 150-300 кг/га\n\n` +
              `Калийные:\n` +
              `- Хлористый калий (K 60%)\n` +
              `  Норма: 100-200 кг/га\n\n` +
              `Комплексные:\n` +
              `- Нитроаммофоска (NPK 16:16:16)\n` +
              `  Норма: 200-400 кг/га`);
    }, 500);
}

function showPestGuide() {
    showNotification('Справочник вредителей', 'info');
    setTimeout(() => {
        alert(`СПРАВОЧНИК ВРЕДИТЕЛЕЙ\n\n` +
              `Основные вредители:\n\n` +
              `1. Колорадский жук\n` +
              `   - Поражает: картофель, томаты\n` +
              `   - Препараты: Корадо, Актара\n` +
              `   - Сроки обработки: при появлении личинок\n\n` +
              `2. Тля\n` +
              `   - Поражает: зерновые, овощные\n` +
              `   - Препараты: Биотлин, Фуфанон\n` +
              `   - Сроки: при появлении\n\n` +
              `3. Луговой мотылек\n` +
              `   - Поражает: кукурузу, подсолнечник\n` +
              `   - Препараты: Децис, Каратэ\n` +
              `   - Сроки: при массовом лете`);
    }, 500);
}

function showDiseaseGuide() {
    showNotification('Справочник болезней', 'info');
    setTimeout(() => {
        alert(`СПРАВОЧНИК БОЛЕЗНЕЙ\n\n` +
              `Основные болезни:\n\n` +
              `1. Фитофтороз\n` +
              `   - Поражает: картофель, томаты\n` +
              `   - Симптомы: бурые пятна на листьях\n` +
              `   - Лечение: Ридомил Голд, Акробат\n\n` +
              `2. Мучнистая роса\n` +
              `   - Поражает: зерновые, тыквенные\n` +
              `   - Симптомы: белый налет\n` +
              `   - Лечение: Топаз, Скор\n\n` +
              `3. Ржавчина\n` +
              `   - Поражает: зерновые\n` +
              `   - Симптомы: рыжие пятна\n` +
              `   - Лечение: Альто, Фалькон`);
    }, 500);
}

function showSoilGuide() {
    showNotification('Типы почв', 'info');
    setTimeout(() => {
        alert(`ТИПЫ ПОЧВ БРЯНСКОЙ ОБЛАСТИ\n\n` +
              `1. Дерново-подзолистые (45%)\n` +
              `   - Характеристика: кислые, низкое содержание гумуса\n` +
              `   - Улучшение: известкование, органические удобрения\n` +
              `   - Культуры: картофель, зерновые\n\n` +
              `2. Серые лесные (25%)\n` +
              `   - Характеристика: среднекислые, средний гумус\n` +
              `   - Улучшение: органика, минеральные удобрения\n` +
              `   - Культуры: пшеница, кукуруза\n\n` +
              `3. Торфяно-болотные (15%)\n` +
              `   - Характеристика: кислые, богаты органикой\n` +
              `   - Улучшение: пескование, фосфорные удобрения\n` +
              `   - Культуры: овощи, многолетние травы`);
    }, 500);
}

function showTechGuide() {
    showNotification('Техника и оборудование', 'info');
    setTimeout(() => {
        alert(`СЕЛЬХОЗТЕХНИКА\n\n` +
              `Популярная техника:\n\n` +
              `Тракторы:\n` +
              `- МТЗ-82: универсальный, 80 л.с.\n` +
              `- John Deere 8330: 330 л.с., для крупных хозяйств\n` +
              `- Кировец К-744: 350 л.с., для тяжелых работ\n\n` +
              `Комбайны:\n` +
              `- Acros 595: производительность 12 т/ч\n` +
              `- John Deere S780: производительность 20 т/ч\n\n` +
              `Почвообрабатывающая:\n` +
              `- Плуги ПЛН-3-35, ПЛН-5-35\n` +
              `- Бороны дисковые БДТ-3, БДТ-7\n` +
              `- Культиваторы КПС-4, КПС-8`);
    }, 500);
}

// ========== РАСЧЕТ ПРИБЫЛИ ==========
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
    
    showNotification(`Рентабельность: ${profitability}%`, 'success');
}

function formatMoney(amount) {
    return Math.round(amount).toLocaleString() + ' тыс. ₽';
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
    document.querySelectorAll('nav a, .footer-links a, .footer-section a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
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

// Клик вне модального окна для закрытия
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Простая имитация входа
    if (email && password) {
        currentUser = {
            id: 1,
            name: 'Пользователь',
            email: email
        };
        showNotification('Вход выполнен успешно!', 'success');
        closeModal('loginModal');
        updateUserInfo();
    } else {
        showNotification('Заполните все поля', 'error');
    }
}

function register(event) {
    event.preventDefault();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const agree = document.getElementById('agreeTerms').checked;
    
    if (!agree) {
        showNotification('Необходимо согласие с условиями', 'error');
        return;
    }
    
    if (password !== confirm) {
        showNotification('Пароли не совпадают!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    showNotification('Регистрация успешна!', 'success');
    closeModal('registerModal');
}

function updateUserInfo() {
    if (currentUser) {
        const userInfo = document.querySelector('.user-info h4');
        if (userInfo) {
            userInfo.textContent = currentUser.name;
        }
    }
}

// ========== ГРАФИКИ ==========
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
            }, {
                label: 'Овощи (тыс. т)',
                data: [120, 135, 148, 162, 175, 190],
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
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
            }, {
                label: 'Рекультивировано',
                data: [2, 3, 4, 5, 7, 9],
                backgroundColor: '#2196F3'
            }]
        },
        options: getChartOptions()
    });
}

function getChartOptions() {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f0f0f0' : '#333333';
    const gridColor = isDark ? '#444444' : '#e0e0e0';
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: gridColor,
                borderWidth: 1
            }
        },
        scales: {
            y: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor
                }
            },
            x: {
                grid: {
                    color: gridColor
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
    
    const charts = [
        productionChart,
        cropsChart,
        ecologyChart,
        yieldForecastChart,
        weatherImpactChart,
        soilChart,
        priceHistoryChart
    ];
    
    charts.forEach(chart => {
        if (chart) {
            chart.options = options;
            chart.update();
        }
    });
}

// ========== ЭКСПОРТ ВСЕХ ДАННЫХ ==========
function exportAllData() {
    const exportData = {
        exportDate: new Date().toISOString(),
        userMarkers: userMarkers,
        companies: companies,
        marketplaceItems: marketplaceItems,
        coopOffers: coopOffers,
        diagnosisHistory: diagnosisHistory,
        stats: {
            cleanZones: cleanPlacesData.length,
            dirtyZones: dirtyPlacesData.length,
            userMarkers: userMarkers.length,
            totalObjects: cleanPlacesData.length + dirtyPlacesData.length + userMarkers.length
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `agro_bryansk_export_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Все данные экспортированы', 'success');
}

// ========== СОХРАНЕНИЕ НАСТРОЕК ==========
function saveSettings() {
    const settings = {
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        notifications: true,
        autoRefresh: true,
        mapType: satelliteMode ? 'satellite' : 'street'
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showNotification('Настройки сохранены', 'success');
}

function loadSettings() {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            // Применяем настройки
            if (settings.theme === 'dark' && !document.body.classList.contains('dark-theme')) {
                toggleTheme();
            }
        } catch (e) {
            console.error('Ошибка загрузки настроек:', e);
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ==========
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем настройки
    loadSettings();
    
    // Инициализация всех компонентов
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
    initWeather();
    initMarketplace();
    initCooperation();
    loadCompanies();
    loadDiagnosisHistory();
    checkAchievements();
    startAutoRefresh();
    
    // Добавляем кнопку экспорта в футер
    addExportButton();
    
    console.log('Агро-Брянск портал успешно загружен!');
    console.log('Доступные функции: карта, экология, аналитика, погода, маркетплейс, кооперация, диагностика болезней, калькуляторы, форум, база знаний и многое другое!');
});

// ========== ДОБАВЛЕНИЕ КНОПКИ ЭКСПОРТА ==========
function addExportButton() {
    const footer = document.querySelector('.footer-bottom');
    if (footer) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-export-data';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Экспорт всех данных';
        exportBtn.onclick = exportAllData;
        exportBtn.style.marginTop = '10px';
        exportBtn.style.padding = '8px 16px';
        exportBtn.style.background = '#6b8e23';
        exportBtn.style.color = 'white';
        exportBtn.style.border = 'none';
        exportBtn.style.borderRadius = '5px';
        exportBtn.style.cursor = 'pointer';
        footer.appendChild(exportBtn);
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
window.setMarkerType = setMarkerType;
window.filterMarkers = filterMarkers;
window.deleteUserMarker = deleteUserMarker;
window.editUserMarker = editUserMarker;
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
window.showSoilGuide = showSoilGuide;
window.showTechGuide = showTechGuide;
window.calculateProfit = calculateProfit;
window.calculateSeedingRate = calculateSeedingRate;
window.calculateFertilizer = calculateFertilizer;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.quickQuestion = quickQuestion;
window.refreshWeather = refreshWeather;
window.toggleHeatMap = toggleHeatMap;
window.toggleSatellite = toggleSatellite;
window.measureDistance = measureDistance;
window.getCurrentLocation = getCurrentLocation;
window.addToRoute = addToRoute;
window.reportPollution = reportPollution;
window.filterMarketplace = filterMarketplace;
window.sortMarketplace = sortMarketplace;
window.contactSeller = contactSeller;
window.showProductDetails = showProductDetails;
window.showAddProductModal = showAddProductModal;
window.addProduct = addProduct;
window.showAddCompanyModal = showAddCompanyModal;
window.addCompany = addCompany;
window.showCompanyDetails = showCompanyDetails;
window.showCoopTab = showCoopTab;
window.joinCooperation = joinCooperation;
window.showAddCoopModal = showAddCoopModal;
window.identifyDisease = identifyDisease;
window.startVirtualTour = startVirtualTour;
window.compareCrops = compareCrops;
window.searchKnowledge = searchKnowledge;
window.showArticle = showArticle;
window.changeMonth = changeMonth;
window.showDayWork = showDayWork;
window.showAddEventModal = showAddEventModal;
window.refreshPrices = refreshPrices;
window.exportAllData = exportAllData;
window.saveSettings = saveSettings;
window.shareMarker = shareMarker;
