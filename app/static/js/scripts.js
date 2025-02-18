document.addEventListener('DOMContentLoaded', function () {
    const themeSwitch = document.getElementById('themeSwitch');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        themeSwitch.checked = savedTheme === 'theme-light';
    }

    // Alterna o tema quando o botão é clicado
    themeSwitch.addEventListener('change', function () {
        if (this.checked) {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            localStorage.setItem('theme', 'theme-light');
        } else {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            localStorage.setItem('theme', 'theme-dark');
        }
    });
});