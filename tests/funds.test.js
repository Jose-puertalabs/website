import test from 'node:test';
import assert from 'node:assert/strict';
import {funds,selectFunds,estimateTokens} from '../public/app/funds.js';
test('fund universe has unique routes, required countries and consistent allocations',()=>{
  assert.ok(funds.length>=15);
  assert.equal(new Set(funds.map(f=>f.id)).size,funds.length);
  for(const country of ['Spain','Germany','France','Italy','United States','Brazil','Mexico']) assert.ok(funds.some(f=>f.country===country));
  assert.ok(funds.filter(f=>f.country==='Spain').length>1);
  for(const f of funds){
    assert.equal(f.holdings.reduce((sum,h)=>sum+h.weight,0),100);
    assert.equal(f.distribution.reduce((sum,v)=>sum+v,0),100);
    assert.equal(f.history.at(-1).value,f.nav);
    assert.ok(f.maturity>f.duration);
  }
});
test('reference fund matches supplied fictional values',()=>{
  const f=funds.find(f=>f.symbol==='PSSF');
  assert.deepEqual([f.name,f.currency,f.ytm,f.duration,f.maturity,f.nav,f.aum,f.fee],['Puerta Spanish Sovereign Fund','EUR',3.1,5.4,6.8,101.6,12.8,.35]);
});
test('search, combined filters, empty results and duration boundaries',()=>{
  assert.equal(selectFunds(funds,{search:'  SPAIN  '}).length,3);
  assert.equal(selectFunds(funds,{search:'Spanish Sovereign'}).length,1);
  assert.equal(selectFunds(funds,{country:'Brazil',currency:'USD'}).length,1);
  assert.equal(selectFunds(funds,{country:'Germany',currency:'BRL'}).length,0);
  const edge=[{name:'a',duration:2.9},{name:'b',duration:3},{name:'c',duration:7},{name:'d',duration:7.1}];
  assert.deepEqual(selectFunds(edge,{duration:'medium'}).map(f=>f.duration),[3,7]);
  assert.equal(selectFunds(edge,{duration:'short'}).length,1);
  assert.equal(selectFunds(edge,{duration:'long'}).length,1);
});
test('all table columns sort both ways without mutating source data',()=>{
  const ids=funds.map(f=>f.id);
  for(const sort of ['name','country','currency','ytm','duration','aum','risk']){
    for(const direction of [1,-1]){
      const sorted=selectFunds(funds,{sort,direction});
      for(let i=1;i<sorted.length;i++){
        const a=sorted[i-1][sort],b=sorted[i][sort];
        assert.ok(direction*(typeof a==='number'?a-b:a.localeCompare(b))<=0);
      }
    }
  }
  assert.deepEqual(funds.map(f=>f.id),ids);
});
test('token estimation rejects invalid input and uses NAV, not YTM',()=>{
  assert.equal(estimateTokens(1016,101.6),10);
  for(const value of [NaN,Infinity,-1,0,100000001])assert.equal(estimateTokens(value,101.6),null);
  assert.equal(estimateTokens(1000,0),null);
});
