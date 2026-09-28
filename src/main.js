// ============================================================
// main.js
// 东线 1941：杜布诺
// V1.4 — 玩家控制 / 阶段同步 / 目标胜利 / 存档 / 读取 / 撤销
// ============================================================
import { WorldMap } from "./WorldMap.js";
import { Camera } from "./Camera.js";
import { Renderer } from "./Renderer.js";
import { UnitSelection } from "./UnitSelection.js";
import { GameState } from "./GameState.js";
import { FactionSelection } from "./FactionSelection.js";
import { TurnSystem } from "./TurnSystem.js";
import { VictorySystem } from "./systems/VictorySystem.js";
import { MovementSystem } from "./systems/MovementSystem.js";
import { CombatSystem } from "./systems/CombatSystem.js";
import { AISystem } from "./systems/AISystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { UndoSystem } from "./systems/UndoSystem.js";
import { pixelToHex } from "./Hex.js";
import { CampaignSelection } from "./ui/CampaignSelection.js";
import { ScenarioManager } from "./scenarios/ScenarioManager.js";
import { FactionSystem } from "./systems/FactionSystem.js";
import { ReinforcementSystem } from "./systems/ReinforcementSystem.js";
import { StrategicObjectives } from "./systems/StrategicObjectives.js";
import { EngineerSystem } from "./systems/EngineerSystem.js";
import { HexInfoPanel } from "./ui/HexInfoPanel.js";
// ============================================================
// 多战场战役系统
// ============================================================
let currentScenarioKey = null;
let currentScenarioConfig = null;
const campaignSelection = new CampaignSelection();
function getScenarioConfig() {
    return currentScenarioConfig ?? {
        id: currentScenarioKey ?? "dubno",
        name: scenario?.name ?? "战役",
        factions: ["GER", "USSR"],
        start: { year:1941, month:6, day:26, hour:8, minute:0, hoursPerTurn:2, startingPhase:"german" }
    };
}
function showScenarioSelection() {
    const hasActiveBattle = !!currentScenarioKey && Array.isArray(units) && units.length > 0;
    campaignSelection.show(
        async scenarioId => { await loadScenario(scenarioId); },
        {
            hasActiveBattle,
            onMainMenu: () => showMainMenu(),
            onReturnToBattle: () => { hideMainMenu(); document.getElementById('pauseMenu')?.setAttribute('hidden',''); render(); }
        }
    );
}
// ============================================================
// DOM
// ============================================================
const canvas =
    document.getElementById("game-canvas");
const mapArea =
    document.getElementById("mapArea");
const unitInfo =
    document.getElementById("unitInfo");
const turnInfo =
    document.getElementById("turnInfo");
const turnNumber =
    document.getElementById("turnNumber");
const turnTime =
    document.getElementById("turnTime");
const turnPhase =
    document.getElementById("turnPhase");
const endPhaseButton =
    document.getElementById("endPhaseButton");
const reinforcementPanel = document.getElementById("reinforcementPanel");
const reinforcementNext = document.getElementById("reinforcementNext");
const reinforcementLog = document.getElementById("reinforcementLog");
const hexInfoElement = document.getElementById("hexInfoPanel");
const engineerActions = document.getElementById("engineerActions");
const buildFortButton = document.getElementById("buildFortButton");
const layMineButton = document.getElementById("layMineButton");
const clearMineButton = document.getElementById("clearMineButton");
if (!canvas) {
    throw new Error(
        "找不到 #game-canvas，请检查 index.html"
    );
}
// ============================================================
// 游戏核心对象
// ============================================================
const world =
    new WorldMap();
const camera =
    new Camera();
const renderer =
    new Renderer(
        canvas,
        world,
        camera
    );
const gameState =
    new GameState();
const scenarioManager = new ScenarioManager({ world, gameState });
const selection =
    new UnitSelection(
        renderer,
        gameState
    );
const movementSystem =
    new MovementSystem(
        world
    );
const combatSystem =
    new CombatSystem(
        world
    );
const aiSystem =
    new AISystem(
        movementSystem,
        combatSystem
    );
const factionSelection =
    new FactionSelection(
        gameState
    );
const saveSystem = new SaveSystem({ maxSlots: 3, storagePrefix: "frontline-1937-1945-v0.3" });
const undoSystem = new UndoSystem({ maxHistory: 30 });
// ============================================================
// 游戏状态
// 必须先声明，再初始化任何会读取 turnSystem / scenario 的系统。
// ============================================================
let scenario = null;
let units = [];
let turnSystem = null;
let victorySystem = null;
let lastBattleMessage = "";
let selectedUnit = null;
let gameOver = false;
let aiRunning = false;

const reinforcementSystem = new ReinforcementSystem(world);
const strategicObjectives = new StrategicObjectives({
    getPlayerFaction: () => getPlayerSide(),
    getTurn: () => turnSystem?.turn ?? 1,
    getUnits: () => units,
    container: document.getElementById("strategicObjectives")
});
// 此时 turnSystem 已经完成声明（初值为 null），因此首次渲染安全回退到第1回合。
strategicObjectives.init();
const engineerSystem = new EngineerSystem(world);
const hexInfoPanel = new HexInfoPanel(hexInfoElement, world);
let selectedHex = null;
renderer.movementSystem =
    movementSystem;
