let defaultTheme = {
    active: false,
    primary: '#d32213',
    secondary: '#e9910d',
    text: '#c2c2c2',
    alertc: '#d323136c',
    bg: '#202020',
    bar: '#262626',
    button: '#181818',
    button_modal_hover: '#1c1c1c',
    titlebar_buttons: '#3c3c3c',
    hover: '#ffffff17'
};

function getAllThemes() {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        return JSON.parse(storedTheme);
    }else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme, theme]));
        return [defaultTheme];
    }
}

function updateTheme(theme, index) {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        const themes = JSON.parse(storedTheme);
        themes[index] = theme;
        localStorage.setItem('themes', JSON.stringify(themes));
        return true;
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme, theme]));
        return false;
    }
}

function saveTheme(theme) {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        const themes = JSON.parse(storedTheme);
        themes.push(theme);
        localStorage.setItem('themes', JSON.stringify(themes));
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme, theme]));
    }
}

function getActiveTheme() {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        let themes = JSON.parse(storedTheme);
        return themes.filter((t) => t.active)[0] || defaultTheme;
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme]));
        return defaultTheme;
    }
}

function applyTheme() {

    let theme = getActiveTheme();
  
    document.documentElement.style.setProperty('--c-primary', theme.primary);
    document.documentElement.style.setProperty('--c-secondary', theme.secondary);
    document.documentElement.style.setProperty('--c-text', theme.text);
    document.documentElement.style.setProperty('--c-alert-bg', theme.alertc);
    document.documentElement.style.setProperty('--c-bg', theme.bg);
    document.documentElement.style.setProperty('--c-bar', theme.bar);
    document.documentElement.style.setProperty('--c-button', theme.button);
    document.documentElement.style.setProperty('--c-button-hover-modal', theme.button_modal_hover);
    document.documentElement.style.setProperty('--c-titlebar-button', theme.titlebar_buttons);
    document.documentElement.style.setProperty('--c-hover', theme.hover);

}

function setActiveTheme(i) {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        let themes = JSON.parse(storedTheme);
        themes.forEach((t, index) => t.active = i == index);
        localStorage.setItem('themes', JSON.stringify(themes));
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme]));
    }

    applyTheme();
    initializeEditor(editor ? editor.getValue() : 'select * from table_name');
    return storedTheme;
}

function getActiveThemeIndex() {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        let themes = JSON.parse(storedTheme);
        return themes.findIndex((t) => t.active);
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme]));
        return 0;
    }
}

function getThemeByIndex(index) {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        const themes = JSON.parse(storedTheme);
        return themes[index];
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme]));
        return defaultTheme;
    }
}

function getDefaultTheme() {
    return defaultTheme;
}

function removeTheme(theme) {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        const themes = JSON.parse(storedTheme);
        const newThemes = themes.filter((t) => t !== theme);
        localStorage.setItem('themes', JSON.stringify(newThemes));
        return true;
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme]));
        return false;
    }
}

function removeThemeByIndex(index) {
    const storedTheme = localStorage.getItem('themes');
    if (storedTheme) {
        const themes = JSON.parse(storedTheme);
        const newThemes = themes.filter((t, i) => i !== index);
        localStorage.setItem('themes', JSON.stringify(newThemes));
        return true;
    } else {
        localStorage.setItem('themes', JSON.stringify([defaultTheme]));
        return false;
    }
}

function removeAllThemes() {
    localStorage.removeItem('themes');
    return true;
}




