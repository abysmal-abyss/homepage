const $ = (selector) => document.querySelector(selector);
const clockEl = $('#clock');
const dateEl = $('#date');
const iconEl = $('#weather-icon');

function updateClock() {
  const now = new Date();
  clockEl.textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  dateEl.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
}
updateClock(); setInterval(updateClock, 15000);

const weatherCodes = {0:['Clear','☼'],1:['Mostly clear','☼'],2:['Partly cloudy','◐'],3:['Cloudy','☁'],45:['Misty','≋'],48:['Misty','≋'],51:['Light drizzle','🌧️'],53:['Drizzle','🌧️'],55:['Drizzle','🌧️'],61:['Light rain','🌧️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],71:['Light snow','❄'],73:['Snow','❄'],75:['Snow','❄'],80:['Passing showers','🌧️'],81:['Showers','🌧️'],82:['Heavy showers','🌧️'],95:['Thunderstorms','ϟ'],96:['Thunderstorms','ϟ'],99:['Thunderstorms','ϟ']};
function weatherState(message, place='WEATHER · SET LOCATION'){$('#weather-description').textContent=message;$('#weather-place').textContent=place.toLocaleUpperCase();}
async function loadWeather(lat, lon, place = 'Local') {
  weatherState('loading weather',place);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code,is_day&temperature_unit=celsius&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather unavailable');
    const data = await response.json();
    const [description, icon] = weatherCodes[data.current.weather_code] || ['Changeable','☁'];
    $('#temperature').textContent = `${Math.round(data.current.temperature_2m)}°`;
    $('#weather-description').textContent = description;
    weatherState(description,place);
    iconEl.textContent = Number(data.current.is_day)===0 && [0,1,2].includes(Number(data.current.weather_code)) ? '☾' : icon;
    try{localStorage.setItem('homepage-weather-location',JSON.stringify({lat:Number(lat),lon:Number(lon),place}));}catch{}
  } catch { $('#temperature').textContent='—°';iconEl.textContent='☾';weatherState('weather unavailable · tap to retry',place); }
}
try{const saved=JSON.parse(localStorage.getItem('homepage-weather-location'));if(saved?.lat!=null&&saved?.lon!=null)loadWeather(saved.lat,saved.lon,saved.place||'Local');}catch{}

const defaults = [
  {name:'Pinterest',url:'https://pinterest.com',icon:'P',color:'linear-gradient(145deg,#d27891,#9b526e)'},
  {name:'YouTube',url:'https://youtube.com',icon:'▶',color:'linear-gradient(145deg,#e4869d,#ad617a)'},
  {name:'Spotify',url:'https://open.spotify.com',icon:'◖',color:'linear-gradient(145deg,#86c3a7,#508d7c)'},
  {name:'Notion',url:'https://notion.so',icon:'N',color:'linear-gradient(145deg,#d1c7d3,#857f94)'},
  {name:'Gmail',url:'https://mail.google.com',icon:'M',color:'linear-gradient(145deg,#e8a59e,#b77083)'}
];
let favourites;
try { favourites = JSON.parse(localStorage.getItem('homepage-favourites')) || defaults; } catch { favourites = defaults; }
let iconSource=localStorage.getItem('homepage-icon-source')||'https://www.google.com/s2/favicons?domain={domain}&sz=128';
let editing = false, editingIndex = -1;
function persistFavourites(){localStorage.setItem('homepage-favourites',JSON.stringify(favourites));}
function renderFavourites(){
  const grid = $('#favourite-grid'); grid.classList.toggle('is-editing',editing); grid.replaceChildren();
  favourites.slice(0,8).forEach((fav,index)=>{
    const card = document.createElement('a'); card.className = 'favourite-card'; card.href = fav.url; card.setAttribute('aria-label', `${fav.name}${editing?' — tap to edit':''}`);
    const icon = document.createElement('span'); icon.className='fav-icon';
    const iconUrl=fav.iconUrl || iconSource.replaceAll('{domain}',encodeURIComponent(new URL(fav.url).hostname));
    if(iconUrl){const image=document.createElement('img');image.src=iconUrl;image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';image.addEventListener('error',()=>{image.remove();icon.textContent=fav.name.slice(0,1).toUpperCase();},{once:true});icon.append(image);}else icon.textContent=fav.icon || fav.name.slice(0,1).toUpperCase();
    const label = document.createElement('span'); label.className='fav-label'; label.textContent=fav.name;
    const arrow = document.createElement('span'); arrow.className='fav-arrow'; arrow.textContent=editing?'✎':'↗';
    card.append(icon,label,arrow);
    if(editing){card.href='#';card.addEventListener('click',e=>{e.preventDefault();openDialog(index);});}
    else card.target='_blank',card.rel='noopener noreferrer';
    grid.append(card);
  });
  $('#edit-label').textContent=editing?'Done':'Add a link';
  $('#edit-hint').hidden=!editing;
}
renderFavourites();

const dialog=$('#link-dialog'), nameInput=$('#link-name'), urlInput=$('#link-url'), iconUrlInput=$('#link-icon-url');
function openDialog(index=-1){editingIndex=index;$('#dialog-title').textContent=index<0?'Add a favourite':'Edit a favourite';nameInput.value=index<0?'':favourites[index].name;urlInput.value=index<0?'':favourites[index].url;iconUrlInput.value=index<0?'':(favourites[index].iconUrl||'');dialog.showModal();setTimeout(()=>nameInput.focus(),40);}
function closeDialog(){dialog.close();}
$('#edit-favourites').addEventListener('click',()=>{if(editing){editing=false;renderFavourites();}else openDialog();});
$('#close-dialog').addEventListener('click',closeDialog);$('#cancel-dialog').addEventListener('click',closeDialog);
$('#link-form').addEventListener('submit',e=>{
  e.preventDefault();let url=urlInput.value.trim();if(!/^https?:\/\//i.test(url))url=`https://${url}`;
  let parsed;try{parsed=new URL(url)}catch{return}
  const name=nameInput.value.trim();const old=editingIndex>=0?favourites[editingIndex]:{};
  const item={name,url:parsed.href,icon:name.slice(0,1).toUpperCase(),iconUrl:iconUrlInput.value.trim(),color:old.color||''};
  if(editingIndex>=0)favourites[editingIndex]=item;else favourites.push(item);
  persistFavourites();editing=false;renderFavourites();closeDialog();
});

// Reduce phone photos before saving: mobile browsers have small per-site storage limits.
const wallpaperKey='homepage-wallpaper';
const wallpaperLayer=$('.backdrop-image');
const backdropRoot=$('.backdrop');
let sessionWallpaperUrl='';
function applyWallpaper(dataUrl){
  wallpaperLayer.style.backgroundImage=`url("${dataUrl}")`;
  wallpaperLayer.classList.add('has-image');
  backdropRoot.classList.add('with-wallpaper');
}
function compressWallpaper(file){
  return new Promise((resolve,reject)=>{
    const objectUrl=URL.createObjectURL(file);
    const image=new Image();
    image.onload=()=>{
      try{
        const limit=1800;
        const scale=Math.min(1,limit/Math.max(image.naturalWidth,image.naturalHeight));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const context=canvas.getContext('2d');
        if(!context)throw new Error('Image editing is unavailable in this browser.');
        context.drawImage(image,0,0,canvas.width,canvas.height);
        let quality=.82;
        let result=canvas.toDataURL('image/jpeg',quality);
        while(result.length>1800000&&quality>.58){quality-=.08;result=canvas.toDataURL('image/jpeg',quality);}
        if(result.length>1800000){canvas.width=Math.round(canvas.width*.75);canvas.height=Math.round(canvas.height*.75);context.drawImage(image,0,0,canvas.width,canvas.height);result=canvas.toDataURL('image/jpeg',.62);}
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      }catch(error){URL.revokeObjectURL(objectUrl);reject(error);}
    };
    image.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error('This image could not be opened. Try another photo.'));};
    image.src=objectUrl;
  });
}
try{const saved=localStorage.getItem(wallpaperKey);if(saved)applyWallpaper(saved);}catch{}
$('#wallpaper-button').addEventListener('click',()=>$('#wallpaper-input').click());
$('#wallpaper-input').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(!file.type.startsWith('image/')){alert('Choose an image file for your wallpaper.');return;}
  try{
    if(sessionWallpaperUrl)URL.revokeObjectURL(sessionWallpaperUrl);
    sessionWallpaperUrl=URL.createObjectURL(file);
    applyWallpaper(sessionWallpaperUrl);
  }catch{}
  try{
    const compact=await compressWallpaper(file);
    applyWallpaper(compact);
    if(sessionWallpaperUrl){URL.revokeObjectURL(sessionWallpaperUrl);sessionWallpaperUrl='';}
    try{localStorage.setItem(wallpaperKey,compact);}
    catch{alert('Wallpaper applied, but this browser could not save it. Try a smaller image or leave private browsing mode.');}
  }catch(error){if(!sessionWallpaperUrl)alert(error.message||'Could not use that image. Try a smaller photo.');}
});

