// Функция для переключения темы
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
}

// Глобальные переменные
let cleanPlacesData = [];
let dirtyPlacesData = [];
let userMarkers = [];
let map = null;
let markerGroup = null;
let currentMarkerType = 'observation';
let userMarkerCounter = 0;

// ========== ЗАГРУЗКА ДАННЫХ ==========

async function loadCleanPlaces() {
    try {
        const response = await fetch('clean_places.json');
        cleanPlacesData = await response.json();
        return cleanPlacesData;
    } catch (error) {
        console.error('Ошибка загрузки данных о чистых местах:', error);
        return [];
    }
}

async function loadDirtyPlaces() {
    try {
        const response = await fetch('dirty_places.json');
        dirtyPlacesData = await response.json();
        return dirtyPlacesData;
    } catch (error) {
        console.error('Ошибка загрузки данных о загрязненных местах:', error);
        return [];
    }
}

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('Ошибка загрузки конфигурации:', error);
        return null;
    }
}

// ========== РАБОТА С ПОЛЬЗОВАТЕЛЬСКИМИ МЕТКАМИ ==========

function saveUserMarkers() {
    const markersToSave = userMarkers.map(marker => ({
        id: marker.id,
        lat: marker.lat,
        lng: marker.lng,
        type: marker.type,
        title: marker.title,
        description: marker.description,
        date: marker.date
    }));
    localStorage.setItem('userMarkers', JSON.stringify(markersToSave));
}

function loadUserMarkers() {
    const saved = localStorage.getItem('userMarkers');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка загрузки сохраненных меток:', e);
        }
    }
    return [];
}

function getUserMarkerIcon(type) {
    const icons = {
        observation: L.divIcon({
            className: 'user-marker observation',
            html: '🔍',
            iconSize: [30, 30]
        }),
        problem: L.divIcon({
            className: 'user-marker problem',
            html: '⚠️',
            iconSize: [30, 30]
        }),
        clean: L.divIcon({
            className: 'user-marker clean',
            html: '🌿',
            iconSize: [30, 30]
        }),
        dirty: L.divIcon({
            className: 'user-marker dirty',
            html: '🏭',
            iconSize: [30, 30]
        })
    };
    
    return icons[type] || icons.observation;
}

function getMarkerTypeName(type) {
    const types = {
        observation: 'Наблюдение',
        problem: 'Проблемная зона',
        clean: 'Чистая зона',
        dirty: 'Загрязненная зона'
    };
    return types[type] || type;
}

function getMarkerIcon(type) {
    const icons = {
        observation: '🔍',
        problem: '⚠️',
        clean: '🌿',
        dirty: '🏭'
    };
    return icons[type] || '📍';
}

function createMarkerPopupContent(marker) {
    return `
        <div class="marker-popup">
            <h4>${marker.title}</h4>
            <p><strong>Тип:</strong> ${getMarkerTypeName(marker.type)}</p>
            <p><strong>Описание:</strong> ${marker.description}</p>
            <p><strong>Дата:</strong> ${marker.date}</p>
            <p><strong>Координаты:</strong> ${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</p>
            <div class="popup-buttons">
                <button onclick="editMarker('${marker.id}')" class="popup-btn edit">✏️ Редактировать</button>
                <button onclick="deleteMarker('${marker.id}')" class="popup-btn delete">🗑️ Удалить</button>
            </div>
        </div>
    `;
}

function addUserMarker(lat, lng, type, title, description) {
    const markerId = 'user_' + Date.now() + '_' + (userMarkerCounter++);
    const newMarker = {
        id: markerId,
        lat: lat,
        lng: lng,
        type: type,
        title: title || `Метка ${userMarkerCounter}`,
        description: description || 'Пользовательская метка',
        date: new Date().toLocaleString()
    };
    
    userMarkers.push(newMarker);
    
    if (map && markerGroup) {
        const icon = getUserMarkerIcon(type);
        const marker = L.marker([lat, lng], { icon: icon, draggable: true }).addTo(markerGroup);
        
        const popupContent = createMarkerPopupContent(newMarker);
        marker.bindPopup(popupContent);
        
        marker.on('dragend', function(e) {
            const newPos = e.target.getLatLng();
            updateMarkerPosition(markerId, newPos.lat, newPos.lng);
        });
        
        newMarker.leafletMarker = marker;
    }
    
    saveUserMarkers();
    updateMarkersList();
    updateStatistics();
    return newMarker;
}

