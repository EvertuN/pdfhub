document.addEventListener('DOMContentLoaded', function () {
    const themeSwitch = document.getElementById('themeSwitch');
    const themeIcon = document.getElementById('themeIcon');

    function applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);

        if (theme === 'theme-dark') {
            themeSwitch.checked = true;
            themeIcon.textContent = '🌙';
        } else {
            themeSwitch.checked = false;
            themeIcon.textContent = '☀️';
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'theme-light'; // Padrão: tema claro
    applyTheme(savedTheme);

    themeSwitch.addEventListener('change', function () {
        applyTheme(this.checked ? 'theme-dark' : 'theme-light');
    });
});