const defaultColors=['#f0aeca','#c6b6f5','#b3ded0'];let colors=defaultColors.slice();try{colors=JSON.parse(localStorage.getItem('homepage-colors'))||colors;}catch{}
function applyColors(){['--pink','--lilac','--mint'].forEach((key,i)=>document.documentElement.style.setProperty(key,colors[i]));document.documentElement.style.setProperty('--accent',colors[1]);$('.theme-dot').style.background=`linear-gradient(135deg,${colors[0]},${colors[1]} 60%,${colors[2]})`;colors.forEach((color,i)=>{$(`#color-${['one','two','three'][i]}`).value=color;$(`#color-${['one','two','three'][i]}-value`).textContent=color.toUpperCase();});}
applyColors();

const settingsDialog=$('#settings-dialog');
function applyStyle(style){document.body.dataset.widgetStyle=style;localStorage.setItem('homepage-widget-style',style);}
applyStyle(localStorage.getItem('homepage-widget-style')||'glass');
$('#icon-source').value=iconSource;$('#widget-style').value=document.body.dataset.widgetStyle;
$('#settings-button').addEventListener('click',()=>settingsDialog.showModal());
$('#close-settings').addEventListener('click',()=>settingsDialog.close());
$('#settings-form').addEventListener('submit',e=>{e.preventDefault();iconSource=$('#icon-source').value.trim()||'';localStorage.setItem('homepage-icon-source',iconSource);applyStyle($('#widget-style').value);colors=['#color-one','#color-two','#color-three'].map(id=>$(id).value);localStorage.setItem('homepage-colors',JSON.stringify(colors));applyColors();settingsDialog.close();renderFavourites();});
['#color-one','#color-two','#color-three'].forEach((selector,i)=>$(selector).addEventListener('input',e=>{colors[i]=e.target.value;applyColors();}));
$('#reset-colors').addEventListener('click',()=>{colors=defaultColors.slice();applyColors();});

