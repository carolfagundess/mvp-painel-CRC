export function initEquipamentos() {
    const sel = document.getElementById('eq-modalidade');
    if (!sel) return;

    sel.addEventListener('change', () => {
        document.querySelectorAll('.equip-view').forEach((v) => v.classList.remove('active'));
        const view = document.getElementById(`eq-view-${sel.value}`);
        if (view) view.classList.add('active');
    });
}
