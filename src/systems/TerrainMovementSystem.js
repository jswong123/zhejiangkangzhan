// TerrainMovementSystem.js
// V0.12.3 统一地形移动系统 + scenario 水域规则
export class TerrainMovementSystem {
  constructor(world){ this.world=world; }
  isRoadHex(q,r){
    return (this.world?.roads??[]).some(rd=>(rd.points??rd.path??[]).some(p=>
      Number(Array.isArray(p)?p[0]:p.q)===Number(q) && Number(Array.isArray(p)?p[1]:p.r)===Number(r)
    ));
  }
  classOf(unit){
    if(unit?.naval===true || ['heavy_cruiser','light_cruiser','destroyer','transport','battleship','carrier','submarine'].includes(unit?.type)) return 'naval';
    if(['armor','motorized','reconnaissance'].includes(unit?.type)) return 'vehicle';
    if(['artillery','antitank','antiair'].includes(unit?.type)) return 'artillery';
    if(unit?.type==='cavalry') return 'cavalry';
    if(unit?.type==='engineer') return 'engineer';
    return 'infantry';
  }
  ruleCost(rule,cls){
    if(!rule || typeof rule!=='object') return null;
    const v=rule[cls];
    if(v===false) return Infinity;
    if(v===true) return 1;
    if(Number.isFinite(Number(v))) return Number(v);
    if(Number.isFinite(Number(rule.movementCost))) return Number(rule.movementCost);
    return null;
  }
  cost(unit,q,r){
    const t=this.world?.terrainAt?.(q,r)??'plain', c=this.classOf(unit), road=this.isRoadHex(q,r);
    const rules=this.world?.waterRules??this.world?.config?.waterRules??null;
    if(c==='naval') return t==='water'?1:Infinity;
    if(t==='water'){
      if(road){
        const rc=this.ruleCost(rules?.roadBridge,c);
        return rc!==null?rc:(['vehicle','artillery'].includes(c)?2:1);
      }
      const rc=this.ruleCost(rules?.water,c);
      return rc!==null?rc:Infinity;
    }
    if(t==='marsh' || t==='wetland'){
      const rc=this.ruleCost(rules?.marsh??rules?.wetland,c);
      if(rc!==null) return rc;
      return ({infantry:3,engineer:3,artillery:4,cavalry:4,vehicle:Infinity})[c]??3;
    }
    if(t==='concession'){
      const side=String(unit?.faction??unit?.side??'').toLowerCase();
      return side==='japanese'?Infinity:1;
    }
    if(road){
      if(t==='steepMountain') return ['vehicle','artillery'].includes(c)?Infinity:2;
      return ['vehicle','artillery'].includes(c)?2:1;
    }
    const table={
      plain:{infantry:1,engineer:1,artillery:2,cavalry:1,vehicle:1},
      hill:{infantry:2,engineer:2,artillery:3,cavalry:2,vehicle:3},
      forest:{infantry:2,engineer:2,artillery:3,cavalry:3,vehicle:Infinity},
      mountain:{infantry:3,engineer:3,artillery:4,cavalry:4,vehicle:Infinity},
      steepMountain:{infantry:4,engineer:4,artillery:Infinity,cavalry:Infinity,vehicle:Infinity}
    };
    return table[t]?.[c]??1;
  }
}