async function setWeatherByCity(){const city=$('#weather-city').value.trim();if(!city)return;weatherState('finding city',city);try{const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);if(!response.ok)throw new Error('City search failed');const data=await response.json();const result=data.results?.[0];if(!result){weatherState('city not found · try again',city);return;}loadWeather(result.latitude,result.longitude,result.name+(result.country_code?`, ${result.country_code}`:''));settingsDialog.close();}catch{weatherState('could not connect · retry',city);}}
$('#save-location').addEventListener('click',setWeatherByCity);
$('#weather-city').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setWeatherByCity();}});
$('#use-location').addEventListener('click',()=>{if(!navigator.geolocation){weatherState('location unavailable · enter a city');return;}weatherState('waiting for permission');navigator.geolocation.getCurrentPosition(async ({coords})=>{let place='Local';try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=en&format=json`);const d=await r.json();place=d.results?.[0]?.name||place;}catch{}loadWeather(coords.latitude,coords.longitude,place);settingsDialog.close();},error=>weatherState(error.code===1?'location denied · enter a city':'location unavailable · enter a city'),{timeout:10000,maximumAge:1800000});});
$('#weather').addEventListener('click',()=>settingsDialog.showModal());

const searchInput=$('#search-input'), suggestions=$('#suggestions');let activeSuggestion=-1,currentSuggestions=[];

const suggestionSources=[
  q=>`Search the web for “${q}”`,
  q=>`“${q}” images`,
  q=>`“${q}” meaning`,
  q=>`“${q}” near me`
];
function renderSuggestions(){const q=searchInput.value.trim();suggestions.replaceChildren();activeSuggestion=-1;currentSuggestions=[];searchInput.setAttribute('aria-expanded',String(Boolean(q)));
  if(!q){suggestions.hidden=true;return;}
  currentSuggestions=suggestionSources.map(fn=>fn(q));
  currentSuggestions.forEach((text,i)=>{const option=document.createElement('button');option.type='button';option.className='suggestion-option';option.setAttribute('role','option');option.innerHTML=`<span class="suggestion-icon">${['⌕','▧','✳','⌖'][i]}</span><span></span><span class="suggestion-hint">↵</span>`;option.children[1].textContent=text;option.addEventListener('mousedown',e=>{e.preventDefault();search(text);});suggestions.append(option);});
  suggestions.hidden=false;
}
function search(query){const q=query.trim();if(!q)return;const url=/^https?:\/\//i.test(q)?q:/^[\w-]+\.[a-z]{2,}(\/\S*)?$/i.test(q)?`https://${q}`:`https://www.google.com/search?q=${encodeURIComponent(q)}`;window.location.href=url;}
searchInput.addEventListener('input',renderSuggestions);$('#search-form').addEventListener('submit',e=>{e.preventDefault();const q=currentSuggestions[activeSuggestion]||searchInput.value;search(q);});
searchInput.addEventListener('keydown',e=>{if(suggestions.hidden)return;if(e.key==='ArrowDown'){e.preventDefault();activeSuggestion=Math.min(activeSuggestion+1,currentSuggestions.length-1);}else if(e.key==='ArrowUp'){e.preventDefault();activeSuggestion=Math.max(activeSuggestion-1,0);}else if(e.key==='Escape'){suggestions.hidden=true;return;}else return;suggestions.querySelectorAll('.suggestion-option').forEach((option,i)=>option.classList.toggle('active',i===activeSuggestion));});
document.addEventListener('click',e=>{if(!$('#search-form').contains(e.target)){suggestions.hidden=true;searchInput.setAttribute('aria-expanded','false');}});
