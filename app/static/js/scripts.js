document.addEventListener('DOMContentLoaded', function () {
    const themeSwitch = document.getElementById('themeSwitch');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    // Verificar o tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'theme-dark') {
        document.body.classList.add('theme-dark');
        themeSwitch.checked = true;
        themeIcon.textContent = '🌙';
    } else {
        document.body.classList.add('theme-light');
        themeSwitch.checked = false;
        themeIcon.textContent = '☀️';
    }

    // Alternar o tema quando o switch é clicado
    themeSwitch.addEventListener('change', function () {
        if (this.checked) {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            localStorage.setItem('theme', 'theme-dark');
            themeIcon.textContent = '🌙';
        } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            localStorage.setItem('theme', 'theme-light');
            themeIcon.textContent = '☀️';
        }
    });
});