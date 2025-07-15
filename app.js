// Küresel değişkenler
let xmlDoc;          // DOM hâline getirilmiş .dat
let changed = false; // Silme yapıldı mı?

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
function listGames() {
  const tbody = document.getElementById('gameList');
  tbody.innerHTML = '<tr><th>Ad</th><th>Sil</th></tr>';

  const games = Array.from(xmlDoc.getElementsByTagName('game'));
  games.forEach((game, idx) => {
    const name = game.getAttribute('name') || `Game #${idx+1}`;
    const row = tbody.insertRow();
    row.insertCell().textContent = name;

    const delCell = row.insertCell();
    const btn = document.createElement('button');
    btn.textContent = 'Sil';
    btn.className = 'danger';
    btn.onclick = () => deleteGame(game, row);
    delCell.appendChild(btn);
  });
}

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