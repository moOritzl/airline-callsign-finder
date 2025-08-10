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
const addForm = document.getElementById('add-form');
const editForm = document.getElementById('edit-form');
const editIcaoInput = document.getElementById('edit-icao');
const editCallsignInput = document.getElementById('edit-callsign');
const cancelEditBtn = document.getElementById('cancel-edit');
const messageBox = document.getElementById('message');
let editTarget = null;

function invalidateAirlineCache() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'invalidate-airlines-cache' });
    }
}

function queueOperation(operation) {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(reg => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'queue', operation });
                }
                return reg.sync.register('sync-airlines');
            })
            .then(() => showMessage('Offline gespeichert, wird später synchronisiert'))
            .catch(() => showMessage('Fehler beim Offline-Speichern', true));
    } else {
        showMessage('Offline-Sync nicht unterstützt', true);
    }
}

function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = isError ? 'error' : 'success';
    setTimeout(() => {
        messageBox.textContent = '';
        messageBox.className = '';
    }, 3000);
}

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
        const span = document.createElement('span');
        span.textContent = `${icao} - ${airlines[icao]}`;
        li.appendChild(span);

        if (currentUser?.role === 'author') {
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Bearbeiten';
            editBtn.addEventListener('click', () => startEdit(icao, airlines[icao]));
            li.appendChild(editBtn);

            const delBtn = document.createElement('button');
            delBtn.textContent = 'Löschen';
            delBtn.addEventListener('click', () => deleteAirline(icao));
            li.appendChild(delBtn);
        }

        airlineList.appendChild(li);
    });
}

function deleteAirline(icao) {
    if (!(currentUser?.role === 'author')) return;
    fetch(`/api/airlines/${icao}`, {
        method: 'DELETE',
        headers: { 'X-Role': currentUser.role }
    }).then(res => {
        if (res.ok) {
            showMessage('Airline gelöscht');
            invalidateAirlineCache();
            loadAirlines();
        } else {
            showMessage('Fehler beim Löschen', true);
        }
    }).catch(() => {
        queueOperation({
            method: 'DELETE',
            url: `/api/airlines/${icao}`,
            headers: { 'X-Role': currentUser.role }
        });
    });
}

function startEdit(icao, callsign) {
    editTarget = icao;
    editIcaoInput.value = icao;
    editCallsignInput.value = callsign;
    editForm.classList.remove('hidden');
}

addForm.addEventListener('submit', e => {
    e.preventDefault();
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
        }).then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        }).then(() => {
            document.getElementById('new-icao').value = '';
            document.getElementById('new-callsign').value = '';
            showMessage('Airline hinzugefügt');
            invalidateAirlineCache();
            loadAirlines();
        }).catch(() => {
            queueOperation({
                method: 'POST',
                url: '/api/airlines',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Role': currentUser.role
                },
                body: { icao, callsign }
            });
        });
    }
});

editForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!(currentUser?.role === 'author') || !editTarget) return;
    fetch(`/api/airlines/${editTarget}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Role': currentUser.role
        },
        body: JSON.stringify({ callsign: editCallsignInput.value })
    }).then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    }).then(() => {
        showMessage('Airline aktualisiert');
        editForm.classList.add('hidden');
        editCallsignInput.value = '';
        editTarget = null;
        invalidateAirlineCache();
        loadAirlines();
    }).catch(() => {
        queueOperation({
            method: 'PUT',
            url: `/api/airlines/${editTarget}`,
            headers: {
                'Content-Type': 'application/json',
                'X-Role': currentUser.role
            },
            body: { callsign: editCallsignInput.value }
        });
    });
});

cancelEditBtn.addEventListener('click', () => {
    editForm.classList.add('hidden');
    editTarget = null;
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
        const icaoSpan = document.createElement('span');
        icaoSpan.textContent = a.icao;
        const callSpan = document.createElement('span');
        callSpan.textContent = a.callsign;
        li.append(icaoSpan, callSpan);

        if (currentUser?.role === 'author') {
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Löschen';
            delBtn.addEventListener('click', e => {
                e.stopPropagation();
                deleteAirline(a.icao);
            });
            li.appendChild(delBtn);
        }

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

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'sync-complete') {
            showMessage('Änderungen synchronisiert');
            loadAirlines();
        }
    });
}
