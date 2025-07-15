// === Küresel değişkenler ===
let xmlDoc;
let changed = false;
let filteredGames = [];

// === Dosya yüklendiğinde ===
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const parser = new DOMParser();
  xmlDoc = parser.parseFromString(await file.text(), 'application/xml');
  listGames();
});

// === Ana listeleme fonksiyonu ===
function listGames(filterText = "") {
  const tbody = document.getElementById('gameList');
  // BAŞLIK SATIRI SIRASINI GÜNCELLE
  tbody.innerHTML = '<tr><th></th><th>Sil</th><th>Ad</th><th>Clone Of</th></tr>'; // "Sil" sütununu "Ad"dan önceye aldık

  const allGames = Array.from(xmlDoc.getElementsByTagName('game'));
  const gamesById = new Map();
  const clonesByParentId = new Map();

  // Oyunları grupla
  allGames.forEach(g => {
    const id = g.getAttribute('id');
    const cloneOf = g.getAttribute('cloneofid');
    if (cloneOf) {
      if (!clonesByParentId.has(cloneOf)) clonesByParentId.set(cloneOf, []);
      clonesByParentId.get(cloneOf).push(g);
    } else if (id) {
      gamesById.set(id, g);
    }
  });

  // Filtreye uyan oyunları ve ilişkili olanları topla
  const matchSet = new Set();
  allGames.forEach(g => {
    const name = (g.getAttribute('name') || "").toLowerCase();
    if (!name.includes(filterText.toLowerCase())) return;
    matchSet.add(g);
    const cloneOf = g.getAttribute('cloneofid');
    if (cloneOf) {
      const parent = gamesById.get(cloneOf);
      if (parent) matchSet.add(parent);
    } else {
      (clonesByParentId.get(g.getAttribute('id')) || []).forEach(c => matchSet.add(c));
    }
  });

  filteredGames = Array.from(matchSet);

  // === Renk döngüsü için index ===
  let colorIndex = 0;
  const COLOR_COUNT = 6;

  // Her ana oyun + klonlarını tabloya ekle
  gamesById.forEach((mainGame, id) => {
    if (!matchSet.has(mainGame)) return; // filtre dışındaysa atla

    const groupClass = `groupColor${colorIndex}`;
    colorIndex = (colorIndex + 1) % COLOR_COUNT;

    // Ana satır
    tbody.appendChild(createGameRow(mainGame, false, null, groupClass));

    // Klonlar
    (clonesByParentId.get(id) || []).forEach(clone => {
      if (!matchSet.has(clone)) return; // filtre dışındaysa klonu atla
      tbody.appendChild(createGameRow(clone, true,
        mainGame.getAttribute('name') || "(Ana oyun)", groupClass));
    });
  });

  document.getElementById('deleteSelectedBtn').hidden = filteredGames.length === 0;
}

// === Arama kutusu ===
document.getElementById('searchInput').addEventListener('input', e => listGames(e.target.value));

// === Silme ===
function deleteGame(node, row) {
  if (!confirm("Bu oyunu silmek istediğine emin misin?")) return;
  node.parentNode.removeChild(node);
  row.remove();
  changed = true;
  document.getElementById('saveBtn').hidden = false;
  listGames(document.getElementById('searchInput').value); // Güncel durumu yansıtmak için listeyi yenile
}

// === Satır oluşturucu ===
function createGameRow(game, isClone, cloneOfName, groupClass) {
  const row = document.createElement('tr');
  row.classList.add(groupClass);
  if (isClone) row.classList.add('cloneRow');

  const name = game.getAttribute('name') || "(İsimsiz)";
  const gameId = game.getAttribute('id'); // Oyunun ID'sini al

  // Checkbox
  const cbCell = row.insertCell();
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'selectGame';
  cb.dataset.gameId = gameId; // Checkbox'a oyun ID'sini ekle
  cbCell.appendChild(cb);

  // SİL BUTONU BURAYA GELDİ
  const delCell = row.insertCell();
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Sil';
  delBtn.className = 'danger';
  delBtn.dataset.gameId = gameId; // Sil butonuna da oyun ID'sini ekle
  delBtn.onclick = () => deleteGame(game, row);
  delCell.appendChild(delBtn);

  // Ad
  row.insertCell().textContent = name;

  // Clone Of
  row.insertCell().textContent = isClone ? cloneOfName || "(Ana oyun bilinmiyor)" : "-";

  return row;
}

// === Toplu silme ===
document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
  const checked = [...document.querySelectorAll('.selectGame:checked')];
  if (!checked.length) { alert("Hiçbir oyun seçilmedi."); return; }
  if (!confirm(`${checked.length} oyun silinecek. Emin misin?`)) return;

  checked.forEach(cb => {
    const row = cb.closest('tr');
    const gameIdToDelete = cb.dataset.gameId; // Checkbox'tan oyun ID'sini al

    // ID'ye göre XML düğümünü bul
    const gameNode = [...xmlDoc.getElementsByTagName('game')]
      .find(g => g.getAttribute('id') === gameIdToDelete);

    if (gameNode) {
      gameNode.parentNode.removeChild(gameNode);
      row.remove();
    }
  });

  changed = true;
  document.getElementById('saveBtn').hidden = false;
  listGames(document.getElementById('searchInput').value); // Güncel durumu yansıtmak için listeyi yenile
});

// === Kaydet (.dat indir) ===
document.getElementById('saveBtn').addEventListener('click', () => {
  if (!changed) return;
  const xmlStr = new XMLSerializer().serializeToString(xmlDoc);
  const url = URL.createObjectURL(new Blob([xmlStr], { type: 'application/xml' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'games_clean.dat'; a.click();
  URL.revokeObjectURL(url);
  changed = false;
  alert('Yeni .dat indirildi!');
  document.getElementById('saveBtn').hidden = true;
});

// === Seç / Kaldır ===
document.getElementById('selectAllBtn').addEventListener('click',
  () => document.querySelectorAll('.selectGame').forEach(cb => cb.checked = true));
document.getElementById('deselectAllBtn').addEventListener('click',
  () => document.querySelectorAll('.selectGame').forEach(cb => cb.checked = false));

// === Gece modu ===
document.getElementById('toggleThemeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('toggleThemeBtn');
  btn.textContent = document.body.classList.contains('dark') ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saveBtn').hidden = true;
});