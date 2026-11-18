/* Theme selection is visual-only; no backend/API behavior changes. */
(function(){
  const allowed=['trusted','ev','friendly','executive'];
  const key='carmate-theme';
  function read(){try{return localStorage.getItem(key)}catch(e){return null}}
  function save(v){try{localStorage.setItem(key,v)}catch(e){}}
  function apply(v){const theme=allowed.includes(v)?v:'trusted';document.documentElement.setAttribute('data-theme',theme);document.querySelectorAll('#theme-select,#mobile-theme-select').forEach(el=>{el.value=theme});save(theme)}
  apply(read());
  document.querySelectorAll('#theme-select,#mobile-theme-select').forEach(el=>el.addEventListener('change',()=>apply(el.value)));
})();
