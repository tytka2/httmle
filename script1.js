// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let newsData = [];
let eventsData = [];
let popularNews = [];
let savedNews = JSON.parse(localStorage.getItem('savedNews')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || {};
let currentPage = 1;
let itemsPerPage = 6;
let currentCategory = 'all';
let currentDateFilter = 'all';
let currentNewsId = null;

// Категории новостей
const categories = {
    'technology': 'Технологии',
    'business': 'Бизнес',
    'science': 'Наука',
    'culture': 'Культура',
    'sports': 'Спорт'
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initData();
    initScrollToTop();
    initSmoothScroll();
    renderNews();
    renderEvents();
    renderPopularNews();
    renderArchive();
    updateCounts();
    updateSavedBadge();
    initChatBot();
    
    // Закрытие мобильного меню при клике на ссылку
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navContainer').classList.remove('active');
        });
    });
});

// ========== ИНИЦИАЛИЗАЦИЯ ДАННЫХ ==========
function initData() {
    // Новости
    newsData = [
        {
            id: 1,
            title: "Открытие нового технологического филиала",
            excerpt: "Мы рады сообщить об открытии нового филиала в центре города. Приглашаем всех на день открытых дверей, который состоится в ближайшую субботу.",
            date: "2026-02-15",
            category: "technology",
            image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            views: 1234,
            likes: 45,
            fullText: "Полный текст новости об открытии нового филиала..."
        },
        {
            id: 2,
            title: "Техническое обновление платформы",
            excerpt: "Завершено масштабное обновление нашей платформы. Теперь она работает быстрее и стабильнее, добавлены новые функции.",
            date: "2026-02-14",
            category: "technology",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            views: 987,
            likes: 32,
            fullText: "Полный текст новости о техническом обновлении..."
        },
        {
            id: 3,
            title: "Партнерство с ведущей IT-компанией",
            excerpt: "Мы заключили стратегическое партнерство с одной из ведущих компаний в нашей отрасли для совместного развития.",
            date: "2026-02-13",
            category: "business",
            image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            views: 756,
            likes: 28,
            fullText: "Полный текст новости о партнерстве..."
        },
        {
            id: 4,
            title: "Новые возможности для клиентов",
            excerpt: "Представляем новые возможности для наших клиентов, которые сделают работу с нами еще удобнее и эффективнее.",
            date: "2026-02-12",
            category: "business",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            views: 654,
            likes: 19,
            fullText: "Полный текст новости о новых возможностях..."
        },
        {
            id: 5,
            title: "Научная конференция по AI",
            excerpt: "Ведущие эксперты соберутся для обсуждения последних достижений в области искусственного интеллекта.",
            date: "2026-02-11",
            category: "science",
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
            views: 543,
            likes: 21,
            fullText: "Полный текст о научной конференции..."
        },
        {
            id: 6,
            title: "Культурный фестиваль в городе",
            excerpt: "Ежегодный фестиваль искусств пройдет в центре города с участием известных коллективов.",
            date: "2026-02-10",
            category: "culture",
            image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80",
            views: 432,
            likes: 15,
            fullText: "Полный текст о культурном фестивале..."
        }
    ];
    
    // Мероприятия
    eventsData = [
        {
            id: 1,
            title: "Конференция по инновациям",
            date: new Date(2026, 2, 20),
            time: "10:00 - 17:00",
            location: "Конференц-зал 'Столица'",
            description: "Ежегодная конференция, посвященная новейшим технологическим инновациям.",
            participants: 45
        },
        {
            id: 2,
            title: "Мастер-класс по веб-разработке",
            date: new Date(2026, 2, 25),
            time: "14:00 - 18:00",
            location: "IT-центр 'Прогресс'",
            description: "Практический мастер-класс по современным технологиям веб-разработки.",
            participants: 30
        },
        {
            id: 3,
            title: "Выставка современных технологий",
            date: new Date(2026, 3, 5),
            time: "09:00 - 20:00",
            location: "Выставочный комплекс 'Экспо'",
            description: "Крупнейшая выставка технологических достижений текущего года.",
            participants: 120
        },
        {
            id: 4,
            title: "Семинар по цифровому маркетингу",
            date: new Date(2026, 3, 12),
            time: "11:00 - 15:00",
            location: "Бизнес-центр 'Престиж'",
            description: "Семинар по современным трендам цифрового маркетинга.",
            participants: 25
        }
    ];
    
    // Популярные новости
    popularNews = [...newsData]
        .sort((a, b) => b.views - a.views)
        .slice(0, 4);
}

