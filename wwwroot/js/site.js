const apiBase = '/api/games';

let games = [];
let openGames = new Set();

let raisedTimes = {};
async function fetchGames() {
    const res = await fetch(apiBase);
    const data = await res.json();
    games = data.games || [];
    raisedTimes = data.raisedTimes || {};
    renderGames();
    updateGameSelects();
    updateTimers();  // <- добавь этот вызов
    startTimers();
}


let timerInterval;

function startTimers() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimers();
    timerInterval = setInterval(updateTimers, 60 * 1000); // обновляем каждую минуту
}

function updateTimers() {
    document.querySelectorAll('.timer-text').forEach(span => {
        const key = span.dataset.key; // ключ "game|forum|product"
        if (!raisedTimes[key]) {
            span.textContent = '';
            return;
        }
        const now = new Date();
        const raisedTime = new Date(raisedTimes[key]);
        const diffMs = now - raisedTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 12) {
            const remainingMs = 12 * 3600000 - diffMs;
            span.style.color = 'red';
            span.textContent = `Дешевый ап через: ${msToTime(remainingMs)}`;
        } else if (diffHours < 24) {
            const remainingMs = 24 * 3600000 - diffMs;
            span.style.color = 'green';
            span.textContent = `Советуем поднять эту тему: еще есть ${msToTime(remainingMs)}`;
        } else {
            const cycleHours = diffHours % 24;
            if (cycleHours < 12) {
                const remainingMs = (12 - cycleHours) * 3600000;
                span.style.color = 'red';
                span.textContent = `Дешевый ап через: ${msToTime(remainingMs)}`;
            } else {
                const remainingMs = (24 - cycleHours) * 3600000;
                span.style.color = 'green';
                span.textContent = `Советуем поднять эту тему: еще есть ${msToTime(remainingMs)}`;
            }
        }
    });
}

function msToTime(duration) {
    const minutes = Math.floor((duration / 1000 / 60) % 60);
    const hours = Math.floor(duration / 1000 / 60 / 60);
    return `${hours} ч ${minutes} мин`;
}


async function addGame() {
    const gameName = document.getElementById('gameName').value.trim();
    if (!gameName) {
        alert('Введите название игры');
        return;
    }
    const newGame = { name: gameName, forums: [] };
    await fetch(apiBase + '/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
    });
    document.getElementById('gameName').value = '';
    await fetchGames();
}

async function addForum() {
    const gameName = document.getElementById('gameSelect').value;
    const forumName = document.getElementById('forumName').value.trim();
    if (!gameName || !forumName) {
        alert('Введите название форума и выберите игру');
        return;
    }
    const model = { gameName, forumName };
    await fetch(apiBase + '/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
    });
    document.getElementById('forumName').value = '';
    await fetchGames();
}

async function addProduct() {
    const gameName = document.getElementById('productGameSelect').value;
    const forumName = document.getElementById('productForumSelect').value;
    const productName = document.getElementById('productName').value.trim();
    const productLink = document.getElementById('productLink').value.trim();
    if (!gameName || !forumName || !productName || !productLink) {
        alert('Введите все данные для продукта');
        return;
    }
    const model = { gameName, forumName, productName, productLink };
    await fetch(apiBase + '/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
    });
    document.getElementById('productName').value = '';
    document.getElementById('productLink').value = '';
    await fetchGames();
}

async function deleteGame(name) {
    if (!confirm('Вы уверены, что хотите удалить эту игру?')) return;
    await fetch(`${apiBase}/game/${encodeURIComponent(name)}`, { method: 'DELETE' });
    await fetchGames();
}

async function deleteForum(gameName, forumName) {
    if (!confirm('Вы уверены, что хотите удалить этот форум?')) return;
    const url = `${apiBase}/forum?gameName=${encodeURIComponent(gameName)}&forumName=${encodeURIComponent(forumName)}`;
    await fetch(url, { method: 'DELETE' });
    await fetchGames();
}

async function deleteProduct(gameName, forumName, productName) {
    if (!confirm('Вы уверены, что хотите удалить этот продукт?')) return;
    const url = `${apiBase}/product?gameName=${encodeURIComponent(gameName)}&forumName=${encodeURIComponent(forumName)}&productName=${encodeURIComponent(productName)}`;
    await fetch(url, { method: 'DELETE' });
    await fetchGames();
}

