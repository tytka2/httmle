// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let cleanPlacesData = [];
let dirtyPlacesData = [];
let userMarkers = [];
let map = null;
let markerGroup = null;
let heatLayer = null;
let currentMarkerType = 'clean';
let currentUser = null;
let weatherData = null;
let marketplaceItems = [];
let diagnosisHistory = [];
let coopOffers = [];
let satelliteMode = false;
let distancePoints = [];
let distancePolyline = null;
let routePoints = [];

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
    initChatBot();
    initWeather();
    initMarketplace();
    initCooperation();
    loadDiagnosisHistory();
    initAchievements();
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

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadData() {
    try {
        showNotification('Загрузка данных...', 'info');
        
        const cleanResponse = await fetch('clean_places.json');
        cleanPlacesData = await cleanResponse.json();
        
        const dirtyResponse = await fetch('dirty_places.json');
        dirtyPlacesData = await dirtyResponse.json();
        
        const configResponse = await fetch('config.json');
        const config = await configResponse.json();
        
        loadUserMarkers();
        
        initMap();
        
        updateStats();
        
        displayPlaces();
        
        displayConfig(config);
        
        showNotification('Данные успешно загружены', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        loadTestData();
    }
}

function loadTestData() {
    cleanPlacesData = [
        { name: "Брянск — Центральный парк", lat: 53.2469, lon: 34.3649, note: "Низкая запыленность, хорошая вентиляция" },
        { name: "Нацпарк «Брянский лес»", lat: 52.5660, lon: 33.8360, note: "Водоохранная зона, низкая антропогенная нагрузка" }
    ];
    
    dirtyPlacesData = [
        { name: "Промзона г. Брянска (Бежицкий р-н)", lat: 53.2900, lon: 34.2900, severity: "высокая", pollutant: "PM10, NO₂" },
        { name: "Окружная трасса (южный участок)", lat: 53.2000, lon: 34.4500, severity: "средняя", pollutant: "PM2.5, NO₂" }
    ];
    
    initMap();
    updateStats();
    displayPlaces();
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
    if (map) {
        map.remove();
    }
    
    map = L.map('ecologyMap').setView([52.9, 33.4], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    markerGroup = L.layerGroup().addTo(map);
    
    addMarkersFromData();
    
    map.on('click', function(e) {
        addNewMarker(e.latlng);
    });
    
    L.control.scale().addTo(map);
}

function addMarkersFromData() {
    markerGroup.clearLayers();
    
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
    
    userMarkers.forEach(marker => {
        addUserMarkerToMap(marker);
    });
}

function createCustomIcon(emoji, type) {
    return L.divIcon({
        className: `custom-marker ${type}`,
        html: `<div class="marker-emoji">${emoji}</div>`,
        iconSize: [30, 30],
        popupAnchor: [0, -15]
    });
}

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
        date: new Date().toLocaleString()
    };
    
    userMarkers.push(newMarker);
    addUserMarkerToMap(newMarker);
    saveUserMarkers();
    updateUserMarkersList();
    updateStats();
    showNotification('Метка добавлена', 'success');
}

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
                    <i class="fas fa-edit"></i> Ред
                </button>
                <button onclick="deleteUserMarker(${marker.id})" class="popup-btn delete">
                    <i class="fas fa-trash"></i> Уд
                </button>
                <button onclick="shareMarker(${marker.id})" class="popup-btn share">
                    <i class="fas fa-share"></i> Под
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

function updateMarkerPosition(id, lat, lng) {
    const marker = userMarkers.find(m => m.id === id);
    if (marker) {
        marker.lat = lat;
        marker.lng = lng;
        saveUserMarkers();
        updateUserMarkersList();
    }
}

function deleteUserMarker(id) {
    if (confirm('Удалить эту метку?')) {
        userMarkers = userMarkers.filter(m => m.id !== id);
        
        markerGroup.clearLayers();
        addMarkersFromData();
        
        saveUserMarkers();
        updateUserMarkersList();
        updateStats();
        showNotification('Метка удалена', 'success');
    }
}

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
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    markerGroup.clearLayers();
    
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
    
    markerGroup.addTo(map);
}