// ========== ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
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
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function toggleMobileMenu() {
    document.getElementById('navContainer').classList.toggle('active');
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
            if (targetId.startsWith('#')) {
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

// ========== ПОИСК ==========
function handleSearch(event) {
    if (event.key === 'Enter') {
        searchNews();
    }
}

function searchNews() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (query === '') {
        showNotification('Введите поисковый запрос', 'warning');
        return;
    }
    
    const results = newsData.filter(news => 
        news.title.toLowerCase().includes(query) || 
        news.excerpt.toLowerCase().includes(query)
    );
    
    if (results.length > 0) {
        showNotification(`Найдено ${results.length} новостей`, 'success');
        // Здесь можно отобразить результаты
    } else {
        showNotification('Ничего не найдено', 'info');
    }
}

// ========== ФИЛЬТРАЦИЯ ==========
function filterByCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderNews();
}

function filterByDate(filter) {
    currentDateFilter = filter;
    renderNews();
}

function getFilteredNews() {
    let filtered = [...newsData];
    
    // Фильтр по категории
    if (currentCategory !== 'all') {
        filtered = filtered.filter(news => news.category === currentCategory);
    }
    
    // Фильтр по дате
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (currentDateFilter === 'today') {
        filtered = filtered.filter(news => {
            const newsDate = new Date(news.date);
            return newsDate >= today;
        });
    } else if (currentDateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(news => {
            const newsDate = new Date(news.date);
            return newsDate >= weekAgo;
        });
    } else if (currentDateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(news => {
            const newsDate = new Date(news.date);
            return newsDate >= monthAgo;
        });
    } else if (currentDateFilter === 'year') {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filtered = filtered.filter(news => {
            const newsDate = new Date(news.date);
            return newsDate >= yearAgo;
        });
    }
    
    return filtered;
}

// ========== НОВОСТИ ==========
function renderNews() {
    const container = document.getElementById('news-container');
    const filteredNews = getFilteredNews();
    
    // Пагинация
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNews = filteredNews.slice(startIndex, endIndex);
    
    if (paginatedNews.length === 0) {
        container.innerHTML = '<p class="no-news">Новости не найдены</p>';
    } else {
        container.innerHTML = paginatedNews.map(news => `
            <div class="news-card" data-id="${news.id}">
                <img src="${news.image}" alt="${news.title}" class="news-image" loading="lazy">
                <span class="news-category">${categories[news.category]}</span>
                <div class="news-content">
                    <div class="news-date">
                        <i class="far fa-calendar-alt"></i> ${formatDate(news.date)}
                    </div>
                    <h3 class="news-title">${news.title}</h3>
                    <p class="news-excerpt">${news.excerpt}</p>
                    <div class="news-meta">
                        <span class="news-views">
                            <i class="far fa-eye"></i> ${news.views}
                        </span>
                        <div class="news-reactions">
                            <button class="reaction-btn ${isLiked(news.id) ? 'liked' : ''}" onclick="toggleLike(${news.id})">
                                <i class="${isLiked(news.id) ? 'fas' : 'far'} fa-heart"></i>
                                <span>${news.likes + (isLiked(news.id) ? 1 : 0)}</span>
                            </button>
                            <button class="reaction-btn" onclick="showComments(${news.id})">
                                <i class="far fa-comment"></i>
                                <span>${getCommentsCount(news.id)}</span>
                            </button>
                            <button class="reaction-btn ${isSaved(news.id) ? 'saved' : ''}" onclick="toggleSave(${news.id})">
                                <i class="${isSaved(news.id) ? 'fas' : 'far'} fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                    <a href="#" class="read-more" onclick="showNewsDetail(${news.id}); return false;">
                        Читать далее <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `).join('');
    }
    
    updatePagination(filteredNews.length);
    updateCounts();
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// ========== ПАГИНАЦИЯ ==========
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (totalPages <= 1) {
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    document.getElementById('pagination').style.display = 'flex';
    
    // Генерация номеров страниц
    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagesHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagesHtml += '<span class="page-dots">...</span>';
        }
    }
    pageNumbers.innerHTML = pagesHtml;
    
    // Состояние кнопок
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function goToPage(page) {
    currentPage = page;
    renderNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next') {
        const totalPages = Math.ceil(getFilteredNews().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
        }
    }
    renderNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== ЛАЙКИ ==========
