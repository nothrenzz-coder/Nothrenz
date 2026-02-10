load();const listWrap = document.getElementById('listWrap');
const loadingEl = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');

let HEROES = [];
let selectedRole = 'all';
let searchTimeout;
let currentlyOpenCard = null; // Menyimpan card yang sedang terbuka

function imageEl(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.onerror = () => {
    img.src = 'https://placehold.co/100x100/1a1a1a/fff?text=' + encodeURIComponent(alt.charAt(0));
    img.style.objectFit = 'contain';
    img.style.padding = '8px';
  };
  return img;
}

function renderItem(h) {
  const tpl = document.getElementById('itemTpl');
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector('.hero-card');
  
  const imgWrap = card.querySelector('.hero-img');
  imgWrap.appendChild(imageEl(h.image, h.name));
  
  card.querySelector('.hero-name').textContent = h.name;
  card.querySelector('.hero-desc').textContent = h.description || '';
  
  const chevBtn = card.querySelector('.chevron-btn');
  const expanded = card.querySelector('.expanded-area');
  const grid = card.querySelector('.variants-grid');
  
  let isOpen = false;
  let isAnimating = false;
  
  function toggle() {
    if (isAnimating) return;
    
    isAnimating = true;
    isOpen = !isOpen;
    chevBtn.classList.toggle('active', isOpen);
    
    if (isOpen) {
      if (grid.children.length === 0) {
        renderSeriesContent();
      }
      
      expanded.style.display = 'block';
      expanded.style.overflow = 'hidden';
      expanded.style.height = '0';
      
      // TAMBAH: Force reflow sebelum animasi
      expanded.offsetHeight;
      
      const targetHeight = expanded.scrollHeight;
      expanded.style.height = targetHeight + 'px';
      expanded.classList.add('show');
      
      setTimeout(() => {
        expanded.style.height = 'auto';
        expanded.style.overflow = 'visible';
        isAnimating = false;
        
        // TAMBAH: Check jika ada series yang kepotong
        checkAndFixCutoffSeries();
      }, 300);
      
    } else {
      const startHeight = expanded.scrollHeight;
      expanded.style.height = startHeight + 'px';
      expanded.style.overflow = 'hidden';
      
      setTimeout(() => {
        expanded.style.height = '0px';
        expanded.classList.remove('show');
        
        setTimeout(() => {
          expanded.style.display = 'none';
          expanded.style.height = '';
          expanded.style.overflow = '';
          isAnimating = false;
        }, 300);
      }, 10);
    }
  }
  
  function checkAndFixCutoffSeries() {
    // Cek semua series content yang terbuka
    const allSeriesContents = card.querySelectorAll('.series-content');
    
    allSeriesContents.forEach(content => {
      if (content.style.height !== '0px' && content.style.height !== '') {
        const inner = content.querySelector('.series-content-inner');
        if (inner) {
          const innerRect = inner.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          
          // Jika inner lebih tinggi dari container, artinya kepotong
          if (innerRect.height > contentRect.height) {
            // Adjust height supaya tidak kepotong
            const newHeight = inner.scrollHeight + 8; // Tambah buffer
            content.style.height = newHeight + 'px';
            
            // TAMBAH: Scroll card ke view jika kepotong
            const cardRect = card.getBoundingClientRect();
            const listWrapRect = listWrap.getBoundingClientRect();
            
            if (cardRect.bottom > listWrapRect.bottom - 20) {
              card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }
    });
  }
  
  function renderSeriesContent() {
    grid.innerHTML = '';
    
    (h.series || []).forEach(s => {
      const wrap = document.createElement('div');
      wrap.className = 'series-item';
      
      const header = document.createElement('div');
      header.className = 'series-header';
      header.innerHTML = `<span>${s.name}</span><span class="series-arrow">⟨</span>`;
      
      const content = document.createElement('div');
      content.className = 'series-content';
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      
      const inner = document.createElement('div');
      inner.className = 'series-content-inner';
      
      (s.items || []).forEach(v => {
        const a = document.createElement('a');
        a.href = v.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'variant-btn';
        a.textContent = v.name;
        inner.appendChild(a);
      });
      
      content.appendChild(inner);
      
      let seriesAnimating = false;
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (seriesAnimating) return;
        seriesAnimating = true;
        
        const isSeriesOpen = content.style.height !== '0px' && content.style.height !== '';
        
        if (!isSeriesOpen) {
          // TAMBAH: Buffer untuk mencegah kepotong
          const targetHeight = inner.scrollHeight + 4;
          content.style.height = targetHeight + 'px';
          header.classList.add('active');
          
          setTimeout(() => {
            seriesAnimating = false;
            
            // TAMBAH: Cek lagi setelah animasi selesai
            const innerRect = inner.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            
            // Jika masih kepotong, adjust lagi
            if (innerRect.height > contentRect.height - 4) {
              content.style.height = inner.scrollHeight + 8 + 'px';
            }
          }, 300);
          
        } else {
          // TAMBAH: Simpan height yang benar sebelum menutup
          const startHeight = content.scrollHeight;
          content.style.height = startHeight + 'px';
          content.style.overflow = 'hidden';
          
          setTimeout(() => {
            content.style.height = '0px';
            header.classList.remove('active');
            
            setTimeout(() => {
              seriesAnimating = false;
            }, 300);
          }, 10);
        }
      });
      
      wrap.appendChild(header);
      wrap.appendChild(content);
      grid.appendChild(wrap);
    });
  }
  
  chevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
  
  return card;
}

function renderList(list) {
  listWrap.innerHTML = '';
  
  // Reset currentlyOpenCard saat render ulang
  currentlyOpenCard = null;
  
  if (!list || list.length === 0) {
    emptyState.classList.add('show');
    emptyState.style.display = 'block';
    listWrap.style.display = 'none';
    return;
  }
  
  emptyState.classList.remove('show');
  emptyState.style.display = 'none';
  listWrap.style.display = 'block';
  
  list.forEach(h => {
    listWrap.appendChild(renderItem(h));
  });
}

function applyFilters() {
  const searchQuery = searchInput.value.toLowerCase().trim();
  
  // Tutup card yang sedang terbuka sebelum filter
  if (currentlyOpenCard) {
    const chevBtn = currentlyOpenCard.querySelector('.chevron-btn');
    const expanded = currentlyOpenCard.querySelector('.expanded-area');
    
    if (expanded && expanded.style.display === 'block') {
      chevBtn.classList.remove('active');
      expanded.style.display = 'none';
      expanded.style.height = '';
      expanded.classList.remove('show');
      currentlyOpenCard.isOpen = false;
    }
    currentlyOpenCard = null;
  }
  
  let filtered = HEROES;
  
  if (selectedRole !== 'all') {
    filtered = filtered.filter(hero =>
      hero.description && hero.description.toLowerCase().includes(selectedRole.toLowerCase())
    );
  }
  
  if (searchQuery) {
    filtered = filtered.filter(hero =>
      hero.name.toLowerCase().includes(searchQuery) ||
      (hero.description && hero.description.toLowerCase().includes(searchQuery))
    );
  }
  
  renderList(filtered);
}

function initRoleFilter() {
  const roleButtons = document.querySelectorAll('.role-btn');
  
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
      applyFilters();
    });
  });
}

async function load() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    HEROES = await res.json();
    
    if (!Array.isArray(HEROES)) {
      throw new Error('Data format is incorrect');
    }
    
    renderList(HEROES);
    initRoleFilter();
    loadingEl.style.display = 'none';
    
  } catch (error) {
    console.error('Error loading data:', error);
    emptyState.textContent = 'Gagal memuat data. Cek console untuk detail.';
    emptyState.classList.add('show');
    loadingEl.style.display = 'none';
  }
}

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
});

load();
