import { describe, it, expect } from 'vitest'
import { splitBill, parseReceipt, distanceKm, normalize } from './utils'

describe('Conta Justa',()=>{
  it('distributes indivisible cents and service without changing the total',()=>{
    const result=splitBill({people:['Ana','Bia','Caio'],items:[{id:'1',name:'Porção',amount:10,people:['Ana','Bia','Caio']}],service:10})
    expect(result.total).toBe(1100)
    expect(Object.values(result.totals).reduce((a,b)=>a+b,0)).toBe(1100)
    expect(Math.max(...Object.values(result.totals))-Math.min(...Object.values(result.totals))).toBeLessThanOrEqual(2)
  })
  it('charges only each consumer, including proportional service',()=>{
    const result=splitBill({people:['Ana','Bia'],items:[{id:'1',name:'Massa',amount:60,people:['Ana']},{id:'2',name:'Café',amount:20,people:['Bia']},{id:'3',name:'Sobremesa',amount:20,people:['Ana','Bia']}],service:10})
    expect(result.totals).toEqual({Ana:7700,Bia:3300})
    expect(result.unassigned).toBe(0)
  })
  it('tracks unassigned items and their service instead of hiding them',()=>{
    const result=splitBill({people:['Ana'],items:[{id:'1',name:'Item',amount:10,people:[]},{id:'2',name:'Café',amount:10,people:['Ana']}],service:10})
    expect(result.totals.Ana).toBe(1100)
    expect(result.unassigned).toBe(1100)
    expect(result.total).toBe(2200)
  })
  it('conserves cents across many combinations',()=>{
    for(let n=1;n<=20;n++)for(let cents=1;cents<1000;cents+=17){
      const people=Array.from({length:n},(_,i)=>`Pessoa ${i}`)
      const result=splitBill({people,items:[{id:'1',name:'Item',amount:cents/100,people}],service:12})
      expect(Object.values(result.totals).reduce((a,b)=>a+b,0)+result.unassigned).toBe(result.total)
    }
  })
  it('extracts receipt items without double-counting totals or service',()=>{
    const items=parseReceipt('CAFÉ DA CASA 12,50\n2 SUCOS 20,00\nSUBTOTAL 32,50\nSERVIÇO 3,25\nTOTAL R$ 35,75\nCARTÃO 35,75')
    expect(items.map(x=>({name:x.name,amount:x.amount}))).toEqual([{name:'CAFÉ DA CASA',amount:12.5},{name:'2 SUCOS',amount:20}])
  })
})
describe('Discovery',()=>{
  it('finds Portuguese names regardless of accents and case',()=>expect(normalize('  CAFÉ São Paulo  ')).toBe('cafe sao paulo'))
  it('measures geographic distance correctly',()=>{
    expect(distanceKm(-23.55,-46.63,{latitude:-23.55,longitude:-46.63})).toBe(0)
    expect(distanceKm(0,0,{latitude:0,longitude:1})).toBeCloseTo(111.195,2)
  })
})
