// Küresel değişkenler
let xmlDoc;          // DOM hâline getirilmiş .dat
let changed = false;  // Silme yapıldı mı?
let filteredGames = [];  // Arama sonucu buraya yazılacak

// 1) Dosya yüklendiğinde
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();

  // XML'i JavaScript DOM'una çevir
  const parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, 'application/xml');

  listGames();
});

// 2) XML içindeki <game> nodelarını tabloya bas
function listGames(filterText = "") {
  const tbody = document.getElementById('gameList');
  tbody.innerHTML = '<tr><th></th><th>Ad</th><th>Clone Of</th><th>Sil</th></tr>';

  const allGames = Array.from(xmlDoc.getElementsByTagName('game'));
  const gamesById = new Map();
  const clonesByParentId = new Map();

  // Önce tüm oyunları ID'ye göre grupla
  allGames.forEach(game => {
    const id = game.getAttribute('id');
    const cloneOf = game.getAttribute('cloneofid');

    if (cloneOf) {
      if (!clonesByParentId.has(cloneOf)) clonesByParentId.set(cloneOf, []);
      clonesByParentId.get(cloneOf).push(game);
    } else if (id) {
      gamesById.set(id, game);
    }
  });

  filteredGames = [];

  // Ana oyunları sırala ve filtrele
  gamesById.forEach((mainGame, id) => {
    const name = mainGame.getAttribute('name') || `Game ID ${id}`;
    if (!name.toLowerCase().includes(filterText.toLowerCase())) return;

    // Ana oyun satırı ekle
    const row = createGameRow(mainGame, false, null);
    tbody.appendChild(row);
    filteredGames.push(mainGame);

    // Ana oyunun klonları varsa, onları da ekle
    const clones = clonesByParentId.get(id) || [];
    clones.forEach(cloneGame => {
      const cloneRow = createGameRow(cloneGame, true, name);
      tbody.appendChild(cloneRow);
      filteredGames.push(cloneGame);
    });
  });

  // Seçili silme butonunu göster/gizle
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (deleteBtn) deleteBtn.hidden = filteredGames.length === 0;
}

// Arama kutusuna yazınca filtrele
document.getElementById('searchInput').addEventListener('input', (e) => {
  const text = e.target.value;
  listGames(text);
});

// Silme işlemi
function deleteGame(node, row) {
  if (!confirm('Bu oyunu silmek istediğine emin misin?')) return;
  node.parentNode.removeChild(node); // XML’den çıkar
  row.remove();                      // Tablodan çıkar
  changed = true;
  document.getElementById('saveBtn').hidden = false;
}

// Güncel XML’i indir
document.getElementById('saveBtn').addEventListener('click', () => {
  if (!changed) return;
  const serializer = new XMLSerializer();
  const xmlStr = serializer.serializeToString(xmlDoc);

  const blob = new Blob([xmlStr], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'games_clean.dat';
  a.click();

  URL.revokeObjectURL(url);
  changed = false;
  alert('Yeni .dat indirildi!');
});

// Seçili oyunları sil
document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.selectGame:checked');
  if (checkboxes.length === 0) {
    alert("Hiçbir oyun seçilmedi.");
    return;
  }

  if (!confirm(`${checkboxes.length} oyun silinecek. Emin misin?`)) return;

  checkboxes.forEach(cb => {
    const row = cb.closest('tr');
    const name = row.cells[1].textContent;

    const allGames = Array.from(xmlDoc.getElementsByTagName('game'));
    const match = allGames.find(g => (g.getAttribute('name') || "") === name);
    if (match) match.parentNode.removeChild(match);

    row.remove();
  });

  changed = true;
  document.getElementById('saveBtn').hidden = false;
});

// Tümünü seç
document.getElementById('selectAllBtn').addEventListener('click', () => {
  document.querySelectorAll('.selectGame').forEach(cb => cb.checked = true);
});

// Tümünü kaldır
document.getElementById('deselectAllBtn').addEventListener('click', () => {
  document.querySelectorAll('.selectGame').forEach(cb => cb.checked = false);
});

// Gece modu toggle
document.getElementById('toggleThemeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');

  const btn = document.getElementById('toggleThemeBtn');
  const isDark = document.body.classList.contains('dark');
  btn.textContent = isDark ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
});

// Satır oluşturma fonksiyonu
function createGameRow(game, isClone = false, cloneOfName = null) {
  const row = document.createElement('tr');
  if (isClone) row.classList.add('cloneRow');

  const name = game.getAttribute('name') || "(İsimsiz)";
  const id = game.getAttribute('id') || "-";

  // Checkbox hücresi
  const cbCell = document.createElement('td');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'selectGame';
  cb.dataset.name = name;
  cbCell.appendChild(cb);
  row.appendChild(cbCell);

  // Oyun adı hücresi
  const nameCell = document.createElement('td');
  nameCell.textContent = name;
  row.appendChild(nameCell);

  // Clone Of hücresi
  const cloneOfCell = document.createElement('td');
  cloneOfCell.textContent = isClone ? cloneOfName || "(Ana oyun bilinmiyor)" : "-";
  row.appendChild(cloneOfCell);

  // Silme butonu hücresi
  const delCell = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Sil';
  delBtn.className = 'danger';
  delBtn.onclick = () => deleteGame(game, row);
  delCell.appendChild(delBtn);
  row.appendChild(delCell);

  return row;
}
