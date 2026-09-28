// src/systems/EngineerSystem.js

// 通用工程系统：步兵构筑工事；工兵构筑/布雷/排雷。

// V0.5.4 修正：engineer 类型自动获得工程能力；布雷/排雷仅限单位自身所在格。

 

export class EngineerSystem {

  constructor(world) {

    this.world = world;

    if (!Array.isArray(world.minefields)) world.minefields = [];

    if (!Array.isArray(world.fortifications)) world.fortifications = [];

  }

 

  key(q, r) {

    return `${q},${r}`;

  }

 

  getFortification(q, r) {

    return (this.world.fortifications ?? []).find(

      f => Number(f.q) === Number(q) && Number(f.r) === Number(r)

    ) ?? null;

  }

 

  getMinefield(q, r) {

    return (this.world.minefields ?? []).find(

      m => Number(m.q) === Number(q) && Number(m.r) === Number(r)

    ) ?? null;

  }

 

  isEngineer(unit) {

    const type = String(unit?.type ?? "").toLowerCase();

    const branch = String(unit?.branch ?? "").toLowerCase();

    return type === "engineer" || branch === "engineer";

  }

 

  isInfantry(unit) {

    const type = String(unit?.type ?? "").toLowerCase();

    const branch = String(unit?.branch ?? "").toLowerCase();

    return type === "infantry" || branch === "infantry";

  }

 

  // 单位数据中若显式提供 engineering，则保留其数值；

  // 但 engineer 类型无须逐个写 canLayMines/canClearMines。

  profile(unit) {

    const raw = unit?.engineering ?? {};

    const engineer = this.isEngineer(unit);

    const infantry = this.isInfantry(unit);

 

    return {

      canEntrench: engineer || infantry || raw.canEntrench === true,

      fortificationPower:

        Number(raw.fortificationPower ?? (engineer ? 30 : infantry ? 15 : 0)),

      canLayMines: engineer || raw.canLayMines === true,

      canClearMines: engineer || raw.canClearMines === true,

      mineLaying: Number(raw.mineLaying ?? (engineer ? 40 : 0)),

      mineClearing: Number(raw.mineClearing ?? (engineer ? 40 : 0))

    };

  }

 

  canWork(unit) {

    return !!(

      unit &&

      unit.offMap !== true &&

      Number(unit.actionPoints ?? 1) > 0 &&

      !unit.hasActed

    );

  }

 

  isUnitOnHex(unit, q, r) {

    return (

      Number(unit?.q) === Number(q) &&

      Number(unit?.r) === Number(r)

    );

  }

 

  entrench(unit, q, r) {

    const p = this.profile(unit);

 

    if (!p.canEntrench || !this.canWork(unit)) {

      return { ok: false, message: "该单位本回合无法构筑工事" };

    }

 

    // 工事同样限制在单位自身所在格，避免远程施工。

    if (!this.isUnitOnHex(unit, q, r)) {

      return { ok: false, message: "只能在单位当前所在格构筑工事" };

    }

 

    let f = this.getFortification(q, r);

 

    if (!f) {

      f = {

        q: Number(q),

        r: Number(r),

        type: "fieldworks",

        level: 1,

        owner: unit.faction,

        progress: 0

      };

      this.world.fortifications.push(f);

    }

 

    const cap = this.isEngineer(unit) ? 3 : 2;

 

    f.progress = Math.min(

      100,

      Number(f.progress ?? 0) + Number(p.fortificationPower ?? 15)

    );

 

    if (f.progress >= 100 && f.level < cap) {

      f.level += 1;

      f.progress = 0;

    }

 

    unit.actionPoints = 0;

    unit.hasActed = true;

 

    return {

      ok: true,

      message: `${unit.name} 正在构筑工事：${f.level}级，进度${Math.round(f.progress)}%`,

      fortification: f

    };

  }

 

  layMine(unit, q, r) {

    const p = this.profile(unit);

 

    if (!p.canLayMines || !this.canWork(unit)) {

      return { ok: false, message: "只有具备布雷能力且本回合可行动的工兵可执行" };

    }

 

    if (!this.isUnitOnHex(unit, q, r)) {

      return { ok: false, message: "工兵只能在自身当前所在格布置地雷" };

    }

 

    let m = this.getMinefield(q, r);

 

    if (!m) {

      m = {

        q: Number(q),

        r: Number(r),

        owner: unit.faction,

        strength: 0,

        discoveredBy: [unit.faction]

      };

      this.world.minefields.push(m);

    }

 

    // 己方继续加强雷区；若以后加入敌方雷区接触规则，可在这里扩展。

    if (m.owner == null) m.owner = unit.faction;

 

    m.strength = Math.min(

      100,

      Number(m.strength ?? 0) + Number(p.mineLaying ?? 40)

    );

 

    if (!Array.isArray(m.discoveredBy)) m.discoveredBy = [];

    if (!m.discoveredBy.includes(unit.faction)) {

      m.discoveredBy.push(unit.faction);

    }

 

    unit.actionPoints = 0;

    unit.hasActed = true;

 

    return {

      ok: true,

      message: `${unit.name} 完成布雷，雷区强度 ${Math.round(m.strength)}/100`,

      minefield: m

    };

  }

 

  clearMine(unit, q, r) {

    const p = this.profile(unit);

 

    if (!p.canClearMines || !this.canWork(unit)) {

      return { ok: false, message: "只有具备排雷能力且本回合可行动的工兵可执行" };

    }

 

    if (!this.isUnitOnHex(unit, q, r)) {

      return { ok: false, message: "工兵只能在自身当前所在格排除地雷" };

    }

 

    const m = this.getMinefield(q, r);

 

    if (!m) {

      return { ok: false, message: "该地块没有雷区" };

    }

 

    m.strength = Math.max(

      0,

      Number(m.strength ?? 0) - Number(p.mineClearing ?? 40)

    );

 

    unit.actionPoints = 0;

    unit.hasActed = true;

 

    const cleared = m.strength <= 0;

 

    if (cleared) {

      this.world.minefields = this.world.minefields.filter(x => x !== m);

    }

 

    return {

      ok: true,

      message: cleared

        ? "雷区已清除"

        : `排雷后雷区强度 ${Math.round(m.strength)}/100`,

      minefield: cleared ? null : m

    };

  }

}
