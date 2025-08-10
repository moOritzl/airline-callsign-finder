let airlines = {};
let currentUser = JSON.parse(localStorage.getItem('user')) || null;

function loadAirlines() {
    return fetch('/api/airlines')
        .then(response => response.json())
        .then(data => {
            airlines = data;
            if (currentUser?.role === 'author') renderAirlineList();
        });
}

loadAirlines();

const users = {
    author: { password: 'secret', role: 'author' }
};

const loginForm = document.getElementById('login-form');
const logoutSection = document.getElementById('logout-section');
const currentUserSpan = document.getElementById('current-user');

const crudSection = document.getElementById('crud-section');
const airlineList = document.getElementById('airline-list');

function updateUI() {
    if (currentUser) {
        loginForm.classList.add('hidden');
        logoutSection.classList.remove('hidden');
        currentUserSpan.textContent = `${currentUser.username} (${currentUser.role})`;
        if (currentUser.role === 'author') {
            crudSection.classList.remove('hidden');
            renderAirlineList();
        } else {
            crudSection.classList.add('hidden');
        }
    } else {
        loginForm.classList.remove('hidden');
        logoutSection.classList.add('hidden');
        crudSection.classList.add('hidden');
    }
}

updateUI();

document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const user = users[username];
    if (user && user.password === password) {
        currentUser = { username, role: user.role };
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUI();
        if (currentUser.role === 'author') loadAirlines();
    } else {
        alert('Login fehlgeschlagen');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('user');
    updateUI();
});

function renderAirlineList() {
    airlineList.innerHTML = '';
    Object.keys(airlines).forEach(icao => {
        const li = document.createElement('li');
        li.textContent = `${icao} - ${airlines[icao]}`;
        const del = document.createElement('button');
        del.textContent = 'Löschen';
        del.addEventListener('click', () => {
            if (!(currentUser?.role === 'author')) return;
            fetch(`/api/airlines/${icao}`, {
                method: 'DELETE',
                headers: { 'X-Role': currentUser.role }
            }).then(loadAirlines);
        });
        li.appendChild(del);
        airlineList.appendChild(li);
    });
}

document.getElementById('add-airline').addEventListener('click', () => {
    if (!(currentUser?.role === 'author')) return;
    const icao = document.getElementById('new-icao').value.toUpperCase();
    const callsign = document.getElementById('new-callsign').value;
    if (icao && callsign) {
        fetch('/api/airlines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Role': currentUser.role
            },
            body: JSON.stringify({ icao, callsign })
        }).then(() => {
            document.getElementById('new-icao').value = '';
            document.getElementById('new-callsign').value = '';
            loadAirlines();
        });
    }
});

const input = document.getElementById('icao-input');
const suggestions = document.getElementById('suggestions');

input.addEventListener('input', function () {
    const query = this.value.toUpperCase();
    suggestions.innerHTML = '';

    if (query.length === 0) return;

    const matches = Object.keys(airlines)
        .filter(icao => icao.startsWith(query))
        .map(icao => ({ icao, callsign: airlines[icao] }));

    matches.forEach(a => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${a.icao}</span> <span>${a.callsign}</span>`;
        li.addEventListener('click', () => {
            input.value = a.icao;
            suggestions.innerHTML = '';
        });
        suggestions.appendChild(li);
    });
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registriert'))
        .catch(err => console.log('Fehler beim Registrieren:', err));
}