// ========== ИЗМЕРЕНИЕ РАССТОЯНИЯ ==========
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
function addToRoute(lat, lng) {
    routePoints.push([lat, lng]);
    
    if (routePoints.length >= 2) {
        L.polyline(routePoints, {color: 'blue', weight: 5}).addTo(map);
        
        let total = 0;
        for (let i = 0; i < routePoints.length - 1; i++) {
            total += map.distance(
                L.latLng(routePoints[i][0], routePoints[i][1]),
                L.latLng(routePoints[i + 1][0], routePoints[i + 1][1])
            );
        }
        const totalDistance = (total / 1000).toFixed(2);
        
        showNotification(`Маршрут построен. Общая длина: ${totalDistance} км`, 'success');
        
        routePoints = [];
    } else {
        showNotification('Добавьте следующую точку маршрута', 'info');
    }
}

function reportPollution(placeName) {
    showNotification(`Сообщение об ухудшении отправлено по адресу: ${placeName}`, 'success');
}

// ========== СТАТИСТИКА ==========
function updateStats() {
    const statsContainer = document.getElementById('ecologyStats');
    if (!statsContainer) return;
    
    const total = cleanPlacesData.length + dirtyPlacesData.length;
    const cleanIndex = total ? Math.round((cleanPlacesData.length / total) * 100) : 0;
    
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
        </div>
        <div class="stat-card">
            <h4>Всего объектов</h4>
            <div class="stat-number">${total + userMarkers.length}</div>
        </div>
        <div class="stat-card">
            <h4>Пробы почвы</h4>
            <div class="stat-number">${userMarkers.filter(m => m.type === 'sampling').length}</div>
        </div>
        <div class="stat-card">
            <h4>Индекс чистоты</h4>
            <div class="stat-number">${cleanIndex}</div>
        </div>
    `;
    
    document.getElementById('cleanCount').textContent = cleanPlacesData.length;
    document.getElementById('dirtyCount').textContent = dirtyPlacesData.length;
    document.getElementById('userCount').textContent = userMarkers.length;
}

// ========== ОТОБРАЖЕНИЕ МЕСТ ==========
function displayPlaces() {
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
    
    updateUserMarkersList();
}

function flyToLocation(lat, lng) {
    map.flyTo([lat, lng], 12);
}

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
            <div class="place-actions">
                <button class="view-on-map" onclick="flyToLocation(${marker.lat}, ${marker.lng})">
                    <i class="fas fa-eye"></i> Показать
                </button>
                <button onclick="deleteUserMarker(${marker.id})" class="delete-btn">
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
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `markers_${Date.now()}.json`);
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
function initWeather() {
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
            gdd: 145,
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
    
    const weatherDays = document.getElementById('weatherDays');
    if (weatherDays) {
        weatherDays.innerHTML = weatherData.forecast.map(day => `
            <div class="weather-day">
                <div class="day-name">${day.day}</div>
                <div class="day-icon">${day.condition}</div>
                <div class="day-temp">${day.temp}°C</div>
                <div class="day-precip">${day.precipitation}%</div>
            </div>
        `).join('');
    }
    
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
        `;
    }
}

