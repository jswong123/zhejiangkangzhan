// src/ui/HexInfoPanel.js
export class HexInfoPanel {
  constructor(element, world){this.el=element;this.world=world;this.selected=null;}
  terrainName(t){return ({plain:'平地',forest:'森林',hill:'丘陵',mountain:'山地',urban:'城镇',marsh:'沼泽',water:'水域',concession:'公共租界（中立区）'}[t]??t??'平地');}
  findNamed(q,r){return (this.world.settlements??[]).find(x=>Number(x.q)===Number(q)&&Number(x.r)===Number(r));}
  wallEdgesAt(q,r){
    const edges=this.world?.wallEdges??this.world?.config?.wallEdges??[];
    return edges.filter(e=>[e?.from,e?.to].some(p=>Number(p?.q)===Number(q)&&Number(p?.r)===Number(r)));
  }
  wallState(edge){
    const max=Math.max(1,Number(edge?.maxHp??1000)); const hp=Math.max(0,Number(edge?.hp??max)); const pct=hp/max;
    if(hp<=0||['breached','destroyed'].includes(String(edge?.status??'').toLowerCase())) return '缺口';
    if(pct<=.25)return '濒临崩塌'; if(pct<=.50)return '严重受损'; if(pct<=.75)return '受损'; return '完整';
  }
  show(q,r){
    this.selected={q,r}; const t=this.world.terrainAt(q,r); const place=this.findNamed(q,r);
    const f=(this.world.fortifications??[]).find(x=>Number(x.q)===q&&Number(x.r)===r);
    const m=(this.world.minefields??[]).find(x=>Number(x.q)===q&&Number(x.r)===r);
    const walls=this.wallEdgesAt(q,r);
    const wallHtml=walls.length?`<div style="margin-top:7px;padding-top:6px;border-top:1px solid #77715d"><strong>城墙状态</strong>${walls.map((w,i)=>{const max=Math.max(1,Number(w.maxHp??1000)),hp=Math.max(0,Number(w.hp??max)),state=this.wallState(w),pass=state==='缺口';return `<br><span>${walls.length>1?`第${i+1}段 · `:''}${w.section??'城墙'}</span><br><span>耐久：${Math.round(hp)} / ${Math.round(max)}</span><br><span>状态：${state}</span><br><span>通行：${pass?'可通过':'禁止'}</span>`;}).join('')}</div>`:'';
    this.el.hidden=false; this.el.innerHTML=`<div class="hex-info-title">地块信息</div>${place?`<strong>${place.nameZh??place.name}</strong><br>`:''}<span>坐标：${q}, ${r}</span><br><span>地形：${this.terrainName(t)}</span><br><span>工事：${f?`${({permanent_fortress:'永固/坚固建筑工事',fortified_building:'仓库坚固工事',urban_barricade:'城市街垒',fieldworks:'野战工事'}[f.type]??'工事')} ${f.level??1}级（${Math.round(f.progress??100)}%）`:'无'}</span><br><span>地雷：${m?`${m.owner==='chinese'?'中国军':'日军'}雷区 ${Math.round(m.strength??0)}/100`:'无'}</span>${wallHtml}`;
  }
}