function updateMarkerPosition(markerId, newLat, newLng) {
    const marker = userMarkers.find(m => m.id === markerId);
    if (marker) {
        marker.lat = newLat;
        marker.lng = newLng;
        saveUserMarkers();
        updateMarkersList();
    }
}

function deleteMarker(markerId) {
    if (confirm('Удалить эту метку?')) {
        const index = userMarkers.findIndex(m => m.id === markerId);
        if (index !== -1) {
            if (userMarkers[index].leafletMarker) {
                markerGroup.removeLayer(userMarkers[index].leafletMarker);
            }
            userMarkers.splice(index, 1);
            saveUserMarkers();
            updateMarkersList();
            updateStatistics();
        }
    }
}

function editMarker(markerId) {
    const marker = userMarkers.find(m => m.id === markerId);
    if (marker && marker.leafletMarker) {
        marker.leafletMarker.closePopup();
        showEditMarkerForm(marker);
    }
}

function showEditMarkerForm(marker) {
    const formHTML = `
        <div class="edit-marker-form" id="edit-form-${marker.id}">
            <h4>Редактирование метки</h4>
            <input type="text" id="edit-title-${marker.id}" value="${marker.title}" placeholder="Название">
            <select id="edit-type-${marker.id}">
                <option value="observation" ${marker.type === 'observation' ? 'selected' : ''}>Наблюдение</option>
                <option value="problem" ${marker.type === 'problem' ? 'selected' : ''}>Проблемная зона</option>
                <option value="clean" ${marker.type === 'clean' ? 'selected' : ''}>Чистая зона</option>
                <option value="dirty" ${marker.type === 'dirty' ? 'selected' : ''}>Загрязненная зона</option>
            </select>
            <textarea id="edit-desc-${marker.id}" placeholder="Описание">${marker.description}</textarea>
            <div class="form-buttons">
                <button onclick="saveMarkerEdit('${marker.id}')" class="form-btn save">Сохранить</button>
                <button onclick="cancelEdit('${marker.id}')" class="form-btn cancel">Отмена</button>
            </div>
        </div>
    `;
    
    if (marker.leafletMarker) {
        marker.leafletMarker.setPopupContent(formHTML);
        marker.leafletMarker.openPopup();
    }
}

function saveMarkerEdit(markerId) {
    const marker = userMarkers.find(m => m.id === markerId);
    if (marker) {
        const newTitle = document.getElementById(`edit-title-${markerId}`).value;
        const newType = document.getElementById(`edit-type-${markerId}`).value;
        const newDesc = document.getElementById(`edit-desc-${markerId}`).value;
        
        marker.title = newTitle || marker.title;
        marker.type = newType;
        marker.description = newDesc || marker.description;
        
        if (marker.leafletMarker) {
            marker.leafletMarker.setIcon(getUserMarkerIcon(newType));
        }
        
        saveUserMarkers();
        updateMarkersList();
        updateStatistics();
        
        if (marker.leafletMarker) {
            marker.leafletMarker.setPopupContent(createMarkerPopupContent(marker));
            marker.leafletMarker.closePopup();
        }
    }
}

function cancelEdit(markerId) {
    const marker = userMarkers.find(m => m.id === markerId);
    if (marker && marker.leafletMarker) {
        marker.leafletMarker.setPopupContent(createMarkerPopupContent(marker));
        marker.leafletMarker.closePopup();
    }
}

function focusMarker(markerId) {
    const marker = userMarkers.find(m => m.id === markerId);
    if (marker && map && marker.leafletMarker) {
        map.setView([marker.lat, marker.lng], 12);
        marker.leafletMarker.openPopup();
    }
}