// ============================================================
// 鼠标状态
// ============================================================
let isDragging = false;
let dragMoved = false;
let lastMouseX = 0;
let lastMouseY = 0;
// ============================================================
// Canvas
// ============================================================
function resizeCanvas() {
    const container = mapArea ?? canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    // Renderer / Camera / 鼠标命中统一使用 CSS 像素。
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
}
// ============================================================
// 渲染
// ============================================================
function render() {
    renderer.render(
        units.filter(unit => unit.offMap !== true)
    );
}
// ============================================================
// 阵营标准化
// ============================================================
function normalizeSide(side) {
    const faction = FactionSystem.getFaction(side);
    if (faction?.side) return faction.side;
    const value = String(side ?? "").trim().toLowerCase();
    const aliases = { chinese:"chinese", china:"chinese", chn:"chinese", japanese:"japanese", japan:"japanese", jpn:"japanese" };
    return aliases[value] ?? value;
}
// ============================================================
// 获取单位阵营
// ============================================================
function getUnitSide(unit) {
    return normalizeSide(
        unit?.side ??
        unit?.faction ??
        unit?.camp
    );
}
// ============================================================
// 玩家阵营
// ============================================================
function getPlayerSide() {
    // FactionSelection / GameState 不同版本可能使用不同字段。
    // 这里统一兼容，避免“界面显示苏军，但控制逻辑仍读取德军”的问题。
    const candidates = [
        gameState.playerFaction,
        gameState.playerSide,
        gameState.selectedFaction,
        gameState.selectedSide,
        gameState.side,
        gameState.faction
    ];
    for (const value of candidates) {
        const side = normalizeSide(value);
        if (["german", "soviet", "chinese", "japanese", "british", "italian", "american", "allied", "rok_government", "new_military"].includes(side)) {
            return side;
        }
    }
    return "";
}
// ============================================================
// 单位是否存活
// ============================================================
function isUnitAlive(unit) {
    if (!unit) {
        return false;
    }
    if (unit.destroyed === true || unit.offMap === true) {
        return false;
    }
    const strength =
        Number(unit.strength);
    const manpower =
        Number(unit.manpower);
    // 任意一个有效兵力字段 <= 0，都视为阵亡
    if (
        Number.isFinite(strength) &&
        strength <= 0
    ) {
        return false;
    }
    if (
        Number.isFinite(manpower) &&
        manpower <= 0
    ) {
        return false;
    }
    return true;
}
// ============================================================
// 单位名称
// ============================================================
function unitName(unit) {
    return (
        unit?.nameZh ??
        unit?.name ??
        unit?.id ??
        "未命名单位"
    );
}
// ============================================================
// 当前兵力
// ============================================================
function getUnitStrength(unit) {
    // strength 是唯一的实时生命力主字段。
    // manpower 仅作为旧数据兼容回退。
    const value =
        Number(
            unit?.strength ??
            unit?.manpower ??
            100
        );
    return Number.isFinite(value)
        ? value
        : 100;
}
// ============================================================
// 最大兵力
// ============================================================
function getUnitMaxStrength(unit) {
    // maxStrength 是最大生命力主字段。
    // maxManpower 仅作为旧数据兼容回退。
    const value =
        Number(
            unit?.maxStrength ??
            unit?.initialStrength ??
            unit?.maxManpower ??
            100
        );
    return Number.isFinite(value)
        ? value
        : 100;
}
// ============================================================
// 兵力显示
// ============================================================
function getStrengthText(unit) {
    return (
        `${Math.max(0, Math.round(getUnitStrength(unit)))} / ` +
        `${Math.max(1, Math.round(getUnitMaxStrength(unit)))}`
    );
}
// ============================================================
// units.json 单位标准化
// ============================================================
function normalizeUnit(rawUnit) {
 const strength =
    Number(
        rawUnit.strength ??
        rawUnit.manpower ??
        100
    );
const maxStrength =
    Number(
        rawUnit.maxStrength ??
        rawUnit.maxManpower ??
        rawUnit.strength ??
        rawUnit.manpower ??
        100
    );
    const movement =
        Number(
            rawUnit.movement ??
            rawUnit.maxMovementPoints ??
            rawUnit.movementPoints ??
            4
        );
    const faction =
        normalizeSide(
            rawUnit.faction ??
            rawUnit.side ??
            rawUnit.camp
        );
    return {
        ...rawUnit,
        id:
            String(
                rawUnit.id ?? ""
            ),
        name:
            String(
                rawUnit.name ??
                rawUnit.nameZh ??
                rawUnit.id ??
                "未知单位"
            ),
        faction,
        side:
            faction,
        type:
            rawUnit.type ??
            rawUnit.unitType ??
            "infantry",
        q:
            Number(
                rawUnit.q
            ),
        r:
            Number(
                rawUnit.r
            ),
        strength:
            Math.max(
                0,
                strength
            ),
        maxStrength:
            Math.max(
                1,
                maxStrength
            ),
        manpower:
            Math.max(
                0,
                strength
            ),
        maxManpower:
            Math.max(
                1,
                maxStrength
            ),
        echelon:
            rawUnit.echelon ??
            "battalion",
        minRange:
            Number(
                rawUnit.minRange ??
                (rawUnit.type === "artillery" ? 2 : 1)
            ),
        maxRange:
            Number(
                rawUnit.maxRange ??
                rawUnit.range ??
                1
            ),
        attack:
            Number(
                rawUnit.attack ?? 5
            ),
        defense:
            Number(
                rawUnit.defense ?? 5
            ),
        range:
            Number(
                rawUnit.range ?? 1
            ),
        movement,
        maxMovementPoints:
            movement,
        movementPoints:
            movement,
        destroyed:
            strength <= 0,
        hasAttacked:
            false,
        morale:
            Number(
                rawUnit.morale ?? 80
            ),
        suppression:
            Number(
                rawUnit.suppression ?? 0
            ),
        fatigue:
            Number(
                rawUnit.fatigue ?? 0
            ),
        ammunition:
            Number(
                rawUnit.ammunition ??
                rawUnit.ammo ??
                100
            ),
        ammo:
            Number(
                rawUnit.ammo ??
                rawUnit.ammunition ??
                100
            )
    };
}
// ============================================================
// 加载 units.json
// ============================================================
async function loadUnitsFromJSON(unitsPath = "./data/units.json") {
    console.log(
        `[单位系统] 正在读取 ${unitsPath}`
    );
    const response =
        await fetch(
            unitsPath,
            {
                cache: "no-store"
            }
        );
    if (!response.ok) {
        throw new Error(
            `units.json 加载失败：HTTP ${response.status}`
        );
    }
    const data =
        await response.json();
    if (
        !data ||
        !Array.isArray(
            data.units
        )
    ) {
        throw new Error(
            "units.json 格式错误：找不到 units 数组"
        );
    }
    const loadedUnits =
        data.units.map(
            normalizeUnit
        );
    console.log(
        `[单位系统] units.json 加载成功：${loadedUnits.length} 个单位`
    );
    return loadedUnits;
}
// ============================================================
// 单位数据检查
// ============================================================
function validateUnits(
    unitList
) {
    const ids =
        new Set();
    const positions =
        new Map();
    let errors =
        0;
    for (
        const unit
        of unitList
    ) {
        // ----------------------------------------------------
        // ID
        // ----------------------------------------------------
        if (!unit.id) {
            console.error(
                "[单位数据] 存在没有 ID 的单位",
                unit
            );
            errors++;
        }
        else if (
            ids.has(
                unit.id
            )
        ) {
            console.error(
                `[单位数据] 重复单位 ID：${unit.id}`
            );
            errors++;
        }
        else {
            ids.add(
                unit.id
            );
        }
        // ----------------------------------------------------
        // 阵营
        // ----------------------------------------------------
        if (
            !["german", "soviet", "chinese", "japanese", "british", "italian", "american", "allied", "rok_government", "new_military"].includes(getUnitSide(unit))
        ) {
            console.error(
                `[单位数据] ${unit.id} 阵营错误：${unit.faction}`
            );
            errors++;
        }
        // ----------------------------------------------------
        // 地图外增援单位不参与坐标/占格检查
        // ----------------------------------------------------
        if (unit.offMap === true) {
            continue;
        }
        // ----------------------------------------------------
        // 坐标
        // ----------------------------------------------------
        if (
            !Number.isFinite(
                unit.q
            ) ||
            !Number.isFinite(
                unit.r
            )
        ) {
            console.error(
                `[单位数据] ${unit.id} 坐标无效`
            );
            errors++;
            continue;
        }
        // ----------------------------------------------------
        // 一格一单位
        // ----------------------------------------------------
        if (
            isUnitAlive(unit)
        ) {
            const key =
                `${unit.q},${unit.r}`;
            if (
                positions.has(
                    key
                )
            ) {
                const existing =
                    positions.get(
                        key
                    );
                console.error(
                    `[部署冲突] ${existing.id} 与 ${unit.id} 同时位于 (${unit.q}, ${unit.r})`
                );
                errors++;
            }
            else {
                positions.set(
                    key,
                    unit
                );
            }
        }
    }
    if (
        errors === 0
    ) {
        console.log(
            `[单位系统] 数据检查通过：${unitList.length} 个单位`
        );
        return true;
    }
    console.error(
        `[单位系统] 数据检查失败：发现 ${errors} 个问题`
    );
    return false;
}
// ============================================================
// 初始化单位
// ============================================================
function initializeUnits() {
    for (
        const unit
        of units
    ) {
        const side =
            getUnitSide(
                unit
            );
        unit.side =
            side;
        unit.faction =
            side;
        if (
            unit.strength ==
            null
        ) {
            unit.strength =
                100;
        }
        if (
            unit.maxStrength ==
            null
        ) {
            unit.maxStrength =
                unit.strength;
        }
        if (
            unit.strength <= 0
        ) {
            unit.strength = 0;
            unit.destroyed = true;
        }
        combatSystem.resetUnit(
            unit
        );
        if (
            typeof movementSystem.initializeUnit ===
            "function"
        ) {
            movementSystem.initializeUnit(
                unit
            );
        }
        if (
            unit.morale ==
            null
        ) {
            unit.morale =
                80;
        }
        if (
            unit.suppression ==
            null
        ) {
            unit.suppression =
                0;
        }
        if (
            unit.fatigue ==
            null
        ) {
            unit.fatigue =
                0;
        }
        if (
            unit.ammunition ==
            null
        ) {
            unit.ammunition =
                unit.ammo ??
                100;
        }
        if (
            unit.ammo ==
            null
        ) {
            unit.ammo =
                unit.ammunition;
        }
    }
}
// ============================================================
// 回合系统
// ============================================================
function initializeTurnSystem() {
    const config = getScenarioConfig();

    const attacker = normalizeSide(
        config?.roles?.attacker ??
        FactionSystem.getFaction(config?.factions?.[0])?.side ??
        "german"
    );

    const defender = normalizeSide(
        config?.roles?.defender ??
        FactionSystem.getFaction(config?.factions?.[1])?.side ??
        "soviet"
    );

    const startingPhase = normalizeSide(
        config?.start?.startingPhase ?? attacker
    );

    // 当前战役颜色规则同步给 Renderer。
    renderer.setScenarioSides?.(attacker, defender);

    // 行动顺序必须从 startingPhase 开始。
    const phaseOrder = startingPhase === defender
        ? [defender, attacker]
        : [attacker, defender];

    turnSystem = new TurnSystem({
        units,
        year: config.start.year,
        month: config.start.month,
        day: config.start.day,
        hour: config.start.hour,
        minute: config.start.minute,
        hoursPerTurn: config.start.hoursPerTurn,
        startingPhase,
        phaseOrder
    });

    turnSystem.onPhaseChanged = () => {
        clearSelection();
        updateTurnUI();
        render();
    };

    turnSystem.onTurnChanged = () => {
        processReinforcementsForCurrentTurn();
        updateTurnUI();
        if (!gameOver) checkVictory();
        render();
    };

    turnSystem.onTimeChanged = () => {
        updateTurnUI();
    };

    updateTurnUI();
}
// ============================================================
// 增援 UI
// ============================================================
function updateReinforcementUI() {
    if (!reinforcementPanel || !turnSystem) return;
    const supportsReinforcements = reinforcementSystem.groups.length > 0;
    reinforcementPanel.hidden = !supportsReinforcements;
    if (!supportsReinforcements) return;

    const pending = reinforcementSystem.getPendingGroups(turnSystem.turn, units);
    if (reinforcementNext) {
        if (!pending.length) {
            reinforcementNext.innerHTML = `<div class="reinforcement-empty">暂无待到达增援</div>`;
        } else {
            reinforcementNext.innerHTML = pending.slice(0,4).map(g => `
                <div class="reinforcement-item">
                    <div class="reinforcement-title">第${g.turn}回合 · ${g.name}</div>
                    <div class="reinforcement-detail">${g.detail}</div>
                    <div class="reinforcement-meta">${g.unitCount}个算子 · ${g.turnsRemaining===0?'本回合到达':`还有${g.turnsRemaining}回合`}</div>
                </div>`).join("");
        }
    }
    if (reinforcementLog) {
        const log=reinforcementSystem.getArrivalLog();
        reinforcementLog.innerHTML = log.length
            ? log.slice(0,4).map(x=>`<div class="reinforcement-log-item">第${x.turn}回合：${x.name}（${x.count}个算子）</div>`).join("")
            : `<div class="reinforcement-empty">暂无增援到达</div>`;
    }
}

function processReinforcementsForCurrentTurn() {
    if (!turnSystem || reinforcementSystem.groups.length === 0) return;
    const result=reinforcementSystem.processTurn(turnSystem.turn, units);
    for (const arrival of result.reinforcements ?? []) {
        console.log(`[增援] ${arrival.message}`);
        writeBattleMessage?.(`增援到达：${arrival.message}`);
    }
    updateReinforcementUI();
}