function toggleGame(name) {
    if (openGames.has(name)) {
        openGames.delete(name);
    } else {
        openGames.add(name);
    }
    renderGames();
}

function editGameName(oldName) {
    const newName = prompt('Введите новое название игры', oldName);
    if (!newName || newName === oldName) return;

    // Найдём игру и поменяем имя
    const game = games.find(g => g.name === oldName);
    if (!game) return;

    game.name = newName;

    // Для упрощения удалим старую и добавим новую
    deleteGame(oldName).then(() => {
        fetch(apiBase + '/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        }).then(fetchGames);
    });
}

function updateGameSelects() {
    const gameSelect = document.getElementById('gameSelect');
    const productGameSelect = document.getElementById('productGameSelect');

    if (!gameSelect || !productGameSelect) return;

    gameSelect.innerHTML = '<option value="">Выберите игру</option>';
    productGameSelect.innerHTML = '<option value="">Выберите игру</option>';

    games.forEach(g => {
        const option1 = document.createElement('option');
        option1.value = g.name;
        option1.textContent = g.name;
        gameSelect.appendChild(option1);

        const option2 = option1.cloneNode(true);
        productGameSelect.appendChild(option2);
    });

    updateForumSelect();
    updateForumSelectForProduct();
}

function updateForumSelect() {
    const gameSelect = document.getElementById('gameSelect');
    const forumSelect = document.getElementById('productForumSelect');
    if (!gameSelect || !forumSelect) return;

    const gameName = gameSelect.value;
    forumSelect.innerHTML = '<option value="">Выберите форум</option>';

    const game = games.find(g => g.name === gameName);
    if (game) {
        game.forums.forEach(forum => {
            const option = document.createElement('option');
            option.value = forum.name;
            option.textContent = forum.name;
            forumSelect.appendChild(option);
        });
    }
}

function updateForumSelectForProduct() {
    const productGameSelect = document.getElementById('productGameSelect');
    const forumSelect = document.getElementById('productForumSelect');
    if (!productGameSelect || !forumSelect) return;

    const gameName = productGameSelect.value;
    forumSelect.innerHTML = '<option value="">Выберите форум</option>';

    const game = games.find(g => g.name === gameName);
    if (game) {
        game.forums.forEach(forum => {
            const option = document.createElement('option');
            option.value = forum.name;
            option.textContent = forum.name;
            forumSelect.appendChild(option);
        });
    }
}

function renderGames() {
    const container = document.getElementById('gamesSection');
    container.innerHTML = '';

    if (games.length === 0) {
        container.textContent = 'Нет добавленных игр.';
        return;
    }

    games.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'section';

        // Заголовок игры с кнопками
        const header = document.createElement('div');
        header.className = 'game-header';

        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = `Игра: ${game.name}`;
        title.style.cursor = 'pointer';
        title.onclick = () => toggleGame(game.name);

        header.appendChild(title);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Изменить название';
        editBtn.onclick = () => editGameName(game.name);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить игру';
        deleteBtn.onclick = () => deleteGame(game.name);

        const duplicateBtn = document.createElement('button');
        duplicateBtn.textContent = 'Дублировать игру';
        duplicateBtn.classList.add('duplicate-btn');
        duplicateBtn.onclick = () => duplicateGame(game.name);

        buttonsDiv.append(editBtn, deleteBtn, duplicateBtn);
        header.appendChild(buttonsDiv);
        gameDiv.appendChild(header);

        // Форумы и продукты
        const forumSection = document.createElement('div');
        forumSection.className = 'subsection';
        if (openGames.has(game.name)) forumSection.classList.add('open');

        game.forums.forEach(forum => {
            const forumDiv = document.createElement('div');
            forumDiv.className = 'forum';

            // Контейнер для заголовка форума, чекбокса и кнопки удаления
            const forumTitleContainer = document.createElement('div');
            forumTitleContainer.className = 'forum-title-container';
            // Добавим CSS стиль для размещения в строку (flex)
            forumTitleContainer.style.display = 'flex';
            forumTitleContainer.style.alignItems = 'center';
            forumTitleContainer.style.gap = '10px';

            const forumTitle = document.createElement('h4');
            forumTitle.textContent = forum.name;
            forumTitle.style.margin = '0';  // Убираем отступы для ровности

            // Чекбокс включения таймера
            const timerToggleLabel = document.createElement('label');
            timerToggleLabel.className = 'forum-timer-toggle';
            timerToggleLabel.style.display = 'flex';
            timerToggleLabel.style.alignItems = 'center';
            timerToggleLabel.style.gap = '4px';
            timerToggleLabel.style.cursor = 'pointer';

            const timerCheckbox = document.createElement('input');
            timerCheckbox.type = 'checkbox';
            timerCheckbox.checked = forum.timerEnabled === true;
            timerCheckbox.dataset.game = game.name;
            timerCheckbox.dataset.forum = forum.name;

            timerCheckbox.addEventListener('change', async (e) => {
                const gameName = e.target.dataset.game;
                const forumName = e.target.dataset.forum;
                const enabled = e.target.checked;
                await fetch(apiBase + '/setTimerEnabled', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ GameName: gameName, ForumName: forumName, Enabled: enabled })
                });
                forum.timerEnabled = enabled;

                if (!enabled) {
                    // Очистить raisedTimes на сервере
                    await fetch(apiBase + '/clearRaisedTimesForForum', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ GameName: gameName, ForumName: forumName })
                    });

                    // Очистить локально
                    for (const key in raisedTimes) {
                        if (key.startsWith(`${gameName}|${forumName}|`)) {
                            delete raisedTimes[key];
                        }
                    }
                }

                renderGames();
                updateTimers();
            });

            timerToggleLabel.appendChild(timerCheckbox);
            timerToggleLabel.appendChild(document.createTextNode('Включить таймер'));

            // Кнопка удаления форума — рядом с названием и чекбоксом
            const deleteForumBtn = document.createElement('button');
            deleteForumBtn.textContent = 'Удалить форум';
            deleteForumBtn.classList.add('delete-forum-btn');
            deleteForumBtn.onclick = () => deleteForum(game.name, forum.name);

            forumTitleContainer.append(forumTitle, timerToggleLabel, deleteForumBtn);
            forumDiv.appendChild(forumTitleContainer);

            // Продукты форума
            forum.products.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.className = 'product-title-container';

                const productLink = document.createElement('a');
                productLink.href = product.link;
                productLink.target = '_blank';
                productLink.textContent = `Продукт: ${product.name}`;

                productDiv.appendChild(productLink);

                // Кнопка "Я поднял эту тему" — если включен таймер
                if (forum.timerEnabled) {
                    const raiseBtn = document.createElement('button');
                    raiseBtn.textContent = 'Я поднял эту тему';
                    raiseBtn.className = 'raise-topic-btn forum-product-actions-button';
                    raiseBtn.dataset.game = game.name;
                    raiseBtn.dataset.forum = forum.name;
                    raiseBtn.dataset.product = product.name;

                    raiseBtn.onclick = async () => {
                        const key = `${game.name}|${forum.name}|${product.name}`;
                        await fetch(apiBase + '/raiseTopic', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ GameName: game.name, ForumName: forum.name, ProductName: product.name })
                        });
                        raisedTimes[key] = new Date().toISOString();
                        updateTimers();
                    };

                    productDiv.appendChild(raiseBtn);

                    // Надпись с таймером
                    const timerSpan = document.createElement('span');
                    timerSpan.className = 'timer-text';
                    timerSpan.dataset.key = `${game.name}|${forum.name}|${product.name}`;
                    productDiv.appendChild(timerSpan);
                }

                // Кнопка "Удалить продукт"
                const deleteProductBtn = document.createElement('button');
                deleteProductBtn.textContent = 'Удалить продукт';
                deleteProductBtn.onclick = () => deleteProduct(game.name, forum.name, product.name);

                productDiv.appendChild(deleteProductBtn);
                forumDiv.appendChild(productDiv);
            });

            forumSection.appendChild(forumDiv);
        });

        gameDiv.appendChild(forumSection);
        container.appendChild(gameDiv);

        updateTimers();
    });
}



async function duplicateGame(name) {
    const game = games.find(g => g.name === name);
    if (!game) return;

    // Клонируем игру с новым именем
    const newGame = {
        name: `${game.name} (копия)`,
        forums: JSON.parse(JSON.stringify(game.forums))
    };
    await fetch(apiBase + '/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
    });
    await fetchGames();
}

// События обновления селектов для форумов
document.getElementById('gameSelect')?.addEventListener('change', updateForumSelect);
document.getElementById('productGameSelect')?.addEventListener('change', updateForumSelectForProduct);

// Начальная загрузка
fetchGames();
