// Данные новостей
const newsData = [
    {
        id: 1,
        title: "Открытие нового филиала",
        excerpt: "Мы рады сообщить об открытии нового филиала в центре города. Приглашаем всех на день открытых дверей, который состоится в ближайшую субботу.",
        date: "15 октября 2023",
        image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        fullText: "Полный текст новости об открытии нового филиала..."
    },
    {
        id: 2,
        title: "Техническое обновление платформы",
        excerpt: "Завершено масштабное обновление нашей платформы. Теперь она работает быстрее и стабильнее, добавлены новые функции.",
        date: "10 октября 2023",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        fullText: "Полный текст новости о техническом обновлении..."
    },
    {
        id: 3,
        title: "Партнерство с ведущей компанией",
        excerpt: "Мы заключили стратегическое партнерство с одной из ведущих компаний в нашей отрасли для совместного развития.",
        date: "5 октября 2023",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        fullText: "Полный текст новости о партнерстве..."
    },
    {
        id: 4,
        title: "Новые возможности для клиентов",
        excerpt: "Представляем новые возможности для наших клиентов, которые сделают работу с нами еще удобнее и эффективнее.",
        date: "1 октября 2023",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        fullText: "Полный текст новости о новых возможностях..."
    }
];

// Данные мероприятий
const eventsData = [
    {
        id: 1,
        title: "Конференция по инновациям",
        date: new Date(2023, 9, 20),
        time: "10:00 - 17:00",
        location: "Конференц-зал 'Столица'",
        description: "Ежегодная конференция, посвященная новейшим технологическим инновациям и трендам в отрасли."
    },
    {
        id: 2,
        title: "Мастер-класс по веб-разработке",
        date: new Date(2023, 9, 25),
        time: "14:00 - 18:00",
        location: "IT-центр 'Прогресс'",
        description: "Практический мастер-класс по современным технологиям веб-разработки для начинающих и опытных разработчиков."
    },
    {
        id: 3,
        title: "Выставка современных технологий",
        date: new Date(2023, 10, 5),
        time: "09:00 - 20:00",
        location: "Выставочный комплекс 'Экспо'",
        description: "Крупнейшая выставка технологических достижений текущего года с участием ведущих компаний."
    },
    {
        id: 4,
        title: "Семинар по маркетингу",
        date: new Date(2023, 10, 12),
        time: "11:00 - 15:00",
        location: "Бизнес-центр 'Престиж'",
        description: "Семинар по современным трендам цифрового маркетинга и стратегиям продвижения."
    }
];

// Функция для форматирования даты мероприятия
function formatEventDate(date) {
    const months = [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];
    
    return {
        day: date.getDate(),
        month: months[date.getMonth()],
        year: date.getFullYear(),
        fullDate: date.toLocaleDateString('ru-RU')
    };
}

// Функция для отображения новостей
function renderNews() {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';
    
    newsData.forEach(news => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        
        newsCard.innerHTML = `
            <img src="${news.image}" alt="${news.title}" class="news-image">
            <div class="news-content">
                <div class="news-date">${news.date}</div>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                <a href="#" class="read-more" onclick="showNewsDetail(${news.id}); return false;">Читать далее</a>
            </div>
        `;
        
        newsContainer.appendChild(newsCard);
    });
}

// Функция для отображения мероприятий
function renderEvents() {
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = '';
    
    // Сортируем мероприятия по дате
    const sortedEvents = [...eventsData].sort((a, b) => a.date - b.date);
    
    // Фильтруем только будущие мероприятия
    const currentDate = new Date();
    const futureEvents = sortedEvents.filter(event => event.date >= currentDate);
    
    if (futureEvents.length === 0) {
        eventsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; opacity: 0.7;">На данный момент запланированных мероприятий нет.</p>';
        return;
    }
    
    futureEvents.forEach(event => {
        const formattedDate = formatEventDate(event.date);
        
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        eventCard.innerHTML = `
            <div class="event-date">
                <div class="event-day">${formattedDate.day}</div>
                <div class="event-month">${formattedDate.month}</div>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-time">${event.time}</div>
                <div class="event-location">${event.location}</div>
                <a href="#" class="read-more" onclick="showEventDetail(${event.id}); return false;">Подробнее</a>
            </div>
        `;
        
        eventsContainer.appendChild(eventCard);
    });
}

// Функция для показа деталей новости
function showNewsDetail(newsId) {
    const news = newsData.find(item => item.id === newsId);
    if (news) {
        alert(`Новость: ${news.title}\n\n${news.excerpt}\n\nДата: ${news.date}\n\n${news.fullText}`);
    }
}

// Функция для показа деталей мероприятия
function showEventDetail(eventId) {
    const event = eventsData.find(item => item.id === eventId);
    if (event) {
        const formattedDate = formatEventDate(event.date);
        alert(`Мероприятие: ${event.title}\n\n${event.description}\n\nДата: ${formattedDate.fullDate}\nВремя: ${event.time}\nМесто: ${event.location}`);
    }
}

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

// Функция для добавления новой новости
function addNews(title, excerpt, date, imageUrl, fullText) {
    const newNews = {
        id: newsData.length + 1,
        title,
        excerpt,
        date,
        image: imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        fullText: fullText || excerpt
    };
    
    newsData.unshift(newNews);
    renderNews();
}

// Функция для добавления нового мероприятия
function addEvent(title, date, time, location, description) {
    const newEvent = {
        id: eventsData.length + 1,
        title,
        date: new Date(date),
        time,
        location,
        description
    };
    
    eventsData.push(newEvent);
    renderEvents();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Установка темы из localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    
    // Обработчик для переключателя темы
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Плавная прокрутка для навигации
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
    
    // Рендеринг контента
    renderNews();
    renderEvents();
    
    // Пример добавления новых данных (можно удалить)
    console.log('Для добавления новости используйте: addNews("Заголовок", "Краткое описание", "Дата", "URL изображения", "Полный текст")');
    console.log('Для добавления мероприятия используйте: addEvent("Название", "2023-11-15", "16:00 - 19:00", "Место", "Описание")');
});