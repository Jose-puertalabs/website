// Entire dataset is fictional. No market feeds or real fund products.
const seeds = [
  ['spanish-sovereign','Spanish Sovereign','PSSF','Spain','ES','EUR',3.10,5.4,6.8,101.60,12.8,2],
  ['spanish-short','Spanish Short Duration','PSSD','Spain','ES','EUR',2.65,1.7,2.1,100.42,8.4,1],
  ['german-sovereign','German Sovereign','PGSF','Germany','DE','EUR',2.45,6.1,7.5,102.15,24.6,2],
  ['german-short','German Treasury Short','PGTS','Germany','DE','EUR',2.10,1.2,1.5,100.18,15.2,1],
  ['french-sovereign','French Sovereign','PFSF','France','FR','EUR',3.05,5.8,7.2,101.24,18.3,2],
  ['french-long','French Long Duration','PFLD','France','FR','EUR',3.55,10.2,14.6,98.72,9.7,3],
  ['italian-sovereign','Italian Sovereign','PISF','Italy','IT','EUR',3.80,5.2,6.4,100.86,14.1,3],
  ['italian-short','Italian Short Duration','PISD','Italy','IT','EUR',3.15,1.9,2.3,100.31,6.9,2],
  ['us-treasury','US Treasury','PUTF','United States','US','USD',4.20,5.6,6.9,103.12,32.5,2],
  ['us-short','US Treasury Short','PUTS','United States','US','USD',3.90,0.8,1.0,100.09,21.8,1],
  ['us-long','US Treasury Long','PUTL','United States','US','USD',4.60,12.4,18.2,97.63,16.4,3],
  ['brazil-local','Brazil Local Sovereign','PBLS','Brazil','BR','BRL',11.25,3.2,4.1,104.32,7.6,4],
  ['brazil-dollar','Brazil Dollar Sovereign','PBDS','Brazil','BR','USD',6.35,5.1,6.3,101.75,5.3,4],
  ['mexico-local','Mexico Local Sovereign','PMLS','Mexico','MX','MXN',8.60,4.3,5.6,102.48,8.9,4],
  ['mexico-dollar','Mexico Dollar Sovereign','PMDS','Mexico','MX','USD',5.70,6.2,7.8,100.92,6.2,3],
  ['spanish-long','Spanish Long Duration','PSLD','Spain','ES','EUR',3.65,9.8,13.2,99.46,4.8,3],
];
export const funds = seeds.map(([id,name,symbol,country,code,currency,ytm,duration,maturity,nav,aum,risk]) => ({
  id, name: `Puerta ${name} Fund`, symbol, country, code, currency, ytm, duration, maturity, nav, aum, risk,
  fee: 0.35, status: 'Illustrative',
  history: [99.1,99.5,99.2,100.1,99.8,100.5,100.2,100.9,100.7,101.2,100.8,101.6].map((value,i)=>({month:['Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26','Jun 26','Jul 26','Aug 26','Sep 26','Oct 26'][i], value: +(value * nav / 101.6).toFixed(2)})),
  holdings: [0.2,0.25,0.3,0.25].map((weight,i)=>({name:`${country} sovereign bond ${i+1}`, coupon:+(ytm-0.8+i*0.4).toFixed(2), maturity:`${2027+Math.max(0,Math.round(maturity)-2)+i}-10-31`, weight:weight*100})),
  distribution: duration < 2 ? [70,25,5,0] : duration > 9 ? [0,10,30,60] : [10,35,40,15],
}));
export const money = (value,currency) => new Intl.NumberFormat('en-GB',{style:'currency',currency,maximumFractionDigits:2}).format(value);
export const flag = code => String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0)));
export function selectFunds(data,{search='',country='',currency='',duration='',sort='name',direction=1}={}) {
  const query=search.trim().toLocaleLowerCase();
  return data.filter(f=>(!query || `${f.name} ${f.country}`.toLocaleLowerCase().includes(query)) && (!country || f.country===country) && (!currency || f.currency===currency) && (!duration || (duration==='short' ? f.duration<3 : duration==='medium' ? f.duration>=3 && f.duration<=7 : f.duration>7)))
    .sort((a,b)=>direction*(typeof a[sort]==='number' ? a[sort]-b[sort] : String(a[sort]).localeCompare(String(b[sort]))));
}
export function estimateTokens(amount,nav) {
  return Number.isFinite(amount) && amount>0 && amount<=100000000 && Number.isFinite(nav) && nav>0 ? amount/nav : null;
}
