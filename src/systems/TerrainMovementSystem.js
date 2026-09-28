// 万家岭山地机动规则：道路优先；陡峭山地对重装备禁行。
export class TerrainMovementSystem {
  constructor(world){ this.world=world; }
  isRoadHex(q,r){
    const roads=this.world?.roads??[];
    return roads.some(rd=>(rd.points??rd.path??[]).some(p=>Number(Array.isArray(p)?p[0]:p.q)===Number(q)&&Number(Array.isArray(p)?p[1]:p.r)===Number(r)));
  }
  classOf(unit){
    if(unit?.naval===true || ['heavy_cruiser','light_cruiser','destroyer','transport','battleship','carrier','submarine'].includes(unit?.type)) return 'naval';
    if(['armor','motorized','reconnaissance'].includes(unit?.type)) return 'vehicle';
    if(['artillery','antitank','antiair'].includes(unit?.type)) return 'artillery';
    if(unit?.type==='cavalry') return 'cavalry';
    if(unit?.type==='engineer') return 'engineer';
    return 'infantry';
  }
  cost(unit,q,r){
    const t=this.world?.terrainAt?.(q,r)??'plain', c=this.classOf(unit), road=this.isRoadHex(q,r);
    if(c==='naval') return t==='water' ? 1 : Infinity;
    // V0.8.3 汉城1979：道路穿过水域的格子视为桥梁。
    // 陆军只能沿 scenario 中明确绘制的桥梁道路跨越汉江。
    if(t==='water' && road) return ['vehicle','artillery'].includes(c) ? 2 : 1;
    if(t==='water') return Infinity;
    // 四行仓库：公共租界为中立区，日军绝对禁入；中国守军可进入/撤退。
    if(t==='concession'){
      const side=String(unit?.faction??unit?.side??'').toLowerCase();
      return side==='japanese' ? Infinity : 1;
    }
    if(road){ if(t==='steepMountain') return ['vehicle','artillery'].includes(c)?Infinity:2; return ['vehicle','artillery'].includes(c)?2:1; }
    const table={plain:{infantry:1,engineer:1,artillery:2,cavalry:1,vehicle:1},hill:{infantry:2,engineer:2,artillery:3,cavalry:2,vehicle:3},forest:{infantry:2,engineer:2,artillery:3,cavalry:3,vehicle:Infinity},mountain:{infantry:3,engineer:3,artillery:4,cavalry:4,vehicle:Infinity},steepMountain:{infantry:4,engineer:4,artillery:Infinity,cavalry:Infinity,vehicle:Infinity},marsh:{infantry:3,engineer:3,artillery:4,cavalry:4,vehicle:Infinity}};
    return table[t]?.[c] ?? 1;
  }
}
