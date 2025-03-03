let airlines = {};

fetch('airlines.json')
    .then(response => response.json())
    .then(data => airlines = data);

const input = document.getElementById('icao-input');
const suggestions = document.getElementById('suggestions');

input.addEventListener('input', function () {
    const query = this.value.toUpperCase();
    suggestions.innerHTML = ''; // Vorherige Vorschläge löschen

    if (query.length === 0) return;

    const matches = Object.keys(airlines)
        .filter(icao => icao.startsWith(query))
        .map(icao => ({icao, callsign: airlines[icao]}));

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