// ============================================================
// 回合 UI
// ============================================================
function updateTurnUI() {
    if (!turnSystem) {
        return;
    }
    updateReinforcementUI();
    strategicObjectives.onTurnChanged();
    if (
        turnInfo &&
        typeof turnSystem.getHeaderText ===
        "function"
    ) {
        turnInfo.textContent =
            turnSystem.getHeaderText();
    }
    const number =
        typeof turnSystem.getTurnNumber ===
        "function"
            ? turnSystem.getTurnNumber()
            : turnSystem.turn ?? 1;
    if (turnNumber) {
        turnNumber.textContent =
            `第${number}回合`;
    }
    if (
        turnTime &&
        typeof turnSystem.getTurnTimeRange ===
        "function"
    ) {
        turnTime.textContent =
            turnSystem.getTurnTimeRange();
    }
    const phase =
        normalizeSide(
            turnSystem.phase
        );
    const phaseName = `${FactionSystem.getSideName(phase)}行动`;
    if (turnPhase) {
        turnPhase.textContent =
            typeof turnSystem.getPhaseName ===
            "function"
                ? turnSystem.getPhaseName()
                : phaseName;
    }
    if (endPhaseButton) {
        endPhaseButton.textContent = "结束回合";
    }
    updateReinforcementUI();
}
// ============================================================
// 当前行动阶段
// ============================================================
function isUnitActive(unit) {
    if (!unit) {
        return false;
    }
    if (!turnSystem) {
        return true;
    }
    return (
        getUnitSide(unit) ===
        normalizeSide(
            turnSystem.phase
        )
    );
}
// ============================================================
// 玩家能否控制单位
// ============================================================
function playerCanControlUnit(unit) {
    if (!unit || !isUnitAlive(unit) || gameOver || aiRunning) {
        return false;
    }
    if (String(gameState.mode).toLowerCase() === "developer") {
        return true;
    }
    if (String(gameState.mode).toLowerCase() === "observer") {
        return false;
    }
    const unitSide = getUnitSide(unit);
    const playerSide = getPlayerSide();
    const phaseSide = normalizeSide(turnSystem?.phase);
    // 没有明确玩家阵营时，绝不默认允许控制，防止误控 AI 阵营。
    if (!["german", "soviet", "chinese", "japanese", "british", "italian", "american", "allied", "rok_government", "new_military"].includes(playerSide)) {
        return false;
    }
    // 只能控制玩家自己选择的阵营。
    if (unitSide !== playerSide) {
        return false;
    }
    // 只能在本方行动阶段操作。
    if (turnSystem && phaseSide !== playerSide) {
        return false;
    }
    return true;
}
// ============================================================
// 查看单位
// ============================================================
function playerCanViewUnit(unit) {
    return (
        unit != null &&
        isUnitAlive(unit)
    );
}
// ============================================================
// 清除移动范围
// ============================================================
function clearReachable() {
    if (
        typeof renderer.clearReachable ===
        "function"
    ) {
        renderer.clearReachable();
    }
    if (
        movementSystem.reachable instanceof
        Map
    ) {
        movementSystem.reachable.clear();
    }
}
// ============================================================
// 清除选择
// ============================================================
function clearSelection() {
    selectedUnit =
        null;
    if (
        typeof selection.clear ===
        "function"
    ) {
        selection.clear();
    }
    if (
        typeof renderer.setSelectedUnit ===
        "function"
    ) {
        renderer.setSelectedUnit(
            null
        );
    }
    if (
        typeof movementSystem.clear ===
        "function"
    ) {
        movementSystem.clear();
    }
    clearReachable();
    if (unitInfo) {
        unitInfo.innerHTML =
            '<p class="hint">点击地图上的单位查看详情</p>';
    }
}
// ============================================================
// 单位信息
// ============================================================
function showUnitInfo(unit) {
    if (
        !unitInfo ||
        !unit
    ) {
        return;
    }
    const side =
        getUnitSide(
            unit
        );
    const sideName = FactionSystem.getSideName(side) || "未知";
    const name =
        unitName(
            unit
        );
    const type =
        unit.typeZh ??
        unit.type ??
        unit.unitType ??
        "未知";
    const ap =
        unit.movementPoints ??
        unit.actionPoints ??
        unit.ap ??
        "—";
    const maxAP =
        unit.maxMovementPoints ??
        unit.maxActionPoints ??
        unit.maxAP ??
        "—";
    const attackValue =
        combatSystem.getAttack(
            unit
        );
    const defenseValue =
        combatSystem.getDefense(
            unit
        );
    const rangeValue =
        combatSystem.getRange(
            unit
        );
    const active =
        playerCanControlUnit(
            unit
        );
    unitInfo.innerHTML = `
        <div class="unit-title">
            ${name}
        </div>
        <div class="unit-row">
            <span>指挥官</span>
            <strong class="unit-commander">${unit.commander ?? unit.commanderName ?? "不详"}</strong>
        </div>
        <div class="unit-row">
            <span>隶属</span>
            <strong>${unit.parentFormation ?? unit.parent ?? unit.formation ?? "—"}</strong>
        </div>
        <div class="unit-row">
            <span>ID</span>
            <strong>${unit.id}</strong>
        </div>
        <div class="unit-row">
            <span>阵营</span>
            <strong>${sideName}</strong>
        </div>
        <div class="unit-row">
            <span>兵种</span>
            <strong>${type}</strong>
        </div>
        <div class="unit-row">
            <span>编制</span>
            <strong>${unit.echelon ?? "—"}</strong>
        </div>
        <div class="unit-row">
            <span>行动点</span>
            <strong>${ap} / ${maxAP}</strong>
        </div>
        <div class="unit-row">
            <span>兵力</span>
            <strong>${getStrengthText(unit)}</strong>
        </div>
        <div class="unit-row">
            <span>攻击</span>
            <strong>${attackValue}</strong>
        </div>
        <div class="unit-row">
            <span>防御</span>
            <strong>${defenseValue}</strong>
        </div>
        <div class="unit-row">
            <span>射程</span>
            <strong>${rangeValue}</strong>
        </div>
        <div class="unit-row">
            <span>攻击状态</span>
            <strong>
                ${
                    unit.hasAttacked
                        ? "本阶段已攻击"
                        : "可攻击"
                }
            </strong>
        </div>
        <div class="unit-row">
            <span>士气</span>
            <strong>${unit.morale ?? "—"}</strong>
        </div>
        <div class="unit-row">
            <span>压制</span>
            <strong>${unit.suppression ?? "—"}</strong>
        </div>
        <div class="unit-row">
            <span>疲劳</span>
            <strong>${unit.fatigue ?? "—"}</strong>
        </div>
        <div class="unit-row">
            <span>弹药</span>
            <strong>${unit.ammunition ?? "—"}</strong>
        </div>
        <div class="unit-row">
            <span>位置</span>
            <strong>${unit.q}, ${unit.r}</strong>
        </div>
        <div class="unit-row">
            <span>状态</span>
            <strong>
                ${
                    active
                        ? "可行动"
                        : "不可行动"
                }
            </strong>
        </div>
    `;
    if (lastBattleMessage) {
        unitInfo.insertAdjacentHTML(
            "beforeend",
            `<hr><div class="battle-message" role="status" aria-live="polite"></div>`
        );
        const messageBox = unitInfo.querySelector(".battle-message");
        if (messageBox) messageBox.textContent = lastBattleMessage;
    }
}
// ============================================================
// 计算移动范围
// ============================================================
function calculateReachable(unit) {
    clearReachable();
    if (
        !unit ||
        !isUnitAlive(unit)
    ) {
        return;
    }
    movementSystem.selectUnit(
        unit,
        units
    );
    if (
        typeof renderer.setReachable ===
        "function"
    ) {
        renderer.setReachable(
            movementSystem.reachable
        );
    }
}
// ============================================================
// 选择单位
// ============================================================
function selectUnit(unit) {
    if (
        !unit ||
        !isUnitAlive(unit)
    ) {
        return;
    }
    selectedUnit =
        unit;
    if (
        typeof selection.select ===
        "function"
    ) {
        selection.select(
            unit
        );
    }
    if (
        typeof renderer.setSelectedUnit ===
        "function"
    ) {
        renderer.setSelectedUnit(
            unit
        );
    }
    showUnitInfo(
        unit
    );
    if (
        playerCanControlUnit(
            unit
        )
    ) {
        calculateReachable(
            unit
        );
    }
    else {
        clearReachable();
    }
    render();
}
// ============================================================
// 查找 Hex 上的存活单位
// ============================================================
function unitAtHex(
    q,
    r
) {
    return (
        units.find(
            unit =>
                isUnitAlive(unit) &&
                Number(unit.q) ===
                Number(q) &&
                Number(unit.r) ===
                Number(r)
        ) ?? null
    );
}
// ============================================================
// 屏幕 -> 世界坐标
// ============================================================
function screenToWorld(
    screenX,
    screenY
) {
    const zoom =
        camera.zoom ?? 1;
    const offsetX =
        camera.x ??
        camera.offsetX ??
        0;
    const offsetY =
        camera.y ??
        camera.offsetY ??
        0;
    return {
        x:
            (
                screenX -
                offsetX
            ) / zoom,
        y:
            (
                screenY -
                offsetY
            ) / zoom
    };
}
// ============================================================
// 鼠标 -> Hex
// ============================================================
function mouseToHex(event) {
    const rect =
        canvas.getBoundingClientRect();
    const mouseX =
        event.clientX -
        rect.left;
    const mouseY =
        event.clientY -
        rect.top;
    const worldPosition =
        screenToWorld(
            mouseX,
            mouseY
        );
    const hexSize =
        renderer.hexSize ??
        renderer.size ??
        18;
    return pixelToHex(
        worldPosition.x,
        worldPosition.y,
        hexSize
    );
}
// ============================================================
// 点击单位检测
// ============================================================
function findUnitAtMouse(event) {
    const hex =
        mouseToHex(
            event
        );
    if (!hex) {
        return null;
    }
    const direct =
        unitAtHex(
            hex.q,
            hex.r
        );
    if (direct) {
        return direct;
    }
    if (
        typeof selection.findUnitAt ===
        "function"
    ) {
        const rect =
            canvas.getBoundingClientRect();
        const x =
            event.clientX -
            rect.left;
        const y =
            event.clientY -
            rect.top;
        const found =
            selection.findUnitAt(
                x,
                y,
                units,
                camera,
                renderer
            );
        if (
            found &&
            isUnitAlive(found)
        ) {
            return found;
        }
    }
    return null;
}
// ============================================================
// 玩家移动
// ============================================================
function tryMoveSelectedUnit(
    q,
    r
) {
    if (
        !selectedUnit ||
        !playerCanControlUnit(
            selectedUnit
        )
    ) {
        return false;
    }
    // ========================================================
    // 一格一单位
    // ========================================================
    const occupyingUnit =
        unitAtHex(
            q,
            r
        );
    if (
        occupyingUnit &&
        occupyingUnit !==
        selectedUnit
    ) {
        console.log(
            `[移动] Hex (${q}, ${r}) 已被 ${unitName(occupyingUnit)} 占据`
        );
        return false;
    }
    if (
        !movementSystem.canMoveTo(
            q,
            r,
            units
        )
    ) {
        return false;
    }
    undoSystem.push({ units, turnSystem, gameOver }, `移动：${unitName(selectedUnit)}`);
    const moveResult =
        movementSystem.moveTo(
            q,
            r,
            units
        );
    if (
        !moveResult ||
        moveResult.success === false
    ) {
        undoSystem.discardLast();
        return false;
    }
    selectedUnit =
        moveResult.unit ??
        selectedUnit;
    if (
        typeof selection.select ===
        "function"
    ) {
        selection.select(
            selectedUnit
        );
    }
    if (
        typeof renderer.setSelectedUnit ===
        "function"
    ) {
        renderer.setSelectedUnit(
            selectedUnit
        );
    }
    if (
        typeof renderer.setReachable ===
        "function"
    ) {
        renderer.setReachable(
            movementSystem.reachable
        );
    }
    selectedHex = { q:Number(selectedUnit.q), r:Number(selectedUnit.r) };
    hexInfoPanel.show(selectedHex.q, selectedHex.r);
    refreshEngineerActions();
    showUnitInfo(
        selectedUnit
    );
    render();
    updateSaveControls();
    return true;
}
// ============================================================
// 战斗消息
// ============================================================
function writeBattleMessage(
    message
) {
    lastBattleMessage = String(message ?? "");
    console.log(
        "[战斗]",
        lastBattleMessage
    );
    if (unitInfo) {
        const existing = unitInfo.querySelector(".battle-message");
        if (existing) {
            existing.textContent = lastBattleMessage;
        } else {
            unitInfo.insertAdjacentHTML(
                "beforeend",
                `<hr><div class="battle-message" role="status" aria-live="polite"></div>`
            );
            const messageBox = unitInfo.querySelector(".battle-message");
            if (messageBox) messageBox.textContent = lastBattleMessage;
        }
    }
}
// ============================================================
// 死亡单位处理
// ============================================================
function removeDestroyedUnits() {
    for (const unit of units) {
        if (!unit) {
            continue;
        }
        // --------------------------------------------------------
        // 同时读取 strength / manpower
        //
        // CombatSystem 的不同版本可能修改其中任意一个字段，
        // 因此不能再只依赖 manpower ?? strength。
        // --------------------------------------------------------
        const strengthValue =
            Number(unit.strength);
        const manpowerValue =
            Number(unit.manpower);
        const strengthDead =
            Number.isFinite(strengthValue) &&
            strengthValue <= 0;
        const manpowerDead =
            Number.isFinite(manpowerValue) &&
            manpowerValue <= 0;
        // --------------------------------------------------------
        // 任意一套兵力系统确认单位死亡，就统一判定阵亡
        // --------------------------------------------------------
        const dead =
            unit.destroyed === true ||
            strengthDead ||
            manpowerDead;
        if (!dead) {
            continue;
        }
        // --------------------------------------------------------
        // 统一死亡状态
        // --------------------------------------------------------
        unit.strength = 0;
        unit.manpower = 0;
        unit.destroyed = true;
        unit.movementPoints = 0;
        unit.actionPoints = 0;
        unit.hasAttacked = true;
        console.log(
            `[单位系统] ${unit.id} 已被消灭，停止显示与行动`
        );
        // --------------------------------------------------------
        // 如果当前选中的正好是阵亡单位
        // --------------------------------------------------------
        if (
            selectedUnit === unit ||
            (
                selectedUnit?.id &&
                unit.id &&
                selectedUnit.id === unit.id
            )
        ) {
            selectedUnit = null;
        }
    }
    // ------------------------------------------------------------
    // 清除死亡单位选择状态
    // ------------------------------------------------------------
    if (
        selectedUnit &&
        !isUnitAlive(selectedUnit)
    ) {
        clearSelection();
    }
    // ------------------------------------------------------------
    // 阵亡单位继续保留在 units 中。
    // VictorySystem 的 HQ 全灭判定仍然需要这些数据。
    // ------------------------------------------------------------
    gameState.units = units;
}
// ============================================================
// 胜负检查
// ============================================================
// ============================================================
// 战役结束弹窗
// ============================================================
function showVictoryModal(result) {
    // 弹窗样式由 main.js 自行注入，避免依赖额外 CSS 文件。
    if (!document.getElementById("victory-modal-style")) {
        const style = document.createElement("style");
        style.id = "victory-modal-style";
        style.textContent = `
            #victory-modal { position: fixed; inset: 0; z-index: 100000; font-family: FangSong, STFangsong, SimSun, serif; }
            #victory-modal .victory-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; background: rgba(18,20,17,.72); backdrop-filter: blur(2px); }
            #victory-modal .victory-window { width: min(560px, calc(100vw - 48px)); box-sizing: border-box; padding: 34px 38px 30px; border: 2px solid #5a5646; outline: 1px solid #c6b98b; outline-offset: -8px; background: #d6cfb2; color: #24251f; box-shadow: 0 18px 60px rgba(0,0,0,.48); text-align: center; }
            #victory-modal .victory-decoration { margin-bottom: 18px; font-size: 14px; letter-spacing: .18em; color: #5b584b; }
            #victory-modal .victory-title { font-size: clamp(34px,5vw,52px); font-weight: 700; letter-spacing: .12em; line-height: 1.15; }
            #victory-modal .victory-subtitle { margin-top: 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; letter-spacing: .16em; color: #555246; }
            #victory-modal .victory-line { width: 72%; height: 1px; margin: 22px auto; background: #77715d; }
            #victory-modal .victory-reason { min-height: 28px; margin-bottom: 22px; font-size: 18px; line-height: 1.65; }
            #victory-modal .victory-details { width: min(390px,100%); margin: 0 auto 24px; border-top: 1px solid rgba(70,68,57,.35); border-bottom: 1px solid rgba(70,68,57,.35); padding: 10px 0; }
            #victory-modal .victory-detail-row { display: flex; justify-content: space-between; gap: 20px; padding: 6px 4px; font-size: 15px; text-align: left; }
            #victory-modal .victory-detail-row strong { text-align: right; }
            #victory-modal .victory-button { min-width: 150px; padding: 10px 24px; border: 1px solid #4d4b40; background: #666754; color: #f0ecd9; font: inherit; font-size: 16px; cursor: pointer; }
            #victory-modal .victory-button:hover { background: #555746; }
            #victory-modal .victory-button:focus-visible { outline: 2px solid #262820; outline-offset: 3px; }
        `;
        document.head.appendChild(style);
    }
    // --------------------------------------------------------
    // 防止重复生成弹窗
    // --------------------------------------------------------
    const oldModal =
        document.getElementById(
            "victory-modal"
        );
    if (oldModal) {
        oldModal.remove();
    }
    // --------------------------------------------------------
    // 胜利阵营
    // --------------------------------------------------------
    const winner =
        normalizeSide(
            result?.winner
        );
    const winnerName = FactionSystem.getSideName(winner);
    // --------------------------------------------------------
    // 中文标题
    // --------------------------------------------------------
    const title = winnerName ? `${winnerName}胜利` : "战斗结束";
    // --------------------------------------------------------
    // 外文副标题
    // --------------------------------------------------------
    const subtitle = winnerName ? "VICTORY" : "BATTLE ENDED";
    // --------------------------------------------------------
    // 胜负原因
    // --------------------------------------------------------
    const reason =
        result?.reason ??
        "战役已经结束";
    // --------------------------------------------------------
    // 当前战役日期
    // --------------------------------------------------------
    let dateText =
        "1941年6月";
    if (turnSystem) {
        const year =
            turnSystem.year ??
            1941;
        const month =
            turnSystem.month ??
            6;
        const day =
            turnSystem.day ??
            26;
        const hour =
            turnSystem.hour ??
            8;
        const minute =
            turnSystem.minute ??
            0;
        const hourText =
            String(hour).padStart(
                2,
                "0"
            );
        const minuteText =
            String(minute).padStart(
                2,
                "0"
            );
        dateText =
            `${year}年${month}月${day}日　${hourText}:${minuteText}`;
    }
    // --------------------------------------------------------
    // 当前回合
    // --------------------------------------------------------
    const currentTurn =
        turnSystem?.turn ??
        (
            typeof turnSystem?.getTurnNumber ===
            "function"
                ? turnSystem.getTurnNumber()
                : 1
        );
    // --------------------------------------------------------
    // 创建弹窗
    // --------------------------------------------------------
    const modal =
        document.createElement(
            "div"
        );
    modal.id =
        "victory-modal";
    modal.innerHTML = `
        <div class="victory-overlay">
            <div class="victory-window">
                <div class="victory-decoration">
                    东线 1941 · ${getScenarioConfig().name}
                </div>
                <div class="victory-title">
                    ${title}
                </div>
                <div class="victory-subtitle">
                    ${subtitle}
                </div>
                <div class="victory-line"></div>
                <div class="victory-reason">
                    ${reason}
                </div>
                <div class="victory-details">
                    <div class="victory-detail-row">
                        <span>
                            战役时间
                        </span>
                        <strong>
                            ${dateText}
                        </strong>
                    </div>
                    <div class="victory-detail-row">
                        <span>
                            战役回合
                        </span>
                        <strong>
                            第${currentTurn}回合
                        </strong>
                    </div>
                </div>
                <button
                    class="victory-button"
                    id="victory-close-button"
                    type="button"
                >
                    查看战场
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(
        modal
    );
    // --------------------------------------------------------
    // 查看战场
    // --------------------------------------------------------
    const closeButton =
        document.getElementById(
            "victory-close-button"
        );
    if (closeButton) {
        closeButton.addEventListener(
            "click",
            () => {
                modal.remove();
            }
        );
    }
}
function checkVictory() {
    if (
        gameOver ||
        !victorySystem
    ) {
        return gameOver;
    }
    // 清除兵力为 0 / 已摧毁的单位，确保地图和判定同步
  // ============================================================
// 胜负检查时必须保留阵亡单位
// HQ 全灭判定需要知道哪些指挥单位已经被摧毁
// ============================================================
gameState.units =
    units;
    const result =
        victorySystem.check(
            units,
            {
                turn: turnSystem?.turn ?? 1,
                phase: normalizeSide(turnSystem?.phase ?? getScenarioConfig().start.startingPhase),
                playerSide: getPlayerSide(),
                scenario,
                year: turnSystem?.year ?? 1941,
                month: turnSystem?.month ?? 6,
                day: turnSystem?.day ?? 26,
                hour: turnSystem?.hour ?? 8,
                minute: turnSystem?.minute ?? 0
            }
        );
    if (!result.gameOver) {
        return false;
    }
    gameOver = true;
    clearSelection();
    const winnerText = result.winner ? `${FactionSystem.getSideName(result.winner)}胜利` : "战斗结束";
    if (unitInfo) {
        unitInfo.innerHTML = `
            <div class="unit-title">
                战斗结束
            </div>
            <div class="unit-row">
                <strong>
                    ${winnerText}
                </strong>
            </div>
            <div class="unit-row">
                <span>
                    ${result.reason ?? ""}
                </span>
            </div>
        `;
    }
    if (turnInfo) {
        turnInfo.textContent =
            winnerText;
    }
    if (endPhaseButton) {
        endPhaseButton.disabled =
            true;
    }
    console.log(
        "========================================"
    );
    console.log(
        `[胜负系统] ${winnerText}`
    );
    console.log(
        `[胜负系统] ${result.reason ?? ""}`
    );
    console.log(
        "========================================"
    );
    render();
    // 胜负确认后显示中央弹窗。
    // units 不删除阵亡单位，因此 HQ 全灭判定仍保留完整历史状态。
    showVictoryModal(result);
    return true;
}
// ============================================================
// 玩家攻击
// ============================================================
function performAttack(
    attacker,
    defender,
    {
        ai = false
    } = {}
) {
    if (
        gameOver ||
        !attacker ||
        !defender ||
        !isUnitAlive(attacker) ||
        !isUnitAlive(defender)
    ) {
        return false;
    }
    if (
        !combatSystem.canAttack(
            attacker,
            defender
        )
    ) {
        return false;
    }
    if (!ai) {
        undoSystem.push({ units, turnSystem, gameOver }, `攻击：${unitName(attacker)}`);
    }
    const result =
        combatSystem.attack(
            attacker,
            defender
        );
    if (
        !result?.success
    ) {
        if (!ai) undoSystem.discardLast();
        writeBattleMessage(
            result?.reason ??
            "攻击失败"
        );
        return false;
    }
    // CombatSystem 以 strength 为实时兵力；同步旧 manpower 字段，避免地图继续显示战前兵力。
    defender.manpower = Math.max(0, Number(defender.strength ?? result.afterStrength ?? 0));
    const sideLabel = FactionSystem.getSideName(getUnitSide(attacker));
    const prefix =
        ai
            ? `${sideLabel} AI：`
            : "";
    const destroyedText =
        result.destroyed
            ? "，目标被消灭"
            : "";
    writeBattleMessage(
        `${prefix}${unitName(attacker)} 攻击 ${unitName(defender)}，` +
        `造成 ${result.damage} 点损失 ` +
        `（${result.beforeStrength}/${getUnitMaxStrength(defender)} → ` +
        `${result.afterStrength}/${getUnitMaxStrength(defender)}）` +
        destroyedText
    );
    removeDestroyedUnits();
    // 攻击后立即同步当前被查看单位的数据与右侧信息栏。
    if (selectedUnit) {
        const refreshedSelected = units.find(
            (u) => u === selectedUnit || (u.id && u.id === selectedUnit.id)
        );
        if (refreshedSelected && isUnitAlive(refreshedSelected)) {
            selectedUnit = refreshedSelected;
            showUnitInfo(refreshedSelected);
        } else if (!isUnitAlive(selectedUnit)) {
            clearSelection();
        }
    }
    // 强制重绘，确保地图兵力标签立即反映战损。
    render();
    if (
        !checkVictory()
    ) {
        if (
            selectedUnit &&
            isUnitAlive(
                selectedUnit
            )
        ) {
            showUnitInfo(
                selectedUnit
            );
            calculateReachable(
                selectedUnit
            );
        }
        render();
    }
    updateSaveControls();
    return true;
}
// ============================================================
// 阵营阶段重置
// ============================================================
function resetFactionForPhase(
    faction
) {
    movementSystem.resetFaction?.(
        units,
        faction
    );
    combatSystem.resetFaction?.(
        units,
        faction
    );
}
// ============================================================
// 延时
// ============================================================
function sleep(ms) {
    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}
// ============================================================
// AI 阶段
// ============================================================
async function runAIPhase() {
    if (
        aiRunning ||
        gameOver ||
        !turnSystem ||
        String(gameState.mode).toLowerCase() === "developer"
    ) {
        return;
    }
    const currentSide =
        normalizeSide(
            turnSystem.phase
        );
    const playerSide =
        getPlayerSide();
    if (
        !currentSide ||
        currentSide ===
        playerSide
    ) {
        return;
    }
    undoSystem.clear();
    aiRunning =
        true;
    if (endPhaseButton) {
        endPhaseButton.disabled =
            true;
    }
    try {
        resetFactionForPhase(
            currentSide
        );
        const aiUnits =
            units.filter(
                unit =>
                    getUnitSide(unit) ===
                        currentSide &&
                    isUnitAlive(unit)
            );
        const sideLabel = `${FactionSystem.getSideName(currentSide)} AI`;
        for (
            const unit
            of aiUnits
        ) {
            if (gameOver) {
                break;
            }
            if (
                !isUnitAlive(
                    unit
                )
            ) {
                continue;
            }
            const result =
                aiSystem.actUnit(
                    unit,
                    units
                );
            if (
                result?.type ===
                    "attack" &&
                result.result?.success
            ) {
                const combat =
                    result.result;
                writeBattleMessage(
                    `${sideLabel}：${unitName(combat.attacker)} 攻击 ${unitName(combat.defender)}，` +
                    `造成 ${combat.damage} 点损失 ` +
                    `（${combat.beforeStrength}/${getUnitMaxStrength(combat.defender)} → ` +
                    `${combat.afterStrength}/${getUnitMaxStrength(combat.defender)}）` +
                    `${combat.destroyed ? "，目标被消灭" : ""}`
                );
            }
            if (
                result?.type ===
                    "move-and-attack" &&
                result.combat?.success
            ) {
                const combat =
                    result.combat;
                writeBattleMessage(
                    `${sideLabel}：${unitName(combat.attacker)} 移动后攻击 ${unitName(combat.defender)}，` +
                    `造成 ${combat.damage} 点损失 ` +
                    `（${combat.beforeStrength}/${getUnitMaxStrength(combat.defender)} → ` +
                    `${combat.afterStrength}/${getUnitMaxStrength(combat.defender)}）` +
                    `${combat.destroyed ? "，目标被消灭" : ""}`
                );
            }
            removeDestroyedUnits();
            render();
            if (
                checkVictory()
            ) {
                break;
            }
            await sleep(
                220
            );
        }
        if (
            !gameOver &&
            normalizeSide(
                turnSystem.phase
            ) ===
                currentSide
        ) {
            clearSelection();
            turnSystem.endPhase?.();
            const nextSide =
                normalizeSide(
                    turnSystem.phase
                );
            resetFactionForPhase(
                nextSide
            );
            updateTurnUI();
            render();
            if (
                !gameOver &&
                nextSide &&
                nextSide !==
                    getPlayerSide()
            ) {
                setTimeout(
                    () => {
                        runAIPhase();
                    },
                    250
                );
            }
        }
    }
    catch (error) {
        console.error(
            "AI 行动失败：",
            error
        );
        if (unitInfo) {
            unitInfo.innerHTML = `
                <div class="unit-title">
                    AI 行动失败
                </div>
                <div>
                    ${error?.message ?? error}
                </div>
            `;
        }
    }
    finally {
        aiRunning =
            false;
        if (
            endPhaseButton &&
            !gameOver
        ) {
            endPhaseButton.disabled =
                false;
        }
    }
}
// ============================================================
// 鼠标按下
// ============================================================
canvas.addEventListener(
    "mousedown",
    event => {
        if (
            event.button !==
            0
        ) {
            return;
        }
        isDragging =
            true;
        dragMoved =
            false;
        lastMouseX =
            event.clientX;
        lastMouseY =
            event.clientY;
    }
);
// ============================================================
// 拖动地图
// ============================================================
window.addEventListener(
    "mousemove",
    event => {
        if (!isDragging) {
            return;
        }
        const dx =
            event.clientX -
            lastMouseX;
        const dy =
            event.clientY -
            lastMouseY;
        if (
            Math.abs(dx) > 2 ||
            Math.abs(dy) > 2
        ) {
            dragMoved =
                true;
        }
        if (
            typeof camera.pan ===
            "function"
        ) {
            camera.pan(
                dx,
                dy
            );
        }
        else {
            if (
                Number.isFinite(
                    camera.x
                )
            ) {
                camera.x +=
                    dx;
            }
            if (
                Number.isFinite(
                    camera.y
                )
            ) {
                camera.y +=
                    dy;
            }
            if (
                Number.isFinite(
                    camera.offsetX
                )
            ) {
                camera.offsetX +=
                    dx;
            }
            if (
                Number.isFinite(
                    camera.offsetY
                )
            ) {
                camera.offsetY +=
                    dy;
            }
        }
        lastMouseX =
            event.clientX;
        lastMouseY =
            event.clientY;
        render();
    }
);
// ============================================================
// 鼠标释放
// ============================================================
window.addEventListener(
    "mouseup",
    () => {
        isDragging =
            false;
    }
);
// ============================================================
// 地块与工程行动
// ============================================================
function refreshEngineerActions(){
    if(!engineerActions) return;
    const p = selectedUnit ? engineerSystem.profile(selectedUnit) : null;
    const canWork = !!(selectedUnit && engineerSystem.canWork(selectedUnit));
    const q = Number(selectedUnit?.q), r = Number(selectedUnit?.r);
    const mine = selectedUnit ? engineerSystem.getMinefield(q,r) : null;
    const canEngineer = !!(p && (p.canEntrench || p.canLayMines || p.canClearMines));
    engineerActions.hidden = !canEngineer;
    if(buildFortButton) buildFortButton.disabled = !(p?.canEntrench && canWork);
    if(layMineButton) layMineButton.disabled = !(p?.canLayMines && canWork);
    if(clearMineButton) clearMineButton.disabled = !(p?.canClearMines && canWork && mine);
}
function selectHexAtEvent(event){ const h=mouseToHex(event); if(!h)return null; selectedHex=h; hexInfoPanel.show(h.q,h.r); return h; }
function doEngineerAction(kind){
    if(!selectedUnit) return;
    // 工程行动固定作用于单位自身所在格，避免 selectedHex 因移动/旧选择而失配。
    const q=Number(selectedUnit.q), r=Number(selectedUnit.r);
    selectedHex={q,r};
    let result;
    if(kind==='fort') result=engineerSystem.entrench(selectedUnit,q,r);
    if(kind==='lay') result=engineerSystem.layMine(selectedUnit,q,r);
    if(kind==='clear') result=engineerSystem.clearMine(selectedUnit,q,r);
    if(result?.message) writeBattleMessage(result.message);
    hexInfoPanel.show(q,r);
    refreshEngineerActions();
    showUnitInfo(selectedUnit);
    render();
    updateSaveControls();
}
buildFortButton?.addEventListener('click',()=>doEngineerAction('fort'));
layMineButton?.addEventListener('click',()=>doEngineerAction('lay'));
clearMineButton?.addEventListener('click',()=>doEngineerAction('clear'));

// ============================================================
// 点击地图
// ============================================================
canvas.addEventListener(
    "click",
    event => {
        if (
            gameOver ||
            aiRunning
        ) {
            return;
        }
        if (dragMoved) {
            dragMoved =
                false;
            return;
        }
        const clickedUnit =
            findUnitAtMouse(
                event
            );
        const clickedHex = selectHexAtEvent(event);
        // ====================================================
        // 点击了单位
        // ====================================================
        if (clickedUnit) {
            // ------------------------------------------------
            // 已选择玩家单位 + 点击敌军
            // = 尝试攻击
            // ------------------------------------------------
            if (
                selectedUnit &&
                playerCanControlUnit(
                    selectedUnit
                ) &&
                getUnitSide(
                    clickedUnit
                ) !==
                getUnitSide(
                    selectedUnit
                )
            ) {
                if (
                    performAttack(
                        selectedUnit,
                        clickedUnit
                    )
                ) {
                    return;
                }
                writeBattleMessage(
                    `无法攻击 ${unitName(clickedUnit)}：` +
                    `请检查射程或该单位是否已经攻击`
                );
                render();
                return;
            }
            if (
                playerCanViewUnit(
                    clickedUnit
                )
            ) {
                selectUnit(
                    clickedUnit
                );
                selectedHex = { q:Number(clickedUnit.q), r:Number(clickedUnit.r) };
                hexInfoPanel.show(selectedHex.q, selectedHex.r);
                refreshEngineerActions();
            }
            return;
        }
        // ====================================================
        // 点击空格 = 尝试移动
        // ====================================================
        if (selectedUnit) {
            const hex =
                mouseToHex(
                    event
                );
            if (
                hex &&
                tryMoveSelectedUnit(
                    hex.q,
                    hex.r
                )
            ) {
                return;
            }
        }
        clearSelection();
        selectedUnit = null;
        refreshEngineerActions();
        render();
    }
);
// ============================================================
// iPad / 触屏：单指拖动、轻触选择、双指缩放
// ============================================================
let touchMoved = false;
let touchStartX = 0, touchStartY = 0;
let touchLastX = 0, touchLastY = 0;
let pinchStartDistance = 0, pinchStartZoom = 1;

function touchDistance(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }
function setCameraZoomAt(clientX, clientY, newZoom){
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const oldZoom = camera.zoom ?? 1;
    const minZoom = camera.minZoom ?? 0.35, maxZoom = camera.maxZoom ?? 3;
    newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    if (typeof camera.zoomAt === 'function') camera.zoomAt(x,y,newZoom);
    else {
        const oldX = camera.x ?? camera.offsetX ?? 0, oldY = camera.y ?? camera.offsetY ?? 0;
        const worldX=(x-oldX)/oldZoom, worldY=(y-oldY)/oldZoom;
        const nx=x-worldX*newZoom, ny=y-worldY*newZoom;
        camera.zoom=newZoom;
        if('x' in camera) camera.x=nx; if('y' in camera) camera.y=ny;
        if('offsetX' in camera) camera.offsetX=nx; if('offsetY' in camera) camera.offsetY=ny;
    }
}
canvas.addEventListener('touchstart', e=>{
    e.preventDefault();
    touchMoved=false;
    if(e.touches.length===1){
        const t=e.touches[0]; touchStartX=touchLastX=t.clientX; touchStartY=touchLastY=t.clientY;
    } else if(e.touches.length===2){
        pinchStartDistance=touchDistance(e.touches[0],e.touches[1]);
        pinchStartZoom=camera.zoom ?? 1; touchMoved=true;
    }
},{passive:false});
canvas.addEventListener('touchmove', e=>{
    e.preventDefault();
    if(e.touches.length===1){
        const t=e.touches[0], dx=t.clientX-touchLastX, dy=t.clientY-touchLastY;
        if(Math.hypot(t.clientX-touchStartX,t.clientY-touchStartY)>7) touchMoved=true;
        if(touchMoved){
            if(typeof camera.pan==='function') camera.pan(dx,dy);
            else { if(Number.isFinite(camera.x))camera.x+=dx; if(Number.isFinite(camera.y))camera.y+=dy; if(Number.isFinite(camera.offsetX))camera.offsetX+=dx; if(Number.isFinite(camera.offsetY))camera.offsetY+=dy; }
            render();
        }
        touchLastX=t.clientX; touchLastY=t.clientY;
    } else if(e.touches.length===2 && pinchStartDistance>0){
        const a=e.touches[0], b=e.touches[1], d=touchDistance(a,b);
        const cx=(a.clientX+b.clientX)/2, cy=(a.clientY+b.clientY)/2;
        setCameraZoomAt(cx,cy,pinchStartZoom*(d/pinchStartDistance)); touchMoved=true; render();
    }
},{passive:false});
canvas.addEventListener('touchend', e=>{
    e.preventDefault();
    if(e.touches.length===0){
        if(!touchMoved && e.changedTouches.length){
            const t=e.changedTouches[0];
            canvas.dispatchEvent(new MouseEvent('click',{clientX:t.clientX,clientY:t.clientY,bubbles:true}));
        }
        pinchStartDistance=0;
    } else if(e.touches.length===1){
        touchLastX=e.touches[0].clientX; touchLastY=e.touches[0].clientY;
        pinchStartDistance=0; touchMoved=true;
    }
},{passive:false});
canvas.addEventListener('touchcancel',()=>{pinchStartDistance=0;touchMoved=false;},{passive:false});

// ============================================================
// 滚轮缩放
// ============================================================
canvas.addEventListener(
    "wheel",
    event => {
        event.preventDefault();
        const rect =
            canvas.getBoundingClientRect();
        const mouseX =
            event.clientX -
            rect.left;
        const mouseY =
            event.clientY -
            rect.top;
        const oldZoom =
            camera.zoom ?? 1;
        const factor =
            event.deltaY < 0
                ? 1.1
                : 0.9;
        const minZoom =
            camera.minZoom ??
            0.35;
        const maxZoom =
            camera.maxZoom ??
            3;
        const newZoom =
            Math.max(
                minZoom,
                Math.min(
                    maxZoom,
                    oldZoom *
                    factor
                )
            );
        if (
            typeof camera.zoomAt ===
            "function"
        ) {
            camera.zoomAt(
                mouseX,
                mouseY,
                newZoom
            );
            render();
            return;
        }
        const oldX =
            camera.x ??
            camera.offsetX ??
            0;
        const oldY =
            camera.y ??
            camera.offsetY ??
            0;
        const worldX =
            (
                mouseX -
                oldX
            ) /
            oldZoom;
        const worldY =
            (
                mouseY -
                oldY
            ) /
            oldZoom;
        const newX =
            mouseX -
            worldX *
            newZoom;
        const newY =
            mouseY -
            worldY *
            newZoom;
        camera.zoom =
            newZoom;
        if (
            "x" in camera
        ) {
            camera.x =
                newX;
        }
        if (
            "y" in camera
        ) {
            camera.y =
                newY;
        }
        if (
            "offsetX" in camera
        ) {
            camera.offsetX =
                newX;
        }
        if (
            "offsetY" in camera
        ) {
            camera.offsetY =
                newY;
        }
        render();
    },
    {
        passive: false
    }
);
// ============================================================
// 结束当前阶段
// ============================================================
function endCurrentPhase() {
    if (
        gameOver ||
        aiRunning ||
        !turnSystem
    ) {
        return;
    }
    const currentSide =
        normalizeSide(
            turnSystem.phase
        );
    const playerSide =
        getPlayerSide();
    if (String(gameState.mode).toLowerCase() === "developer") {
        saveSystem.autoSave({ units, turnSystem, gameState, gameOver, scenario, world, reinforcementSystem });
        undoSystem.clear(); clearSelection(); turnSystem.endPhase?.();
        resetFactionForPhase(normalizeSide(turnSystem.phase)); updateTurnUI(); render(); updateDeveloperPanel();
        return;
    }
    if (
        playerSide &&
        currentSide !==
            playerSide
    ) {
        runAIPhase();
        return;
    }
    saveSystem.autoSave({ units, turnSystem, gameState, gameOver, scenario, world, reinforcementSystem });
    undoSystem.clear();
    clearSelection();
    turnSystem.endPhase?.();
    const nextSide =
        normalizeSide(
            turnSystem.phase
        );
    resetFactionForPhase(
        nextSide
    );
    if (nextSide === getPlayerSide()) {
        saveSystem.autoSave({ units, turnSystem, gameState, gameOver, scenario, world, reinforcementSystem });
    }
    updateTurnUI();
    render();
    if (
        !gameOver &&
        nextSide &&
        nextSide !==
            getPlayerSide()
    ) {
        setTimeout(
            () => {
                runAIPhase();
            },
            250
        );
    }
}
// ============================================================
// 存档 / 读取 / 撤销
// ============================================================
function applySnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.units)) return false;
    units = JSON.parse(JSON.stringify(snapshot.units));
    gameState.units = units;
    gameOver = snapshot.gameOver === true;
    if (snapshot.playerFaction) {
        gameState.playerFaction = snapshot.playerFaction;
        gameState.playerSide = snapshot.playerFaction;
        gameState.selectedFaction = snapshot.playerFaction;
        gameState.selectedSide = snapshot.playerFaction;
    }
    if (snapshot.mode) gameState.mode = snapshot.mode;
    if (snapshot.world) {
        world.fortifications = JSON.parse(JSON.stringify(snapshot.world.fortifications ?? []));
        world.minefields = JSON.parse(JSON.stringify(snapshot.world.minefields ?? []));
        if (Array.isArray(snapshot.world.wallEdges)) world.wallEdges = JSON.parse(JSON.stringify(snapshot.world.wallEdges));
    }
    if (snapshot.reinforcements) {
        reinforcementSystem.arrivedGroups = new Set(snapshot.reinforcements.arrivedGroups ?? []);
        reinforcementSystem.arrivalLog = JSON.parse(JSON.stringify(snapshot.reinforcements.arrivalLog ?? []));
    }
    reinforcementSystem.initialize(units, snapshot.turn?.turn ?? 1);
    const t = snapshot.turn ?? {};
    if (turnSystem) {
        for (const key of ["turn", "phase", "year", "month", "day", "hour", "minute"]) {
            if (t[key] != null) turnSystem[key] = t[key];
        }
        if (Array.isArray(t.units)) turnSystem.units = units;
    }
    clearSelection();
    removeDestroyedUnits();
    updateTurnUI();
    render();
    return true;
}
function saveGame(slot = 1) {
    if (aiRunning) return false;
    saveSystem.save(slot, { units, turnSystem, gameState, gameOver, scenario, world, reinforcementSystem });
    updateSaveControls();
    console.log(`[存档] 槽位 ${slot} 保存成功`);
    return true;
}
function loadGame(slot = 1) {
    if (aiRunning) return false;
    const snapshot = saveSystem.load(slot);
    if (!snapshot) return false;
    undoSystem.clear();
    applySnapshot(snapshot);
    updateSaveControls();
    console.log(`[存档] 槽位 ${slot} 读取成功`);
    return true;
}
function undoLastAction() {
    if (aiRunning || gameOver) return false;
    const entry = undoSystem.undo();
    if (!entry) return false;
    applySnapshot(entry.snapshot);
    updateSaveControls();
    console.log(`[撤销] ${entry.label}`);
    return true;
}
function ensureSaveControls() {
    const slotSelect = document.getElementById("save-slot-select");
    const saveButton = document.getElementById("save-game-button");
    const loadButton = document.getElementById("load-game-button");
    const undoButton = document.getElementById("undo-game-button");
    if (!slotSelect || !saveButton || !loadButton || !undoButton) {
        console.error("[存档系统] index.html 缺少存档/读取/撤销控件");
        return;
    }
    const selectedSlot = () => Number(slotSelect.value ?? 1);
    saveButton.addEventListener("click", () => {
        saveGame(selectedSlot());
    });
    loadButton.addEventListener("click", () => {
        if (!loadGame(selectedSlot())) {
            alert("该槽位没有可读取的存档。");
        }
    });
    undoButton.addEventListener("click", () => {
        undoLastAction();
    });
    slotSelect.addEventListener("change", updateSaveControls);
    updateSaveControls();
}
function updateSaveControls() {
    const slot = Number(document.getElementById("save-slot-select")?.value ?? 1);
    const loadButton = document.getElementById("load-game-button");
    const undoButton = document.getElementById("undo-game-button");
    if (loadButton) loadButton.disabled = aiRunning || !saveSystem.has(slot);
    if (undoButton) undoButton.disabled = aiRunning || gameOver || !undoSystem.canUndo();
}
// ============================================================
// 结束行动按钮
// ============================================================
endPhaseButton?.addEventListener(
    "click",
    () => {
        endCurrentPhase();
    }
);
// ============================================================
// 键盘
// ============================================================
window.addEventListener(
    "keydown",
    event => {
        if (event.ctrlKey && event.key.toLowerCase() === "s") { event.preventDefault(); saveGame(Number(document.getElementById("save-slot-select")?.value ?? 1)); return; }
        if (event.ctrlKey && event.key.toLowerCase() === "z") { event.preventDefault(); undoLastAction(); return; }
        if (
            event.key ===
            "Escape"
        ) {
            clearSelection();
            render();
            return;
        }
        if (
            event.key.toLowerCase() ===
            "e"
        ) {
            endCurrentPhase();
        }
    }
);
// ============================================================
// 玩家选择阵营之后
// ============================================================
function startGame() {
    ensureSaveControls();
    saveSystem.autoSave({ units, turnSystem, gameState, gameOver, scenario, world, reinforcementSystem });
    updateSaveControls();
    console.log(
        "玩家阵营：",
        getPlayerSide()
    );
    console.log(
        "游戏模式：",
        gameState.mode
    );
    clearSelection();
    updateTurnUI();
    resizeCanvas();
    render();
    const currentSide =
        normalizeSide(
            turnSystem?.phase
        );
    const playerSide =
        getPlayerSide();
    // 把最终选择结果同步回所有常见字段，确保其它系统读取到同一阵营。
    if (playerSide) {
        const id = FactionSystem.normalizeFaction(playerSide);
        gameState.playerFaction = id ?? gameState.playerFaction;
        gameState.playerSide = playerSide;
        gameState.selectedFaction = id ?? gameState.selectedFaction;
        gameState.selectedSide = playerSide;
    }
    strategicObjectives.onFactionChanged();
    updateDeveloperPanel();
    console.log("[控制系统] 玩家阵营已统一为：", playerSide);
    console.log("[控制系统] 当前行动方：", currentSide);
    // ========================================================
    // 如果开局行动方不是玩家
    // AI 自动行动
    // ========================================================
    if (
        gameState.mode !==
            "observer" &&
        String(gameState.mode).toLowerCase() !== "developer" &&
        currentSide &&
        playerSide &&
        currentSide !==
            playerSide
    ) {
        setTimeout(
            () => {
                runAIPhase();
            },
            250
        );
    }
}
// ============================================================
// 加载游戏数据
// ============================================================
async function loadScenario(scenarioKey = "dubno", resumeSnapshot = null) {
    try {
        currentScenarioKey = scenarioKey; gameOver=false; aiRunning=false; clearSelection(); undoSystem.clear?.();
        const loaded = await scenarioManager.load(scenarioKey);
        currentScenarioConfig = loaded.config; scenario = loaded.scenario; units = loaded.units; strategicObjectives.setScenario(scenario);
        console.log(`[战役系统] ${loaded.theater.name} / ${loaded.phase.name} / ${loaded.config.name}`);
        initializeUnits();
        reinforcementSystem.arrivedGroups.clear();
        reinforcementSystem.arrivalLog.length = 0;
        reinforcementSystem.initialize(units, 1);
        units = units.filter(unit => unit.offMap === true || isUnitAlive(unit));
        if(!validateUnits(units)) throw new Error(`${loaded.config.unitsPath} 单位数据检查失败，请查看浏览器控制台`);
        const counts={}; for(const unit of units){const side=getUnitSide(unit);counts[side]=(counts[side]??0)+1;}
        console.log("[单位系统] 战斗序列加载完成", counts);
        gameState.units=units; gameState.scenarioKey=loaded.config.id; gameState.scenarioName=loaded.config.name;
        gameState.setAvailableFactions?.(loaded.config.factions ?? []);
        initializeTurnSystem(); victorySystem=new VictorySystem({scenario});
        if(typeof camera.reset==="function") camera.reset();
        if(typeof camera.centerOnMap==="function") camera.centerOnMap(world,canvas,renderer);
        resizeCanvas(); render();
        if (resumeSnapshot) {
            applySnapshot(resumeSnapshot);
            document.getElementById("mainMenu")?.setAttribute("hidden", "");
            startGame();
        } else {
            factionSelection.show(startGame,{scenario,config:loaded.config});
        }
        console.log(`战役已启动：${loaded.config.name}`);
    } catch(error) {
        console.error("游戏初始化失败：",error);
        if(unitInfo){unitInfo.innerHTML=`<strong>游戏数据加载失败</strong><br><br>${error.message}<br><br><button id="return-scenario-selection" type="button">返回战役选择</button>`;document.getElementById("return-scenario-selection")?.addEventListener("click",showScenarioSelection);} else showScenarioSelection();
    }
}

// ============================================================
// V0.3.1 主界面 / 存档槽 UI
// ============================================================
function factionLabel(side){ const v=normalizeSide(side); return v==='chinese'?'中国军':v==='japanese'?'日军':v==='german'?'德军':v==='soviet'?'苏军':v==='rok_government'?'政府军':v==='new_military'?'新军部':(side??''); }
function showMainMenu(){ document.getElementById('pauseMenu')?.setAttribute('hidden',''); document.getElementById('mainMenu')?.removeAttribute('hidden'); updateMainMenu(); }
function hideMainMenu(){ document.getElementById('mainMenu')?.setAttribute('hidden',''); }
function updateMainMenu(){ const b=document.getElementById('menuContinue'); if(b)b.disabled=!(saveSystem.hasResume()||saveSystem.hasAutoSave()); }
function openSaveModal(mode='load'){
  const modal=document.getElementById('saveLoadModal'), box=document.getElementById('saveSlotCards'), title=document.getElementById('saveModalTitle'); if(!modal||!box)return;
  title.textContent=mode==='save'?'保存游戏':'读取存档'; box.innerHTML='';
  const auto=saveSystem.getAutoSummary(); if(mode==='load') box.appendChild(makeSlotCard('自动存档',auto,'auto',mode));
  for(let i=1;i<=3;i++) box.appendChild(makeSlotCard(`存档 ${i}`,saveSystem.getSummary(i),i,mode));
  modal.dataset.mode=mode; modal.removeAttribute('hidden');
}
function makeSlotCard(label,summary,slot,mode){
  const d=document.createElement('div');d.className='save-slot-card'; const when=summary?.savedAt?new Date(summary.savedAt).toLocaleString():'空';
  d.innerHTML=`<div class="save-slot-title">${label}</div><div class="save-slot-meta">${summary?`${summary.scenarioName} · ${factionLabel(summary.playerFaction)} · 第${summary.turn}回合 · ${when}`:'空槽位'}</div><div class="save-slot-buttons"></div>`;
  const row=d.querySelector('.save-slot-buttons');
  if(mode==='save'&&slot!=='auto'){const b=document.createElement('button');b.textContent=summary?'覆盖保存':'保存';b.onclick=()=>{saveGame(slot);openSaveModal('save');};row.appendChild(b);}
  if(mode==='load'&&summary){const b=document.createElement('button');b.textContent='读取';b.onclick=async()=>{const snap=slot==='auto'?saveSystem.loadAutoSave():saveSystem.load(slot);document.getElementById('saveLoadModal')?.setAttribute('hidden','');await resumeFromSnapshot(snap);};row.appendChild(b);}
  if(summary&&slot!=='auto'){const ex=document.createElement('button');ex.textContent='导出';ex.onclick=()=>saveSystem.exportSlot(slot);row.appendChild(ex);const del=document.createElement('button');del.textContent='删除';del.onclick=()=>{if(confirm(`删除${label}？`)){saveSystem.remove(slot);openSaveModal(mode);updateMainMenu();}};row.appendChild(del);}
  return d;
}
async function resumeFromSnapshot(snapshot){ if(!snapshot)return false; const key=snapshot.scenarioKey ?? snapshot.scenario?.id ?? 'wanjialing'; hideMainMenu(); await loadScenario(key,snapshot); return true; }
function initializeMainMenu(){
  const main=document.getElementById('mainMenu'); main?.removeAttribute('hidden'); updateMainMenu();
  document.getElementById('menuNewGame')?.addEventListener('click',()=>{hideMainMenu();showScenarioSelection();});
  document.getElementById('menuContinue')?.addEventListener('click',()=>resumeFromSnapshot(saveSystem.loadResume() ?? saveSystem.loadAutoSave()));
  document.getElementById('menuLoad')?.addEventListener('click',()=>openSaveModal('load'));
  document.getElementById('menuSettings')?.addEventListener('click',()=>alert('设置面板将在后续版本继续扩展。'));
  document.getElementById('menuAbout')?.addEventListener('click',()=>document.getElementById('aboutModal')?.removeAttribute('hidden'));
  document.getElementById('closeAboutModal')?.addEventListener('click',()=>document.getElementById('aboutModal')?.setAttribute('hidden',''));
  document.getElementById('menu-game-button')?.addEventListener('click',()=>document.getElementById('pauseMenu')?.removeAttribute('hidden'));
  document.getElementById('pauseResume')?.addEventListener('click',()=>document.getElementById('pauseMenu')?.setAttribute('hidden',''));
  document.getElementById('pauseSave')?.addEventListener('click',()=>{document.getElementById('pauseMenu')?.setAttribute('hidden','');openSaveModal('save');});
  document.getElementById('pauseLoad')?.addEventListener('click',()=>{document.getElementById('pauseMenu')?.setAttribute('hidden','');openSaveModal('load');});
  document.getElementById('pauseMain')?.addEventListener('click',()=>{document.getElementById('pauseMenu')?.setAttribute('hidden','');showMainMenu();});
  document.getElementById('closeSaveModal')?.addEventListener('click',()=>document.getElementById('saveLoadModal')?.setAttribute('hidden',''));
  document.getElementById('importSaveButton')?.addEventListener('click',()=>document.getElementById('importSaveFile')?.click());
  document.getElementById('importSaveFile')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{await saveSystem.importFile(file,1);alert('已导入到存档1。');openSaveModal('load');updateMainMenu();}catch(err){alert(`导入失败：${err.message}`);}e.target.value='';});
}

// ============================================================
// 开发者模式控制面板（与普通战役完全隔离）
// ============================================================
function updateDeveloperPanel(){
  const panel=document.getElementById('developerPanel'); if(!panel)return;
  const dev=String(gameState.mode).toLowerCase()==='developer'; panel.hidden=!dev;
  if(dev){const input=document.getElementById('devTurnInput');if(input&&turnSystem)input.value=turnSystem.turn??1;}
}
function developerAdvanceFullTurn(){
  if(String(gameState.mode).toLowerCase()!=='developer'||!turnSystem)return;
  const start=Number(turnSystem.turn??1); let guard=0;
  do{turnSystem.endPhase?.();resetFactionForPhase(normalizeSide(turnSystem.phase));guard++;}while(Number(turnSystem.turn??1)===start&&guard<10);
  clearSelection();updateTurnUI();render();updateDeveloperPanel();
}
function developerSetTurn(){
  if(String(gameState.mode).toLowerCase()!=='developer'||!turnSystem)return;
  const n=Math.max(1,Math.floor(Number(document.getElementById('devTurnInput')?.value)||1));
  turnSystem.turn=n; reinforcementSystem.processTurn?.(n,units); strategicObjectives.onTurnChanged?.(); updateTurnUI();render();updateDeveloperPanel();
}
document.getElementById('devEndPhase')?.addEventListener('click',endCurrentPhase);
document.getElementById('devNextTurn')?.addEventListener('click',developerAdvanceFullTurn);
document.getElementById('devSetTurn')?.addEventListener('click',developerSetTurn);

// ============================================================
// 窗口变化
// ============================================================
window.addEventListener(
    "resize",
    () => {
        resizeCanvas();
        render();
    }
);
window.addEventListener("orientationchange", () => {
    setTimeout(() => { resizeCanvas(); render(); }, 180);
});
// ============================================================
// 启动：先选择战役，再选择阵营
// ============================================================
resizeCanvas();
render();
initializeMainMenu();

// V0.3 刷新恢复：游戏进行中每10秒保存当前快照，并在页面离开前再写一次。
setInterval(()=>{try{if(turnSystem&&Array.isArray(units)&&units.length&&currentScenarioKey)saveSystem.saveResume({units,turnSystem,gameState,gameOver,scenario,world});}catch(e){}},10000);
window.addEventListener('beforeunload',()=>{try{if(turnSystem&&Array.isArray(units)&&units.length&&currentScenarioKey)saveSystem.saveResume({units,turnSystem,gameState,gameOver,scenario,world});}catch(e){}});