function displayAgroRecommendations() {
    const recommendations = document.getElementById('workRecommendations');
    if (!recommendations) return;
    
    const workList = [];
    
    if (weatherData.current.temp > 15 && weatherData.forecast[0].precipitation < 30) {
        workList.push('✅ Благоприятные условия для полевых работ');
        workList.push('🌱 Можно начинать посев яровых');
    } else if (weatherData.forecast[0].precipitation > 50) {
        workList.push('⚠️ Высокая влажность - отложите полевые работы');
        workList.push('📋 Планирование работ в помещении');
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
            description: '2022 г.в., наработка 500 м/ч',
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
            description: 'Урожай 2025, сорт "Гала"',
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
            description: 'Вспашка, культивация, дискование',
            phone: '+7 (900) 123-45-67',
            date: '2026-03-13',
            image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b9b?auto=format&fit=crop&w=200&q=80'
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
            filtered.sort(() => Math.random() - 0.5);
            break;
    }
    
    const grid = document.getElementById('marketplaceGrid');
    grid.innerHTML = filtered.map(item => `
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

function contactOwner(phone) {
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
            description: 'Ищем партнеров для оптовой закупки аммиачной селитры',
            participants: 3,
            needed: 5,
            price: 32,
            deadline: '2026-04-01',
            organizer: 'ИП Петров'
        },
        {
            id: 2,
            type: 'request',
            title: 'Требуется трактор с сеялкой',
            description: 'Для посева яровых на 50 га',
            period: 'Апрель 2026',
            budget: 'договорная',
            contact: 'Агрофирма "Рассвет"'
        },
        {
            id: 3,
            type: 'joint',
            title: 'Совместная переработка молока',
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
    
    showNotification('Анализ изображения...', 'info');
    
    setTimeout(() => {
        const diseases = [
            {
                name: 'Фитофтороз',
                probability: 0.87,
                description: 'Грибковое заболевание, поражает листья и плоды',
                treatment: 'Обработка препаратами Ридомил Голд, Акробат МЦ'
            },
            {
                name: 'Мучнистая роса',
                probability: 0.12,
                description: 'Появляется белый налет на листьях',
                treatment: 'Опрыскивание Топазом или серосодержащими препаратами'
            },
            {
                name: 'Септориоз',
                probability: 0.01,
                description: 'Бурые пятна на листьях',
                treatment: 'Фунгициды на основе пропиконазола'
            }
        ];
        
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
            <button onclick="addDiagnosisToHistory('${disease.name}')" class="btn-save-diagnosis">
                <i class="fas fa-save"></i> Сохранить
            </button>
        </div>
    `;
    
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
    
    const historyDiv = document.getElementById('diagnosisHistory');
    if (!historyDiv) return;
    
    if (diagnosisHistory.length === 0) {
        historyDiv.innerHTML = '<p class="no-history">История пуста</p>';
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
    
    const seedingRate = (desiredPlants * seedWeight) / (germination / 100) / 1000;
    
    const resultDiv = document.getElementById('seedingResult');
    resultDiv.innerHTML = `
        <h4>Результат:</h4>
        <div class="result-item">
            <span>Норма высева:</span>
            <span class="result-value">${seedingRate.toFixed(1)} кг/га</span>
        </div>
        <div class="result-item">
            <span>На 100 га:</span>
            <span class="result-value">${(seedingRate * 100 / 1000).toFixed(1)} т</span>
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
    
    const needN = (norms.N / fertilizerComposition.N * 100) || 0;
    const needP = (norms.P / fertilizerComposition.P * 100) || 0;
    const needK = (norms.K / fertilizerComposition.K * 100) || 0;
    
    const totalNeed = Math.max(needN, needP, needK) * area / 1000;
    
    const resultDiv = document.getElementById('fertilizerResult');
    resultDiv.innerHTML = `
        <h4>Результат:</h4>
        <div class="result-item">
            <span>Требуется удобрений:</span>
            <span class="result-value">${totalNeed.toFixed(1)} т</span>
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
                </tr>
                <tr>
                    <td>Урожайность (ц/га)</td>
                    <td>${data1.yield}</td>
                    <td>${data2.yield}</td>
                </tr>
                <tr>
                    <td>Цена (₽/кг)</td>
                    <td>${data1.price}</td>
                    <td>${data2.price}</td>
                </tr>
                <tr>
                    <td>Затраты (тыс.₽/га)</td>
                    <td>${data1.cost}</td>
                    <td>${data2.cost}</td>
                </tr>
                <tr>
                    <td>Рентабельность (тыс.₽/га)</td>
                    <td>${data1.profitability}</td>
                    <td>${data2.profitability}</td>
                </tr>
            </table>
            <div class="recommendation">
                ${data1.profitability > data2.profitability 
                    ? `✅ Рекомендуется ${data1.name}` 
                    : `✅ Рекомендуется ${data2.name}`}
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
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
}

// ========== БАЗА ЗНАНИЙ ==========
function showCropGuide() {
    alert(`СПРАВОЧНИК КУЛЬТУР\n\n` +
          `Пшеница:\n- Срок сева: 25 августа - 15 сентября\n- Норма высева: 200-250 кг/га\n- Уборка: июль\n\n` +
          `Ячмень:\n- Срок сева: апрель-май\n- Норма высева: 180-220 кг/га\n- Уборка: август\n\n` +
          `Картофель:\n- Посадка: май\n- Норма: 40-50 тыс/га\n- Уборка: август-сентябрь\n\n` +
          `Кукуруза:\n- Посев: май\n- Норма: 60-80 тыс/га\n- Уборка: сентябрь-октябрь`);
}

function showFertilizerGuide() {
    alert(`УДОБРЕНИЯ\n\n` +
          `Аммиачная селитра (N 34%):\n- Норма: 100-200 кг/га\n\n` +
          `Мочевина (N 46%):\n- Норма: 80-150 кг/га\n\n` +
          `Суперфосфат (P 20%):\n- Норма: 150-300 кг/га\n\n` +
          `Хлористый калий (K 60%):\n- Норма: 100-200 кг/га\n\n` +
          `Нитроаммофоска (NPK 16:16:16):\n- Норма: 200-400 кг/га`);
}

function showPestGuide() {
    alert(`ВРЕДИТЕЛИ\n\n` +
          `Колорадский жук:\n- Поражает: картофель, томаты\n- Препараты: Корадо, Актара\n\n` +
          `Тля:\n- Поражает: зерновые, овощные\n- Препараты: Биотлин, Фуфанон\n\n` +
          `Луговой мотылек:\n- Поражает: кукурузу, подсолнечник\n- Препараты: Децис, Каратэ`);
}

function showDiseaseGuide() {
    alert(`БОЛЕЗНИ\n\n` +
          `Фитофтороз:\n- Поражает: картофель, томаты\n- Симптомы: бурые пятна\n- Лечение: Ридомил Голд\n\n` +
          `Мучнистая роса:\n- Поражает: зерновые, тыквенные\n- Симптомы: белый налет\n- Лечение: Топаз, Скор\n\n` +
          `Ржавчина:\n- Поражает: зерновые\n- Симптомы: рыжие пятна\n- Лечение: Альто, Фалькон`);
}

function showSoilGuide() {
    alert(`ТИПЫ ПОЧВ БРЯНСКОЙ ОБЛАСТИ\n\n` +
          `Дерново-подзолистые (45%):\n- Характеристика: кислые, низкое содержание гумуса\n- Культуры: картофель, зерновые\n\n` +
          `Серые лесные (25%):\n- Характеристика: среднекислые, средний гумус\n- Культуры: пшеница, кукуруза\n\n` +
          `Торфяно-болотные (15%):\n- Характеристика: кислые, богаты органикой\n- Культуры: овощи, многолетние травы`);
}

function showTechGuide() {
    alert(`СЕЛЬХОЗТЕХНИКА\n\n` +
          `Тракторы:\n- МТЗ-82: универсальный, 80 л.с.\n- John Deere 8330: 330 л.с.\n- Кировец К-744: 350 л.с.\n\n` +
          `Комбайны:\n- Acros 595: 12 т/ч\n- John Deere S780: 20 т/ч\n\n` +
          `Почвообрабатывающая:\n- Плуги ПЛН-3-35, ПЛН-5-35\n- Бороны дисковые БДТ-3, БДТ-7`);
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
                backgroundColor: ['#6b8e23', '#2196F3', '#ff9800', '#9c27b0', '#f44336']
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
                    font: { size: 12 }
                }
            }
        },
        scales: {
            y: {
                grid: { color: gridColor },
                ticks: { color: textColor }
            },
            x: {
                grid: { color: gridColor },
                ticks: { color: textColor }
            }
        }
    };
}