let likedNews = JSON.parse(localStorage.getItem('likedNews')) || [];

function isLiked(newsId) {
    return likedNews.includes(newsId);
}

function toggleLike(newsId) {
    const news = newsData.find(n => n.id === newsId);
    if (!news) return;
    
    if (isLiked(newsId)) {
        likedNews = likedNews.filter(id => id !== newsId);
        news.likes--;
        showNotification('Лайк убран', 'info');
    } else {
        likedNews.push(newsId);
        news.likes++;
        showNotification('Новость понравилась', 'success');
    }
    
    localStorage.setItem('likedNews', JSON.stringify(likedNews));
    renderNews(); // Перерендериваем для обновления счетчика
}

// ========== СОХРАНЕНИЕ ==========
function isSaved(newsId) {
    return savedNews.includes(newsId);
}

function toggleSave(newsId) {
    if (isSaved(newsId)) {
        savedNews = savedNews.filter(id => id !== newsId);
        showNotification('Новость удалена из сохраненных', 'info');
    } else {
        savedNews.push(newsId);
        showNotification('Новость сохранена', 'success');
    }
    
    localStorage.setItem('savedNews', JSON.stringify(savedNews));
    updateSavedBadge();
    renderNews();
    
    // Если секция сохраненных открыта, обновляем ее
    if (document.getElementById('saved').style.display !== 'none') {
        renderSavedNews();
    }
}

function updateSavedBadge() {
    document.getElementById('savedBadge').textContent = savedNews.length;
}

function toggleSavedSection() {
    const savedSection = document.getElementById('saved');
    if (savedSection.style.display === 'none') {
        savedSection.style.display = 'block';
        renderSavedNews();
    } else {
        savedSection.style.display = 'none';
    }
}

function showSavedSection() {
    document.getElementById('saved').style.display = 'block';
    renderSavedNews();
    document.getElementById('saved').scrollIntoView({ behavior: 'smooth' });
}

