// ==UserScript==
// @name         Mail.ru Multi-session Bypass
// @namespace    https://github.com/Computershik73/mailru-multisession-bypass
// @version      1.0.0
// @description  Блокировка ограничений мультисессии в почте Mail.ru
// @author       Ilya Vysotsky
// @match        *://e.mail.ru/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @downloadURL  https://github.com/Computershik73/mailru-multisession-bypass/raw/main/mailru-multisession-bypass.user.js
// ==/UserScript==

(function() {
'use strict';

window.webpackChunk_mail_octavius = window.webpackChunk_mail_octavius || [];
const origPush = window.webpackChunk_mail_octavius.push;

window.webpackChunk_mail_octavius.push = function(...args) {
    const chunk = args[0];    
    const modules = chunk[1]; 

    if (modules) {
        for (let moduleId in modules) {
            let funcStr = modules[moduleId].toString();
            let originalStr = funcStr;
            let modified = false;

            if (funcStr.includes('MULTI_COOKIE_RESTRICTION_ENABLED')) {
                funcStr = funcStr.replace(/[a-zA-Z0-9_$]+\.MULTI_COOKIE_RESTRICTION_ENABLED/g, 'false');
                modified = true;
            }
           
            if (funcStr.includes('MULTI_COOKIE_ANALITYCS_ENABLED')) {
                 funcStr = funcStr.replace(/[a-zA-Z0-9_$]+\.MULTI_COOKIE_ANALITYCS_ENABLED/g, 'false');
                 modified = true;
            }

            if (funcStr.includes('#multi-session')) {
                funcStr = funcStr.replace(/["']#multi-session["']/g, '"#inbox"');
                modified = true;
            }

            if (funcStr.includes('octavius/user-sessions/check')) {
                funcStr = funcStr.replace(/total:\s*[a-zA-Z0-9_$]+\.length/g, 'total: 0');
                funcStr = funcStr.replace(/web:\s*[a-zA-Z0-9_$]+\.length/g, 'web: 0');
                funcStr = funcStr.replace(/d\.fulfilled\.subscribe/g, '/* blocked sub */ d.fulfilled.subscribe');
                modified = true;
            }

            if (modified) {
                try {
                    modules[moduleId] = eval('(' + funcStr + ')');
                } catch (e) {
                    console.error(`Ошибка патчинга модуля ${moduleId}:`, e);
                }
            }
        }
    }

    return origPush.apply(this, args);
};

let realSotaConfig = window.sotaConfig || {};
    
const configHandler = {
    get: function(target, prop, receiver) {
        if (prop === 'MULTI_COOKIE_RESTRICTION_ENABLED') return false;
        if (prop === 'MULTI_COOKIE_PROMO_ENABLED') return false;
        if (prop === 'authGate') return false;
        if (prop === 'isMultisession') return false;

        const value = Reflect.get(target, prop, receiver);
        if (value && typeof value === 'object') {
            return new Proxy(value, configHandler);
        }
        return value;
    }
};

Object.defineProperty(window, 'sotaConfig', {
    get: function() {
        return new Proxy(realSotaConfig, configHandler);
    },
    set: function(val) {
        if (val && val.cfg && val.cfg.omicron && val.cfg.omicron.Config) {
             val.cfg.omicron.Config['multi-cookie-restriction-enabled'] = false;
        }
        realSotaConfig = val;
    },
    configurable: true
});

const isForbiddenUrl = (url) => typeof url === 'string' && url.includes('multi-session');

const origPushState = history.pushState;
const origReplaceState = history.replaceState;

history.pushState = function(state, title, url) {
    if (isForbiddenUrl(url)) {
        return;
    }
    return origPushState.apply(this, arguments);
};

history.replaceState = function(state, title, url) {
    if (isForbiddenUrl(url)) {
        return;
    }
    return origReplaceState.apply(this, arguments);
};

const style = document.createElement('style');
style.innerHTML = `
    #multi-session,
    .multisession-stub,
    [class*="multisession"],
    div[data-qa-id="multisession-stub"] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
	
    .application-mail__layout_main {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
`;
(document.head || document.documentElement).appendChild(style);

})();