function updateChartsTheme() {
    const options = getChartOptions();
    
    [productionChart, cropsChart, ecologyChart].forEach(chart => {
        if (chart) {
            chart.options = options;
            chart.update();
        }
    });
}

// ========== ФОРУМ ==========
function initForum() {
    const topicsList = document.getElementById('topicsList');
    if (!topicsList) return;
    
    const topics = [
        { title: 'Оптимальные сроки посева озимых', author: 'Иван Петров', replies: 12, lastActive: '2 часа назад' },
        { title: 'Борьба с колорадским жуком', author: 'Елена Смирнова', replies: 8, lastActive: '5 часов назад' },
        { title: 'Выбор удобрений для картофеля', author: 'Алексей Иванов', replies: 15, lastActive: 'вчера' },
        { title: 'Современные теплицы', author: 'Мария Сидорова', replies: 6, lastActive: 'вчера' }
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
    
    const activeUsers = document.getElementById('activeUsers');
    if (activeUsers) {
        activeUsers.innerHTML = `
            <div class="user-item"><i class="fas fa-user-circle"></i> Иван Петров (онлайн)</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Елена Смирнова (онлайн)</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Алексей Иванов (15 мин)</div>
            <div class="user-item"><i class="fas fa-user-circle"></i> Мария Сидорова (30 мин)</div>
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
            <td><strong>${item.product}</strong></td>
            <td class="price-value">${item.price}</td>
            <td class="${item.change.startsWith('+') ? 'price-up' : 'price-down'}">${item.change}</td>
            <td>${item.forecast}</td>
        </tr>
    `).join('');
}

// ========== КАЛЬКУЛЯТОР РЕНТАБЕЛЬНОСТИ ==========
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
    const totalYield = data.yield * area * 100;
    const income = totalYield * data.price / 1000;
    const totalCosts = costs * area / 1000;
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

// ========== ДОСТИЖЕНИЯ ==========
function initAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (!achievementsGrid) return;
    
    const achievements = [
        { name: 'Первооткрыватель', desc: 'Добавьте первую метку', icon: '🗺️', unlocked: userMarkers.length > 0 },
        { name: 'Исследователь', desc: 'Добавьте 10 меток', icon: '🔍', unlocked: userMarkers.length >= 10 },
        { name: 'Эколог', desc: 'Отметьте 5 чистых зон', icon: '🌿', unlocked: userMarkers.filter(m => m.type === 'clean').length >= 5 },
        { name: 'Активист', desc: 'Участвуйте в форуме', icon: '💬', unlocked: false },
        { name: 'Эксперт', desc: 'Получите 100 лайков', icon: '🏆', unlocked: false }
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
    
    addMessage(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const responses = [
            'Спасибо за вопрос! Я передам его специалисту.',
            'Информация по этому вопросу есть в базе знаний.',
            'Рекомендую обратиться к разделу "Удобрения".',
            'Сейчас проверю актуальные данные...'
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        addMessage(response, 'bot');
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

function quickQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

// ========== ВИРТУАЛЬНЫЙ ТУР ==========
function startVirtualTour(location) {
    showNotification(`Запуск виртуального тура: ${location}`, 'info');
    setTimeout(() => {
        showNotification('Виртуальный тур (в разработке)', 'warning');
    }, 1000);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initSmoothScroll() {
    document.querySelectorAll('nav a, .footer-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
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

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
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

// Глобальные функции
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
window.contactOwner = contactOwner;
window.showProductDetails = showProductDetails;
window.showAddProductModal = showAddProductModal;
window.addProduct = addProduct;
window.showCoopTab = showCoopTab;
window.joinCooperation = joinCooperation;
window.showAddCoopModal = showAddCoopModal;
window.identifyDisease = identifyDisease;
window.addDiagnosisToHistory = addDiagnosisToHistory;
window.startVirtualTour = startVirtualTour;
window.compareCrops = compareCrops;
window.searchKnowledge = searchKnowledge;
window.shareMarker = shareMarker;
