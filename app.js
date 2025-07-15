// Küresel değişkenler
let xmlDoc;          // DOM hâline getirilmiş .dat
let changed = false; // Silme yapıldı mı?
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

  filteredGames = allGames.filter((game) => {
    const name = game.getAttribute('name')?.toLowerCase() || "";
    return name.includes(filterText.toLowerCase());
  });

  filteredGames.forEach((game, idx) => {
    const name = game.getAttribute('name') || `Game #${idx + 1}`;
    const cloneOfId = game.getAttribute('cloneofid');
    const category = game.getElementsByTagName('category')[0]?.textContent || '-';

  // Klonun bağlı olduğu oyunun adını bulalım
    let cloneOfName = '-';
    if (cloneOfId) {
      const parentGame = allGames.find(g => g.getAttribute('id') === cloneOfId);
      if (parentGame) cloneOfName = parentGame.getAttribute('name') || `(ID: ${cloneOfId})`;
  }

    const row = tbody.insertRow();

  // Checkbox hücresi
    const checkboxCell = row.insertCell();
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'selectGame';
    checkbox.dataset.index = idx;
    checkboxCell.appendChild(checkbox);

    // Oyun adı hücresi
    row.insertCell().textContent = name;

  // Clone Of hücresi
  row.insertCell().textContent = cloneOfName;

  // Kategori hücresi
  row.insertCell().textContent = category;

  // Silme butonu hücresi
  const delCell = row.insertCell();
  const btn = document.createElement('button');
  btn.textContent = 'Sil';
  btn.className = 'danger';
  btn.onclick = () => deleteGame(game, row);
  delCell.appendChild(btn);

  // Klon oyun ise satıra özel class verelim
  if (cloneOfId) row.classList.add('cloneRow');
});

  // Butonu göster/gizle
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (deleteBtn) deleteBtn.hidden = filteredGames.length === 0;
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const text = e.target.value;
  listGames(text); // filtreli listele
});

// 3) Silme işlemi
function deleteGame(node, row) {
  if (!confirm('Bu oyunu silmek istediğine emin misin?')) return;
  node.parentNode.removeChild(node); // XML’den çıkar
  row.remove();                      // Tablodan çıkar
  changed = true;
  document.getElementById('saveBtn').hidden = false;
}

// 4) Güncel XML’i indir
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

// Tümünü Seç
document.getElementById('selectAllBtn').addEventListener('click', () => {
  document.querySelectorAll('.selectGame').forEach(cb => cb.checked = true);
});

// Tümünü Kaldır
document.getElementById('deselectAllBtn').addEventListener('click', () => {
  document.querySelectorAll('.selectGame').forEach(cb => cb.checked = false);
});

document.getElementById('toggleThemeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');

  const btn = document.getElementById('toggleThemeBtn');
  const isDark = document.body.classList.contains('dark');
  btn.textContent = isDark ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
});