function renderSavedNews() {
    const container = document.getElementById('saved-container');
    const savedNewsItems = newsData.filter(news => savedNews.includes(news.id));
    
    if (savedNewsItems.length === 0) {
        container.innerHTML = '<p class="no-news">Нет сохраненных новостей</p>';
    } else {
        container.innerHTML = savedNewsItems.map(news => `
            <div class="news-card">
                <img src="${news.image}" alt="${news.title}" class="news-image">
                <div class="news-content">
                    <h3 class="news-title">${news.title}</h3>
                    <p class="news-excerpt">${news.excerpt}</p>
                    <div class="news-meta">
                        <button class="reaction-btn saved" onclick="toggleSave(${news.id})">
                            <i class="fas fa-bookmark"></i> Удалить
                        </button>
                        <a href="#" class="read-more" onclick="showNewsDetail(${news.id}); return false;">
                            Читать
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('savedCount').textContent = savedNewsItems.length;
}

// ========== КОММЕНТАРИИ ==========
function getCommentsCount(newsId) {
    return comments[newsId] ? comments[newsId].length : 0;
}

function showComments(newsId) {
    currentNewsId = newsId;
    const modal = document.getElementById('commentsModal');
    const container = document.getElementById('commentsContainer');
    const newsComments = comments[newsId] || [];
    
    container.innerHTML = newsComments.map(comment => `
        <div class="comment-item">
            <div class="comment-author">
                <i class="fas fa-user-circle"></i>
                <strong>${comment.user}</strong>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `).join('');
    
    modal.classList.add('show');
}

function addComment() {
    if (!currentNewsId) return;
    
    const text = document.getElementById('commentText').value.trim();
    if (!text) {
        showNotification('Введите комментарий', 'warning');
        return;
    }
    
    if (!comments[currentNewsId]) {
        comments[currentNewsId] = [];
    }
    
    comments[currentNewsId].push({
        user: 'Гость',
        text: text,
        date: new Date().toLocaleString('ru-RU')
    });
    
    localStorage.setItem('comments', JSON.stringify(comments));
    
    document.getElementById('commentText').value = '';
    showComments(currentNewsId);
    showNotification('Комментарий добавлен', 'success');
    renderNews(); // Обновляем счетчик комментариев
}

function closeCommentsModal() {
    document.getElementById('commentsModal').classList.remove('show');
    currentNewsId = null;
}

// ========== ДЕТАЛИ НОВОСТИ ==========
function showNewsDetail(newsId) {
    const news = newsData.find(n => n.id === newsId);
    if (!news) return;
    
    // Увеличиваем просмотры
    news.views++;
    
    const modal = document.getElementById('newsModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <img src="${news.image}" alt="${news.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
        <h2>${news.title}</h2>
        <div style="display: flex; gap: 15px; margin: 15px 0; color: var(--text-color); opacity: 0.7;">
            <span><i class="far fa-calendar-alt"></i> ${formatDate(news.date)}</span>
            <span><i class="far fa-eye"></i> ${news.views}</span>
            <span><i class="far fa-heart"></i> ${news.likes}</span>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">${news.fullText}</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <button class="reaction-btn" onclick="toggleLike(${news.id}); closeModal();">
                <i class="${isLiked(news.id) ? 'fas' : 'far'} fa-heart"></i>
                ${isLiked(news.id) ? 'Убрать лайк' : 'Поставить лайк'}
            </button>
            <button class="reaction-btn" onclick="toggleSave(${news.id}); closeModal();">
                <i class="${isSaved(news.id) ? 'fas' : 'far'} fa-bookmark"></i>
                ${isSaved(news.id) ? 'Убрать из сохраненных' : 'Сохранить'}
            </button>
        </div>
    `;
    
    modal.classList.add('show');
    renderNews(); // Обновляем счетчики
}

function closeModal() {
    document.getElementById('newsModal').classList.remove('show');
}

// ========== МЕРОПРИЯТИЯ ==========
function renderEvents() {
    const container = document.getElementById('events-container');
    
    // Сортируем и фильтруем будущие мероприятия
    const currentDate = new Date();
    const futureEvents = eventsData
        .filter(event => event.date >= currentDate)
        .sort((a, b) => a.date - b.date);
    
    if (futureEvents.length === 0) {
        container.innerHTML = '<p class="no-events">На данный момент запланированных мероприятий нет.</p>';
        return;
    }
    
    container.innerHTML = futureEvents.map(event => {
        const formattedDate = formatEventDate(event.date);
        
        return `
            <div class="event-card">
                <div class="event-date">
                    <div class="event-day">${formattedDate.day}</div>
                    <div class="event-month">${formattedDate.month}</div>
                </div>
                <div class="event-content">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-time"><i class="far fa-clock"></i> ${event.time}</div>
                    <div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
                    <p style="font-size: 14px; margin: 10px 0; opacity: 0.8;">${event.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <span><i class="fas fa-users"></i> ${event.participants} участников</span>
                        <button class="event-register" onclick="registerForEvent(${event.id})">
                            Записаться
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('eventsCount').textContent = futureEvents.length;
}

function formatEventDate(date) {
    const months = [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];
    
    return {
        day: date.getDate(),
        month: months[date.getMonth()],
        year: date.getFullYear()
    };
}

function registerForEvent(eventId) {
    showNotification('Вы записаны на мероприятие!', 'success');
}

// ========== ПОПУЛЯРНЫЕ НОВОСТИ ==========
function renderPopularNews() {
    const container = document.getElementById('popular-container');
    
    container.innerHTML = popularNews.map(news => `
        <div class="popular-card" onclick="showNewsDetail(${news.id})">
            <h4>${news.title}</h4>
            <span class="views">
                <i class="fas fa-eye"></i> ${news.views}
            </span>
        </div>
    `).join('');
}

// ========== АРХИВ (КАЛЕНДАРЬ) ==========
function renderArchive() {
    const container = document.getElementById('archiveCalendar');
    
    // Группируем новости по месяцам
    const newsByMonth = {};
    newsData.forEach(news => {
        const date = new Date(news.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!newsByMonth[monthKey]) {
            newsByMonth[monthKey] = [];
        }
        newsByMonth[monthKey].push(news);
    });
    
    // Получаем последние 3 месяца
    const months = Object.keys(newsByMonth).sort().reverse().slice(0, 3);
    
    const monthsHtml = months.map(monthKey => {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month);
        const monthName = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
        
        // Создаем массив дней с индикацией наличия новостей
        let daysHtml = '';
        const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        
        // Заголовки дней недели
        weekdays.forEach(day => {
            daysHtml += `<div class="weekday">${day}</div>`;
        });
        
        // Пустые ячейки для первого дня месяца
        const firstDay = new Date(year, month, 1).getDay();
        const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < emptyDays; i++) {
            daysHtml += '<div class="calendar-day empty"></div>';
        }
        
        // Ячейки с днями
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasNews = newsData.some(n => n.date === dateStr);
            
            daysHtml += `
                <div class="calendar-day ${hasNews ? 'has-news' : ''}" 
                     onclick="${hasNews ? `showNewsForDate('${dateStr}')` : ''}">
                    ${day}
                </div>
            `;
        }
        
        return `
            <div class="calendar-month">
                <h3>${monthName}</h3>
                <div class="calendar-days">
                    ${daysHtml}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = monthsHtml || '<p>Архив пуст</p>';
}

function showNewsForDate(dateStr) {
    const newsOnDate = newsData.filter(n => n.date === dateStr);
    if (newsOnDate.length > 0) {
        showNotification(`Новостей за эту дату: ${newsOnDate.length}`, 'info');
        // Здесь можно показать список новостей за эту дату
    }
}

// ========== ПОДПИСКА ==========
function subscribeNewsletter(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    showNotification(`Спасибо за подписку! Письмо отправлено на ${email}`, 'success');
    event.target.reset();
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
    
    // Поиск в новостях
    setTimeout(() => {
        const lowerMessage = message.toLowerCase();
        const relevantNews = newsData.filter(news => 
            news.title.toLowerCase().includes(lowerMessage) || 
            news.excerpt.toLowerCase().includes(lowerMessage)
        );
        
        let response;
        if (relevantNews.length > 0) {
            response = `Нашел ${relevantNews.length} новостей по вашему запросу. Вот первые: ${relevantNews.slice(0, 3).map(n => n.title).join(', ')}`;
        } else {
            const responses = [
                'Извините, ничего не нашел по вашему запросу.',
                'Попробуйте спросить о других новостях или мероприятиях.',
                'Можете посмотреть популярные новости в соответствующем разделе.'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        }
        
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

// ========== СЧЕТЧИКИ ==========
function updateCounts() {
    document.getElementById('newsCount').textContent = getFilteredNews().length;
}

// ========== ЭКСПОРТ ФУНКЦИЙ ==========
window.toggleMobileMenu = toggleMobileMenu;
window.filterByCategory = filterByCategory;
window.filterByDate = filterByDate;
window.handleSearch = handleSearch;
window.searchNews = searchNews;
window.showNewsDetail = showNewsDetail;
window.closeModal = closeModal;
window.toggleLike = toggleLike;
window.toggleSave = toggleSave;
window.showComments = showComments;
window.addComment = addComment;
window.closeCommentsModal = closeCommentsModal;
window.registerForEvent = registerForEvent;
window.goToPage = goToPage;
window.changePage = changePage;
window.toggleSavedSection = toggleSavedSection;
window.showSavedSection = showSavedSection;
window.subscribeNewsletter = subscribeNewsletter;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.scrollToTop = scrollToTop;