function setMarkerType(type) {
    currentMarkerType = type;
    
    document.querySelectorAll('.marker-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
}

function exportMarkers() {
    const data = {
        markers: userMarkers.map(m => ({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            type: m.type,
            title: m.title,
            description: m.description,
            date: m.date
        })),
        exportDate: new Date().toLocaleString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markers_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
                const data = JSON.parse(e.target.result);
                if (data.markers && Array.isArray(data.markers)) {
                    data.markers.forEach(markerData => {
                        addUserMarker(
                            markerData.lat,
                            markerData.lng,
                            markerData.type || 'observation',
                            markerData.title || 'Импортированная метка',
                            markerData.description || ''
                        );
                    });
                    alert(`Импортировано ${data.markers.length} меток`);
                }
            } catch (error) {
                alert('Ошибка при импорте файла');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllMarkers() {
    if (confirm('Удалить все пользовательские метки?')) {
        userMarkers.forEach(marker => {
            if (marker.leafletMarker) {
                markerGroup.removeLayer(marker.leafletMarker);
            }
        });
        
        userMarkers = [];
        saveUserMarkers();
        updateMarkersList();
        updateStatistics();
    }
}

function updateMarkersList() {
    const markersList = document.getElementById('user-markers-list');
    if (!markersList) return;
    
    if (userMarkers.length === 0) {
        markersList.innerHTML = '<p class="no-markers">Нет пользовательских меток</p>';
        return;
    }
    
    markersList.innerHTML = userMarkers.map(marker => `
        <div class="marker-list-item" data-type="${marker.type}">
            <div class="marker-list-icon">${getMarkerIcon(marker.type)}</div>
            <div class="marker-list-info">
                <h5>${marker.title}</h5>
                <p>${marker.description}</p>
                <small>${marker.date}</small>
            </div>
            <div class="marker-list-actions">
                <button onclick="focusMarker('${marker.id}')" class="marker-btn focus" title="Показать на карте">👁️</button>
                <button onclick="editMarker('${marker.id}')" class="marker-btn edit" title="Редактировать">✏️</button>
                <button onclick="deleteMarker('${marker.id}')" class="marker-btn delete" title="Удалить">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ========== ОТОБРАЖЕНИЕ ДАННЫХ ==========

function createStatistics(cleanPlaces, dirtyPlaces) {
    const statsHTML = `
        <div class="ecology-stats">
            <div class="stat-card">
                <h4>Чистые зоны</h4>
                <p class="stat-number">${cleanPlaces.length}</p>
            </div>
            <div class="stat-card">
                <h4>Зоны риска</h4>
                <p class="stat-number">${dirtyPlaces.length}</p>
            </div>
            <div class="stat-card">
                <h4>Метки пользователей</h4>
                <p class="stat-number">${userMarkers.length}</p>
            </div>
        </div>
    `;
    
    return statsHTML;
}

function updateStatistics() {
    const statsContainer = document.querySelector('.ecology-stats');
    if (statsContainer) {
        const userStat = statsContainer.querySelector('.stat-card:last-child .stat-number');
        if (userStat) {
            userStat.textContent = userMarkers.length;
        }
    }
}

function renderCleanPlaces(places) {
    if (!places || places.length === 0) return '';
    
    return `
        <div class="places-grid" id="clean-places-grid">
            ${places.map(place => `
                <div class="place-card clean-place">
                    <h4>${place.name}</h4>
                    <p><strong>Координаты:</strong> ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
                    <p><strong>Особенности:</strong> ${place.note}</p>
                    <div class="place-badge clean">Чистая зона</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDirtyPlaces(places) {
    if (!places || places.length === 0) return '';
    
    return `
        <div class="places-grid" id="dirty-places-grid">
            ${places.map(place => `
                <div class="place-card dirty-place">
                    <h4>${place.name}</h4>
                    <p><strong>Координаты:</strong> ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
                    <p><strong>Степень загрязнения:</strong> 
                        <span class="severity ${place.severity}">${place.severity}</span>
                    </p>
                    <p><strong>Загрязнители:</strong> ${place.pollutant}</p>
                    <div class="place-badge dirty">Зона риска</div>
                </div>
            `).join('')}
        </div>
    `;
}

function createMarkerControlPanel() {
    return `
        <div class="marker-control-panel">
            <h4>Добавить метку</h4>
            <div class="marker-type-selector">
                <button class="marker-type-btn active" data-type="observation" onclick="setMarkerType('observation')">
                    <span>🔍</span> Наблюдение
                </button>
                <button class="marker-type-btn" data-type="problem" onclick="setMarkerType('problem')">
                    <span>⚠️</span> Проблема
                </button>
                <button class="marker-type-btn" data-type="clean" onclick="setMarkerType('clean')">
                    <span>🌿</span> Чистая зона
                </button>
                <button class="marker-type-btn" data-type="dirty" onclick="setMarkerType('dirty')">
                    <span>🏭</span> Загрязнение
                </button>
            </div>
            <p class="marker-instruction">👆 Кликните на карту, чтобы добавить метку</p>
            <div class="marker-list-container">
                <h4>Мои метки</h4>
                <div id="user-markers-list" class="user-markers-list">
                    <p class="no-markers">Нет пользовательских меток</p>
                </div>
            </div>
            <button onclick="exportMarkers()" class="export-btn">📥 Экспорт меток</button>
            <button onclick="importMarkers()" class="import-btn">📤 Импорт меток</button>
            <button onclick="clearAllMarkers()" class="clear-btn">🗑️ Очистить все</button>
        </div>
    `;
}

function createEcologyMap(cleanPlaces, dirtyPlaces) {
    const ecologyContainer = document.getElementById('ecology-data-container');
    
    const mapWrapper = document.createElement('div');
    mapWrapper.className = 'map-wrapper';
    mapWrapper.innerHTML = `
        <div class="map-container">
            <div id="ecology-map" style="height: 500px;"></div>
        </div>
        <div class="map-controls">
            ${createMarkerControlPanel()}
        </div>
    `;
    
    ecologyContainer.appendChild(mapWrapper);
    
    map = L.map('ecology-map').setView([52.9, 33.4], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    markerGroup = L.layerGroup().addTo(map);
    
    cleanPlaces.forEach(place => {
        const marker = L.marker([place.lat, place.lon], {
            icon: L.divIcon({
                className: 'clean-marker',
                html: '🌿',
                iconSize: [30, 30]
            })
        }).addTo(markerGroup);
        
        marker.bindPopup(`
            <b>${place.name}</b><br>
            <span style="color: green;">✓ Чистая зона</span><br>
            ${place.note}
        `);
    });
    
    dirtyPlaces.forEach(place => {
        const marker = L.marker([place.lat, place.lon], {
            icon: L.divIcon({
                className: 'dirty-marker',
                html: '⚠️',
                iconSize: [30, 30]
            })
        }).addTo(markerGroup);
        
        marker.bindPopup(`
            <b>${place.name}</b><br>
            <span style="color: red;">⚠ Загрязненная зона</span><br>
            <b>Степень:</b> ${place.severity}<br>
            <b>Загрязнители:</b> ${place.pollutant}
        `);
    });
    
    const savedMarkers = loadUserMarkers();
    savedMarkers.forEach(markerData => {
        const icon = getUserMarkerIcon(markerData.type);
        const marker = L.marker([markerData.lat, markerData.lng], { 
            icon: icon, 
            draggable: true 
        }).addTo(markerGroup);
        
        const fullMarker = {
            ...markerData,
            leafletMarker: marker
        };
        
        marker.bindPopup(createMarkerPopupContent(fullMarker));
        
        marker.on('dragend', function(e) {
            const newPos = e.target.getLatLng();
            updateMarkerPosition(markerData.id, newPos.lat, newPos.lng);
        });
        
        userMarkers.push(fullMarker);
    });
    
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        
        const title = prompt('Введите название метки:', `Метка ${userMarkers.length + 1}`);
        if (title !== null) {
            const description = prompt('Введите описание метки:', '');
            addUserMarker(lat, lng, currentMarkerType, title, description || '');
        }
    });
    
    updateMarkersList();
}

function addFilterButtons(container) {
    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter-buttons';
    filterDiv.innerHTML = `
        <button class="filter-btn active" onclick="filterPlaces('all')">Все места</button>
        <button class="filter-btn" onclick="filterPlaces('clean')">Чистые зоны</button>
        <button class="filter-btn" onclick="filterPlaces('dirty')">Зоны риска</button>
        <button class="filter-btn" onclick="filterPlaces('user')">Мои метки</button>
    `;
    
    container.appendChild(filterDiv);
}

function filterPlaces(type) {
    const cleanGrid = document.getElementById('clean-places-grid');
    const dirtyGrid = document.getElementById('dirty-places-grid');
    const cleanSubtitle = document.getElementById('clean-subtitle');
    const dirtySubtitle = document.getElementById('dirty-subtitle');
    const mapWrapper = document.querySelector('.map-wrapper');
    
    if (!cleanGrid || !dirtyGrid) return;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (type === 'all') {
        cleanGrid.style.display = 'grid';
        dirtyGrid.style.display = 'grid';
        if (cleanSubtitle) cleanSubtitle.style.display = 'block';
        if (dirtySubtitle) dirtySubtitle.style.display = 'block';
        if (mapWrapper) mapWrapper.style.display = 'grid';
    } else if (type === 'clean') {
        cleanGrid.style.display = 'grid';
        dirtyGrid.style.display = 'none';
        if (cleanSubtitle) cleanSubtitle.style.display = 'block';
        if (dirtySubtitle) dirtySubtitle.style.display = 'none';
        if (mapWrapper) mapWrapper.style.display = 'none';
    } else if (type === 'dirty') {
        cleanGrid.style.display = 'none';
        dirtyGrid.style.display = 'grid';
        if (cleanSubtitle) cleanSubtitle.style.display = 'none';
        if (dirtySubtitle) dirtySubtitle.style.display = 'block';
        if (mapWrapper) mapWrapper.style.display = 'none';
    } else if (type === 'user') {
        cleanGrid.style.display = 'none';
        dirtyGrid.style.display = 'none';
        if (cleanSubtitle) cleanSubtitle.style.display = 'none';
        if (dirtySubtitle) dirtySubtitle.style.display = 'none';
        if (mapWrapper) mapWrapper.style.display = 'grid';
    }
}

// ========== ОСНОВНАЯ ФУНКЦИЯ ==========

async function displayEcologyData() {
    const ecologyContainer = document.getElementById('ecology-data-container');
    ecologyContainer.innerHTML = '';
    
    const [cleanPlaces, dirtyPlaces, config] = await Promise.all([
        loadCleanPlaces(),
        loadDirtyPlaces(),
        loadConfig()
    ]);
    
    ecologyContainer.innerHTML += createStatistics(cleanPlaces, dirtyPlaces);
    
    addFilterButtons(ecologyContainer);
    
    const cleanSubtitle = document.createElement('h3');
    cleanSubtitle.id = 'clean-subtitle';
    cleanSubtitle.className = 'section-subtitle';
    cleanSubtitle.textContent = '🌿 Экологически чистые места';
    ecologyContainer.appendChild(cleanSubtitle);
    
    ecologyContainer.innerHTML += renderCleanPlaces(cleanPlaces);
    
    const dirtySubtitle = document.createElement('h3');
    dirtySubtitle.id = 'dirty-subtitle';
    dirtySubtitle.className = 'section-subtitle';
    dirtySubtitle.textContent = '⚠️ Зоны с повышенной антропогенной нагрузкой';
    ecologyContainer.appendChild(dirtySubtitle);
    
    ecologyContainer.innerHTML += renderDirtyPlaces(dirtyPlaces);
    
    createEcologyMap(cleanPlaces, dirtyPlaces);
    
    if (config) {
        const refreshInfo = document.createElement('div');
        refreshInfo.className = 'refresh-info';
        refreshInfo.innerHTML = `
            <p>🔄 Данные обновляются каждые ${config.refreshMinutes} минут</p>
            <p>📍 Город для мониторинга: ${config.air.openAqCity}</p>
        `;
        ecologyContainer.appendChild(refreshInfo);
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
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
    
    displayEcologyData();
});

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========

window.filterPlaces = filterPlaces;
window.setMarkerType = setMarkerType;
window.addUserMarker = addUserMarker;
window.deleteMarker = deleteMarker;
window.editMarker = editMarker;
window.focusMarker = focusMarker;
window.saveMarkerEdit = saveMarkerEdit;
window.cancelEdit = cancelEdit;
window.exportMarkers = exportMarkers;
window.importMarkers = importMarkers;
window.clearAllMarkers = clearAllMarkers;
