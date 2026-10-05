/* ============================================================
   HidroScanner — Filtros Module
   Filter controls for the map sidebar
   ============================================================ */

const HidroFiltros = (() => {
  let onFilterChange = null;
  let currentFilters = {
    municipio: '',
    situacao: '',
    uso: ''
  };

  // ── Initialize filter controls ─────────────────────────────
  async function init(callback) {
    onFilterChange = callback;

    // Populate municipality dropdown
    const municipios = await HidroAPI.getMunicipios();
    const select = document.getElementById('filterMunicipio');
    if (select) {
      municipios.sort((a, b) => a.nome.localeCompare(b.nome));
      municipios.forEach(m => {
        const option = document.createElement('option');
        option.value = m.nome;
        option.textContent = m.nome;
        select.appendChild(option);
      });
      select.addEventListener('change', () => {
        currentFilters.municipio = select.value;
        _emitChange();
      });
    }

    // Situação chips
    document.querySelectorAll('[data-filter-situacao]').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.filterSituacao;
        document.querySelectorAll('[data-filter-situacao]').forEach(c => c.classList.remove('active'));
        if (currentFilters.situacao === val) {
          currentFilters.situacao = '';
        } else {
          chip.classList.add('active');
          currentFilters.situacao = val;
        }
        _emitChange();
      });
    });

    // Uso chips
    document.querySelectorAll('[data-filter-uso]').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.filterUso;
        document.querySelectorAll('[data-filter-uso]').forEach(c => c.classList.remove('active'));
        if (currentFilters.uso === val) {
          currentFilters.uso = '';
        } else {
          chip.classList.add('active');
          currentFilters.uso = val;
        }
        _emitChange();
      });
    });

    // Reset button
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', reset);
    }
  }

  function _emitChange() {
    if (onFilterChange) {
      onFilterChange({ ...currentFilters });
    }
  }

  function reset() {
    currentFilters = { municipio: '', situacao: '', uso: '' };
    const select = document.getElementById('filterMunicipio');
    if (select) select.value = '';
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    _emitChange();
  }

  function getFilters() {
    return { ...currentFilters };
  }

  return { init, reset, getFilters };
})();
