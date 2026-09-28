// ============================================================

// Renderer.js

// 东线 1941

//

// 地图渲染系统

// V0.4A

//

// 功能：

// - 六角格地图

// - 地形

// - 河流

// - 道路

// - 铁路

// - 城镇

// - 军事单位

// - 单位选中框

// - 移动范围

// ============================================================

import {

    drawHexPath

} from "./Hex.js";

export class Renderer {

    constructor(

        canvas,

        world,

        camera

    ) {

        this.canvas = canvas;

        this.ctx =

            canvas.getContext("2d");

        this.world =

            world;

        this.camera =

            camera;

        // 颜色只表达战役角色：红=进攻方，蓝=防守方
        this.attackerSide = "german";
        this.defenderSide = "soviet";

        // ----------------------------------------------------

        // Hex 大小

        // ----------------------------------------------------

        this.hexSize = Number(this.world?.hexSize ?? 24);

        // ----------------------------------------------------

        // 外部系统引用

        // ----------------------------------------------------

        this.selection = null;

        this.movementSystem = null;

        // ----------------------------------------------------

        // 地图颜色

        // ----------------------------------------------------

        this.colors = {

            plain:

                "#b4b28f",

            forest:

                "#65705a",

            hill: "#8f8a68",

            mountain: "#77745f",

            marsh:

                "#87917b",

            wetland:

                "#87917b",

            urban:

                "#aaa184",

            water:

                "#7693a1",

            concession:

                "#d8d2b5",

            grid:

                "#747660",

            road:

                "#a38e69",

            railway:

                "#57564c",

            river:

                "#668ba0"

        };

    }

    // ========================================================

    // 清空画布

    // ========================================================

    clear() {

        const ctx =

            this.ctx;

        ctx.save();

        ctx.setTransform(

            1,

            0,

            0,

            1,

            0,

            0

        );

        ctx.clearRect(

            0,

            0,

            this.canvas.width,

            this.canvas.height

        );

        ctx.fillStyle =

            "#8f9078";

        ctx.fillRect(

            0,

            0,

            this.canvas.width,

            this.canvas.height

        );

        ctx.restore();

    }

    // ========================================================

    // Hex → 世界坐标

    // ========================================================

    hexToWorld(

        q,

        r

    ) {

        const size =

            this.hexSize;

        return {

            x:

                size *

                Math.sqrt(3) *

                (

                    q +

                    r / 2

                ),

            y:

                size *

                1.5 *

                r

        };

    }

    // ========================================================

    // 世界坐标 → 屏幕坐标

    // ========================================================

    worldPointToScreen(

        x,

        y

    ) {

        return {

            x:

                x *

                this.camera.zoom +

                this.camera.x,

            y:

                y *

                this.camera.zoom +

                this.camera.y

        };

    }

    // ========================================================

    // Hex → 屏幕坐标

    // ========================================================

    worldToScreen(

        q,

        r

    ) {

        const world =

            this.hexToWorld(

                q,

                r

            );

        return this.worldPointToScreen(

            world.x,

            world.y

        );

    }

    // ========================================================

    // 地形颜色

    // ========================================================

    terrainColor(

        terrain

    ) {

        return (

            this.colors[terrain] ??

            this.colors.plain

        );

    }

    // ========================================================

    // 绘制基础地图

    // ========================================================

    drawTerrain() {

        const ctx =

            this.ctx;

        const size =

            this.hexSize *

            this.camera.zoom;

        for (

            let r = 0;

            r < this.world.height;

            r++

        ) {

            for (

                let q = 0;

                q < this.world.width;

                q++

            ) {

                const p =

                    this.worldToScreen(

                        q,

                        r

                    );

                const terrain =

                    this.world.terrainAt(

                        q,

                        r

                    );

                drawHexPath(

                    ctx,

                    p.x,

                    p.y,

                    size

                );

                ctx.fillStyle =

                    this.terrainColor(

                        terrain

                    );

                ctx.fill();

                ctx.strokeStyle =

                    this.colors.grid;

                ctx.lineWidth =

                    Math.max(

                        0.6,

                        this.camera.zoom

                    );

                ctx.stroke();

            }

        }

    }

    // ========================================================

    // 获取地图要素

    // ========================================================

    getFeatureArray(

        ...names

    ) {

        for (

            const name

            of names

        ) {

            if (

                Array.isArray(

                    this.world[name]

                )

            ) {

                return this.world[name];

            }

        }

        return [];

    }

    // ========================================================

    // 将地图要素节点转换成 Hex

    // ========================================================

    featureHex(

        point

    ) {

        if (!point) {

            return null;

        }

        if (

            Array.isArray(point)

        ) {

            return {

                q: Number(point[0]),

                r: Number(point[1])

            };

        }

        if (

            point.q !== undefined &&

            point.r !== undefined

        ) {

            return {

                q: Number(point.q),

                r: Number(point.r)

            };

        }

        return null;

    }

    // ========================================================

    // 绘制线路

    // ========================================================

    drawFeatureLines(

        features,

        options = {}

    ) {

        const ctx =

            this.ctx;

        const color =

            options.color ??

            "#000000";

        const width =

            options.width ??

            2;

        const dashed =

            options.dashed ??

            false;

        ctx.save();

        ctx.strokeStyle =

            color;

        ctx.lineWidth =

            width *

            this.camera.zoom;

        ctx.lineCap =

            "round";

        ctx.lineJoin =

            "round";

        if (dashed) {

            ctx.setLineDash([

                5 * this.camera.zoom,

                5 * this.camera.zoom

            ]);

        }

        for (

            const feature

            of features

        ) {

            const points =

                feature.points ??

                feature.path ??

                feature.hexes ??

                feature;

            if (

                !Array.isArray(points) ||

                points.length < 2

            ) {

                continue;

            }

            ctx.beginPath();

            let started =

                false;

            for (

                const rawPoint

                of points

            ) {

                const hex =

                    this.featureHex(

                        rawPoint

                    );

                if (!hex) {

                    continue;

                }

                const p =

                    this.worldToScreen(

                        hex.q,

                        hex.r

                    );

                if (!started) {

                    ctx.moveTo(

                        p.x,

                        p.y

                    );

                    started =

                        true;

                }

                else {

                    ctx.lineTo(

                        p.x,

                        p.y

                    );

                }

            }

            if (started) {

                ctx.stroke();

            }

        }

        ctx.restore();

    }

    // ========================================================

    // 河流

    // ========================================================

    drawRivers() {

        const rivers =

            this.getFeatureArray(

                "rivers",

                "riverFeatures"

            );

        this.drawFeatureLines(

            rivers,

            {

                color:

                    this.colors.river,

                width:

                    3.2

            }

        );

    }

    // ========================================================

    // 道路

    // ========================================================

    drawRoads() {

        const roads =

            this.getFeatureArray(

                "roads",

                "roadFeatures"

            );

        this.drawFeatureLines(

            roads,

            {

                color:

                    this.colors.road,

                width:

                    1.8

            }

        );

        // CBD战术地图：在道路本体上绘制街道名称。
        // 标签位置取道路中点，并根据道路方向自动旋转；
        // 道路名称直接以黑色粗体绘制，不使用底幕、边框或阴影。
        const ctx = this.ctx;
        ctx.save();
        for (const road of roads) {
            const pts = road.points ?? road.path ?? [];
            const label = road.nameZh ?? road.name ?? "";
            if (!label || pts.length < 2) continue;

            const midIndex = Math.floor((pts.length - 1) / 2);
            const aRaw = pts[Math.max(0, midIndex - 1)];
            const mRaw = pts[midIndex];
            const bRaw = pts[Math.min(pts.length - 1, midIndex + 1)];
            const qr = (x) => Array.isArray(x) ? { q: x[0], r: x[1] } : x;
            const a = qr(aRaw), m = qr(mRaw), b = qr(bRaw);
            if (m?.q === undefined || m?.r === undefined) continue;

            const p = this.worldToScreen(m.q, m.r);
            const pa = this.worldToScreen(a.q, a.r);
            const pb = this.worldToScreen(b.q, b.r);
            let angle = Math.atan2(pb.y - pa.y, pb.x - pa.x);
            // 保持文字从左到右阅读，避免倒置。
            if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;

            const fontSize = Math.max(9, Math.min(14, 11 * this.camera.zoom));
            ctx.font = `600 ${fontSize}px FangSong, STKaiti, serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);
            ctx.font = `700 ${fontSize}px FangSong, STKaiti, serif`;
            ctx.fillStyle = "#171812";
            ctx.fillText(label, 0, 0);
            ctx.rotate(-angle);
            ctx.translate(-p.x, -p.y);
        }
        ctx.restore();

    }

    // ========================================================

    // 铁路

    // ========================================================

    drawRailways() {

        const railways =

            this.getFeatureArray(

                "railways",

                "rails",

                "railwayFeatures"

            );

        this.drawFeatureLines(

            railways,

            {

                color:

                    this.colors.railway,

                width:

                    1.2,

                dashed:

                    true

            }

        );

    }

    // ========================================================

    // 城镇

    // ========================================================

    drawSettlements() {

        const settlements =

            this.getFeatureArray(

                "settlements",

                "cities",

                "towns"

            );

        const ctx =

            this.ctx;

        ctx.save();

        for (

            const settlement

            of settlements

        ) {

            const q =

                settlement.q;

            const r =

                settlement.r;

            if (

                q === undefined ||

                r === undefined

            ) {

                continue;

            }

            const p =

                this.worldToScreen(

                    q,

                    r

                );

            const radius =

                Math.max(

                    3,

                    4 *

                    this.camera.zoom

                );

            ctx.beginPath();

            ctx.arc(

                p.x,

                p.y,

                radius,

                0,

                Math.PI * 2

            );

            ctx.fillStyle =

                "#34352e";

            ctx.fill();

            ctx.font =

                `${

                    Math.max(

                        10,

                        13 *

                        this.camera.zoom

                    )

                }px FangSong, STKaiti, serif`;

            ctx.fillStyle =

                "#4c493f";

            ctx.textAlign =

                "left";

            ctx.textBaseline =

                "middle";

            const settlementName = settlement.nameZh ?? settlement.name ?? "";
            if (settlement.strategicObjective) {
                ctx.font = `${Math.max(12, 16 * this.camera.zoom)}px FangSong, STKaiti, serif`;
                ctx.fillStyle = "#8b2f2a";
                ctx.textAlign = "center";
                ctx.fillText("★", p.x, p.y - radius - 7);
            }
            ctx.font = `${Math.max(10, 13 * this.camera.zoom)}px FangSong, STKaiti, serif`;
            ctx.fillStyle = "#4c493f";
            ctx.textAlign = "left";
            ctx.fillText(settlementName, p.x + radius + 5, p.y);

        }

        ctx.restore();

    }

    // ========================================================

    // 移动范围

    // ========================================================

    drawMovementRange() {

        if (

            !this.movementSystem ||

            !this.movementSystem.selectedUnit

        ) {

            return;

        }

        const ctx =

            this.ctx;

        const size =

            this.hexSize *

            this.camera.zoom;

        ctx.save();

        for (

            const [

                key,

                cost

            ]

            of this.movementSystem

                .reachable

                .entries()

        ) {

            const [

                q,

                r

            ] =

                key

                    .split(",")

                    .map(Number);

            const p =

                this.worldToScreen(

                    q,

                    r

                );

            drawHexPath(

                ctx,

                p.x,

                p.y,

                size * 0.92

            );

            ctx.fillStyle =

                "rgba(96, 137, 91, 0.32)";

            ctx.fill();

            ctx.strokeStyle =

                "rgba(65, 103, 65, 0.82)";

            ctx.lineWidth =

                Math.max(

                    1,

                    1.5 *

                    this.camera.zoom

                );

            ctx.stroke();

            // 放大后显示移动成本

            if (

                this.camera.zoom >= 1.15

            ) {

                ctx.fillStyle =

                    "rgba(35, 55, 35, 0.75)";

                ctx.font =

                    `${

                        Math.max(

                            8,

                            9 *

                            this.camera.zoom

                        )

                    }px FangSong, serif`;

                ctx.textAlign =

                    "center";

                ctx.textBaseline =

                    "middle";

                ctx.fillText(

                    String(cost),

                    p.x,

                    p.y

                );

            }

        }

        ctx.restore();

    }

    // ========================================================

    // 单位颜色

    // ========================================================

    normalizeFactionSide(value) {

        const v = String(value ?? "").trim().toLowerCase();

        if (["ger", "german", "germany", "axis"].includes(v)) return "german";
        if (["ussr", "soviet", "redarmy", "red_army"].includes(v)) return "soviet";
        if (["chn", "china", "chinese"].includes(v)) return "chinese";
        if (["jpn", "japan", "japanese"].includes(v)) return "japanese";
        if (["gbr", "british", "uk"].includes(v)) return "british";
        if (["ita", "italian", "italy"].includes(v)) return "italian";
        if (["usa", "american", "us"].includes(v)) return "american";
        if (["allied", "allies", "allied_force"].includes(v)) return "allied";
        if (["rok_gov", "rok_government", "government"].includes(v)) return "rok_government";
        if (["newmil", "new_military", "rebel"].includes(v)) return "new_military";

        return v;
    }

    setScenarioSides(attacker, defender) {
        this.attackerSide = this.normalizeFactionSide(attacker);
        this.defenderSide = this.normalizeFactionSide(defender);
    }

    factionColor(faction) {

        const side = this.normalizeFactionSide(faction);

        // 固定阵营色：避免因“进攻方/防守方”互换而导致同一国家在不同关卡变色。
        // 中国军：蓝；日军：红；苏军：红；德军：灰蓝。
        if (side === "chinese") return "#667f96";
        if (side === "japanese") return "#b65b55";
        if (side === "soviet") return "#b65b55";
        if (side === "german") return "#6f7880";
        if (side === "british") return "#8b7658";
        if (side === "american") return "#6f8267";
        if (side === "italian") return "#9a9272";
        if (side === "allied") return "#667f96";
        if (side === "rok_government") return "#667f96";
        if (side === "new_military") return "#b65b55";

        return "#aaa58f";
    }

    // ========================================================

    // 绘制军事符号

    // ========================================================

    drawMilitarySymbol(unit, x, y, width, height) {

        const ctx = this.ctx;

        const rawType = String(unit.type ?? unit.unitType ?? unit.branch ?? "infantry").toLowerCase();

        const id = String(unit.id ?? "").toUpperCase();

        const name = String(unit.name ?? "");

        const echelon = String(unit.echelon ?? unit.level ?? unit.formation ?? "").toLowerCase();

        const type = rawType.replace(/[ _-]/g, "");

        const isGuard = id.includes("_GUARD") || type.includes("guard") || /警卫/.test(name);

        // HQ 身份与编制层级严格分离：
        // “师团/旅团/联队”出现在普通单位名称中，只表示隶属关系，不能据此画成指挥单位。
        // 只有数据明确标记为 HQ，或 ID 明确以 _HQ 结尾时，才使用指挥旗符号。
        const isHQ = !isGuard && (
            ["headquarters", "hq", "command", "commandpost"].includes(type) ||
            id.endsWith("_HQ")
        );

        const isEngineer = type.includes("engineer") || type.includes("sapper") || /工兵/.test(name);

        const isAT = type.includes("antitank") || type === "at" || /反坦克/.test(name);

        const isRecon = type.includes("recon") || /侦察/.test(name);

        const isArmor = type.includes("armor") || type.includes("tank") || /装甲|坦克/.test(name);

        const isArtillery = type.includes("artillery") || type.includes("gun") || /炮兵|火炮/.test(name);

        const isCavalry = type.includes("cavalry") || /骑兵/.test(name);

        // V0.7.7 独立海军战术符号。保持陆军算子的矩形军棋风格，
        // 但用舰型轮廓/炮塔/飞行甲板等图形与陆军 NATO 符号明确区分。
        const navalType = ({
            aircraftcarrier: "carrier", carrier: "carrier",
            battleship: "battleship", battlecruiser: "battlecruiser",
            heavycruiser: "heavycruiser", lightcruiser: "lightcruiser", cruiser: "lightcruiser",
            destroyer: "destroyer", destroyerescort: "escort", escort: "escort",
            submarine: "submarine", transport: "transport", lst: "landing", landingcraft: "landing",
            minesweeper: "minesweeper", torpedoboat: "torpedoboat"
        })[type] || (unit?.naval === true ? "ship" : null);

        ctx.save();

        ctx.strokeStyle = "#171916";

        ctx.fillStyle = "#171916";

        ctx.lineWidth = Math.max(1.35, 1.8 * this.camera.zoom);

        ctx.lineCap = "round";

        ctx.lineJoin = "round";

        if (navalType) {
            const L=x-width*0.29, R=x+width*0.29, T=y-height*0.19, B=y+height*0.19;
            const line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
            const dot=(cx,cy,rr,fill=true)=>{ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);fill?ctx.fill():ctx.stroke();};
            if(navalType === "carrier"){
                ctx.strokeRect(L,T,R-L,B-T); line(x-width*.19,y,x+width*.19,y); line(x+width*.08,T,x+width*.08,B);
            } else if(navalType === "battleship"){
                line(L,y,R,y); dot(x-width*.16,y,height*.10); dot(x+width*.16,y,height*.10); line(x-width*.05,y-height*.15,x+width*.05,y+height*.15);
            } else if(navalType === "battlecruiser"){
                line(L,y,R,y); dot(x-width*.13,y,height*.09); line(x+width*.08,y-height*.12,R,y); line(R,y,x+width*.08,y+height*.12);
            } else if(navalType === "heavycruiser"){
                line(L,y,R,y); dot(x,y,height*.11); line(x-width*.16,y-height*.11,x-width*.16,y+height*.11); line(x+width*.16,y-height*.11,x+width*.16,y+height*.11);
            } else if(navalType === "lightcruiser"){
                line(L,y,R,y); dot(x,y,height*.085,false); line(x-width*.11,y-height*.10,x-width*.11,y+height*.10);
            } else if(navalType === "destroyer"){
                line(L,y,x+width*.15,y); line(x+width*.15,y-height*.14,R,y); line(R,y,x+width*.15,y+height*.14);
            } else if(navalType === "escort"){
                line(L,y,x+width*.12,y); line(x+width*.12,y-height*.11,R,y); line(R,y,x+width*.12,y+height*.11); dot(x-width*.10,y,height*.06,false);
            } else if(navalType === "submarine"){
                line(L,y,R,y); ctx.beginPath();ctx.ellipse(x,y,width*.12,height*.12,0,0,Math.PI*2);ctx.stroke(); line(x,y-height*.12,x,y-height*.24);
            } else if(navalType === "transport"){
                ctx.strokeRect(x-width*.20,y-height*.15,width*.40,height*.30); line(x-width*.26,y+height*.15,x+width*.26,y+height*.15);
            } else if(navalType === "landing"){
                ctx.strokeRect(x-width*.20,y-height*.16,width*.40,height*.25); line(x-width*.13,y+height*.10,x,y+height*.25); line(x,y+height*.25,x+width*.13,y+height*.10);
            } else if(navalType === "minesweeper"){
                line(L,y-height*.10,x-width*.08,y+height*.10); line(x-width*.08,y+height*.10,x+width*.08,y-height*.10); line(x+width*.08,y-height*.10,R,y+height*.10); dot(L,y-height*.10,height*.045); dot(R,y+height*.10,height*.045);
            } else if(navalType === "torpedoboat"){
                line(L,y-height*.10,x,y); line(x,y,R,y-height*.10); line(L,y+height*.10,x,y); line(x,y,R,y+height*.10);
            } else {
                line(L,y,R,y); line(R,y,x+width*.17,y-height*.13); line(R,y,x+width*.17,y+height*.13);
            }
        } else if (isGuard) {

            ctx.beginPath();

            ctx.moveTo(x - width * 0.29, y - height * 0.23);

            ctx.lineTo(x + width * 0.20, y + height * 0.24);

            ctx.moveTo(x + width * 0.20, y - height * 0.23);

            ctx.lineTo(x - width * 0.29, y + height * 0.24);

            ctx.stroke();

            ctx.font = `bold ${Math.max(7, height * 0.23)}px Consolas, monospace`;

            ctx.textAlign = "right";

            ctx.textBaseline = "top";

            ctx.fillText("H", x + width * 0.39, y - height * 0.39);

        } else if (isHQ) {

            const left = x - width * 0.27;

            ctx.beginPath();

            ctx.moveTo(left, y + height * 0.27);

            ctx.lineTo(left, y - height * 0.29);

            ctx.lineTo(x + width * 0.10, y - height * 0.20);

            ctx.lineTo(left, y - height * 0.08);

            ctx.stroke();

            const rankText = `${echelon} ${name}`.toLowerCase();

            // 未识别的基层 HQ 默认无星，避免大队本部等被错误标为一星。
            let stars = 0;

            if (/front|armygroup|方面军|集团军群/.test(rankText)) stars = 4;

            else if (/panzergroup|armoredgroup|装甲集群/.test(rankText)) stars = 3;

            else if (/army|集团军/.test(rankText)) stars = 3;

            else if (/corps|军部|军司令部/.test(rankText)) stars = 2;

            else if (/division|brigade|师部|师司令部|师团|旅团/.test(rankText)) stars = 1;

            else if (/battalion|大队本部|营部/.test(rankText)) stars = 0;
            else if (/regiment|regimental|团部|团司令部|联队/.test(rankText)) stars = 0;

            ctx.font = `${Math.max(7, height * 0.30)}px FangSong, STKaiti, serif`;

            ctx.textAlign = "left";

            ctx.textBaseline = "middle";

            ctx.fillText("★".repeat(stars), x - width * 0.02, y + height * 0.10);

        } else if (isEngineer) {

            ctx.beginPath();

            ctx.moveTo(x - width * 0.25, y + height * 0.22);

            ctx.lineTo(x - width * 0.25, y - height * 0.18);

            ctx.lineTo(x + width * 0.25, y - height * 0.18);

            ctx.lineTo(x + width * 0.25, y + height * 0.22);

            ctx.stroke();

        } else if (isAT) {

            ctx.beginPath();

            ctx.moveTo(x - width * 0.28, y);

            ctx.lineTo(x + width * 0.28, y);

            ctx.stroke();

            ctx.beginPath();

            ctx.arc(x, y, height * 0.12, 0, Math.PI * 2);

            ctx.stroke();

        } else if (isRecon) {

            ctx.beginPath();

            ctx.moveTo(x - width * 0.28, y + height * 0.20);

            ctx.lineTo(x, y - height * 0.22);

            ctx.lineTo(x + width * 0.28, y + height * 0.20);

            ctx.stroke();

        } else if (isArmor) {

            ctx.beginPath();

            ctx.ellipse(x, y, width * 0.27, height * 0.18, 0, 0, Math.PI * 2);

            ctx.stroke();

        } else if (isArtillery) {

            ctx.beginPath();

            ctx.moveTo(x, y - height * 0.30);

            ctx.lineTo(x, y + height * 0.30);

            ctx.stroke();

            ctx.beginPath();

            ctx.arc(x, y, height * 0.10, 0, Math.PI * 2);

            ctx.fill();

        } else if (isCavalry) {

            ctx.beginPath();

            ctx.moveTo(x - width * 0.28, y + height * 0.22);

            ctx.lineTo(x + width * 0.22, y - height * 0.22);

            ctx.stroke();

        } else {

            ctx.beginPath();

            ctx.moveTo(x - width * 0.30, y - height * 0.25);

            ctx.lineTo(x + width * 0.30, y + height * 0.25);

            ctx.moveTo(x + width * 0.30, y - height * 0.25);

            ctx.lineTo(x - width * 0.30, y + height * 0.25);

            ctx.stroke();

        }

        ctx.restore();

    }

    // ========================================================

    compactUnitName(name = "") {

        let text = String(name).replace(/\s+/g, "").trim();

        text = text.replace(/第(\d+)(装甲|坦克|摩托化步兵|摩步|步兵|炮兵|反坦克|工兵|骑兵)(师|旅|团|营|连)/g, "$1$2$3");

        text = text.replace(/摩托化步兵/g, "摩步").replace(/机械化步兵/g, "机步");

        text = text.replace(/集团军警卫第(\d+)营/g, "集警$1营").replace(/方面军警卫第(\d+)营/g, "方警$1营");

        text = text.replace(/装甲集群警卫第(\d+)营/g, "装集警$1营");

        text = text.replace(/师部第(\d+)警卫连/g, "师警$1连").replace(/团部警卫连/g, "团警连");

        return text.length > 10 ? `${text.slice(0, 10)}…` : text;

    }

    // ========================================================
    // 城墙边界层
    // ========================================================
    drawWallEdges() {
        const edges=this.world?.wallEdges ?? this.world?.config?.wallEdges ?? [];
        if(!Array.isArray(edges)||!edges.length)return;
        const ctx=this.ctx;
        for(const e of edges){
            const a=e?.from??{},b=e?.to??{};
            const p1=this.worldToScreen(Number(a.q),Number(a.r)),p2=this.worldToScreen(Number(b.q),Number(b.r));
            if(!Number.isFinite(p1.x)||!Number.isFinite(p2.x))continue;
            const mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2,dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,half=this.hexSize*this.camera.zoom*.52;
            const hp=Number(e.hp??e.maxHp??1);
            const status=hp<=0?'breached':String(e.status??'intact').toLowerCase();
            // 城墙耐久归零即形成缺口：地图上不再绘制该段，同时寻路允许通过。
            if (hp <= 0 || ['breached','destroyed'].includes(status)) continue;
            ctx.save();ctx.strokeStyle='#3f3a2d';ctx.lineCap='square';ctx.lineWidth=Math.max(2.4,4.2*this.camera.zoom);
            if(status==='open')ctx.setLineDash([half*.18,half*.64,half*.18]);else ctx.setLineDash([]);
            ctx.beginPath();ctx.moveTo(mx-nx*half,my-ny*half);ctx.lineTo(mx+nx*half,my+ny*half);ctx.stroke();ctx.restore();
        }
    }

    // ========================================================

    // 防御工事层

    // ========================================================

    drawFortifications() {

        const source = this.world?.fortifications;

        if (!source) return;

        const ctx = this.ctx;

        // 统一转换为 [key, fort]，兼容 Map、Array 和普通 Object。

        let entries = [];

        if (source instanceof Map) {

            entries = Array.from(source.entries());

        } else if (Array.isArray(source)) {

            entries = source.map((fort, index) => [index, fort]);

        } else if (typeof source === "object") {

            entries = Object.entries(source);

        } else {

            return;

        }

        for (const [key, rawFort] of entries) {

            const fort =

                rawFort && typeof rawFort === "object"

                    ? rawFort

                    : {};

            let q;

            let r;

            // 新版格式：工事对象自身保存 q / r。

            if (fort.q !== undefined && fort.r !== undefined) {

                q = Number(fort.q);

                r = Number(fort.r);

            }

            // 兼容旧版 Map/Object："q,r" -> fort。

            else if (typeof key === "string" && key.includes(",")) {

                const parts = key.split(",");

                q = Number(parts[0]);

                r = Number(parts[1]);

            }

            // 兼容 Map 的对象 key：{ q, r }。

            else if (

                key &&

                typeof key === "object" &&

                key.q !== undefined &&

                key.r !== undefined

            ) {

                q = Number(key.q);

                r = Number(key.r);

            }

            // 兼容 Map 的数组 key：[q, r]。

            else if (Array.isArray(key) && key.length >= 2) {

                q = Number(key[0]);

                r = Number(key[1]);

            } else {

                continue;

            }

            if (!Number.isFinite(q) || !Number.isFinite(r)) {

                continue;

            }

            const p = this.worldToScreen(q, r);

            const size = this.hexSize * this.camera.zoom;

            const level = Math.max(1, Math.min(3, Number(fort?.level ?? 1)));

            ctx.save();

            ctx.strokeStyle =

                fort?.owner === "german" ||

                fort?.owner === "GER" ||

                fort?.owner === "Germany"

                    ? "#3e4a42"

                    : "#7b3f36";

            ctx.lineWidth = Math.max(

                1.2,

                (1.3 + level * 0.55) * this.camera.zoom

            );

            ctx.setLineDash([]);

            // 用短折线表现战壕/加固阵地，不遮盖基础地形。

            const y = p.y + size * 0.28;

            const half = size * 0.48;

            ctx.beginPath();

            ctx.moveTo(p.x - half, y);

            ctx.lineTo(p.x - half * 0.55, y - size * 0.12);

            ctx.lineTo(p.x - half * 0.12, y);

            ctx.lineTo(p.x + half * 0.28, y - size * 0.12);

            ctx.lineTo(p.x + half, y);

            ctx.stroke();

            if (level >= 2) {

                ctx.beginPath();

                ctx.moveTo(p.x - half * 0.72, y + size * 0.13);

                ctx.lineTo(p.x - half * 0.25, y + size * 0.03);

                ctx.lineTo(p.x + half * 0.20, y + size * 0.13);

                ctx.lineTo(p.x + half * 0.68, y + size * 0.03);

                ctx.stroke();

            }

            if (level >= 3) {

                ctx.fillStyle = ctx.strokeStyle;

                ctx.font =

                    `${Math.max(8, 10 * this.camera.zoom)}px Consolas, monospace`;

                ctx.textAlign = "center";

                ctx.textBaseline = "middle";

                ctx.fillText("III", p.x, p.y + size * 0.55);

            }

            ctx.restore();

        }

    }

    // 绘制单位

    // ========================================================

   drawUnits(units = []) {

    const ctx = this.ctx;
    const zoom = Number(this.camera.zoom ?? 1);

    for (const unit of units) {

        if (unit?.offMap === true) {
            continue;
        }

        // 当前兵力
        const current = Number(
            unit?.strength ??
            unit?.manpower ??
            0
        );

        // 已被消灭或兵力无效的单位不绘制
        if (
            unit?.destroyed === true ||
            !Number.isFinite(current) ||
            current <= 0
        ) {
            continue;
        }

        // 没有地图坐标的单位不绘制
        if (unit.q === undefined || unit.r === undefined) {
            continue;
        }


        // ========================================================
        // 单位位置与尺寸
        // ========================================================

        const p = this.worldToScreen(unit.q, unit.r);

        const baseW =
            zoom < 0.72 ? 26 :
            zoom < 1.18 ? 32 :
            36;

        const baseH =
            zoom < 0.72 ? 18 :
            zoom < 1.18 ? 22 :
            25;

        const width = baseW * zoom;
        const height = baseH * zoom;


        // ========================================================
        // 被选中单位的黄色边框
        // ========================================================

        const selected =
            this.selection &&
            this.selection.selectedUnit === unit;

        if (selected) {

            ctx.save();

            ctx.strokeStyle = "#e8c85b";
            ctx.lineWidth = Math.max(2, 3 * zoom);

            ctx.strokeRect(
                p.x - width / 2 - 4,
                p.y - height / 2 - 4,
                width + 8,
                height + 8
            );

            ctx.restore();
        }


        // ========================================================
        // 单位算子底色与边框
        // ========================================================

        ctx.save();

        ctx.fillStyle = this.factionColor(unit.faction);
        ctx.strokeStyle = "#171916";
        ctx.lineWidth = Math.max(1.3, 1.8 * zoom);

        ctx.fillRect(
            p.x - width / 2,
            p.y - height / 2,
            width,
            height
        );

        ctx.strokeRect(
            p.x - width / 2,
            p.y - height / 2,
            width,
            height
        );

        ctx.restore();


        // ========================================================
        //  军事单位符号
        // ========================================================

        this.drawMilitarySymbol(
            unit,
            p.x,
            p.y,
            width,
            height
        );


        // ========================================================
        // 算子顶部兵力：当前 / 初始（例如 45/100）
        // ========================================================
        const maxStrength = Number(
            unit?.maxStrength ?? unit?.initialStrength ?? unit?.maxManpower ?? current
        );
        ctx.save();
        ctx.fillStyle = "#111";
        ctx.font = `bold ${Math.max(7, 8 * zoom)}px Consolas, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
            `${Math.max(0, Math.round(current))}/${Math.max(1, Math.round(maxStrength || current || 1))}`,
            p.x,
            p.y - height / 2 - 2 * zoom
        );
        ctx.restore();

        // ========================================================
        // 缩放太小时不显示单位名称
        // ========================================================

        if (zoom < 0.72) {
            continue;
        }


        // ========================================================
        // 单位名称
        // ========================================================

        const shortName = this.compactUnitName(
            unit.shortName ??
            unit.name ??
            unit.id ??
            ""
        );

        if (shortName) {

            ctx.save();

            ctx.fillStyle = "#34352f";

            ctx.font =
                `${Math.max(7, 8.5 * zoom)}px FangSong, STKaiti, serif`;

            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            ctx.fillText(
                shortName,
                p.x,
                p.y + height / 2 + 3
            );

            ctx.restore();
        }


        // ========================================================
        // 指挥官信息
        // ========================================================

        const commander = String(
            unit.commander ??
            unit.commanderName ??
            unit.leader ??
            ""
        ).trim();

        const unitType = String(
            unit.type ??
            unit.unitType ??
            unit.branch ??
            ""
        )
            .toLowerCase()
            .replace(/[ _-]/g, "");

        const unitId = String(
            unit.id ?? ""
        ).toUpperCase();

        const unitName = String(
            unit.name ?? ""
        );


        // ========================================================
        // 警卫单位判定
        // ========================================================

        const isGuardUnit =
            unitId.includes("_GUARD") ||
            unitType.includes("guard") ||
            /警卫/.test(unitName);


        // ========================================================
        // 指挥部判定
        // 警卫单位不作为指挥部处理
        // ========================================================

        const isCommandUnit =
            !isGuardUnit &&
            (
                [
                    "headquarters",
                    "hq",
                    "command",
                    "commandpost"
                ].includes(unitType) ||

                unitId.endsWith("_HQ") ||

                /司令部|指挥部|军部|师部|团部/.test(unitName)
            );


        // ========================================================
        // 指挥官姓名
        // ========================================================

        if (
            isCommandUnit &&
            commander &&
            zoom >= 1.0
        ) {

            ctx.save();

            ctx.fillStyle = "#34352f";

            ctx.font =
                `${Math.max(7, 7.5 * zoom)}px FangSong, STKaiti, serif`;

            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            ctx.fillText(
                `指挥官：${commander}`,
                p.x,
                p.y + height / 2 + Math.max(12, 13 * zoom)
            );

            ctx.restore();
        }

    } // ← 关闭 for (const unit of units)

} // ← 关闭 drawUnits()



    drawMinefields() {
        const mines = this.world?.minefields;
        if (!Array.isArray(mines)) return;
        const ctx=this.ctx; const zoom=this.camera.zoom??1;
        for (const m of mines) {
            const p=this.worldToScreen(Number(m.q),Number(m.r));
            ctx.save(); ctx.strokeStyle=this.factionColor(m.owner); ctx.lineWidth=Math.max(1,1.5*zoom);
            const d=5*zoom; ctx.beginPath(); ctx.moveTo(p.x-d,p.y-d);ctx.lineTo(p.x+d,p.y+d);ctx.moveTo(p.x+d,p.y-d);ctx.lineTo(p.x-d,p.y+d);ctx.stroke(); ctx.restore();
        }
    }

// ========================================================
// 总渲染
// ========================================================

render(
    units = []
) {

    this.clear();


    // ========================================================
    // 地形
    // ========================================================

    this.drawTerrain();


    // ========================================================
    // 防御工事
    // ========================================================

    this.drawFortifications();
    this.drawWallEdges();

    this.drawMinefields();


    // ========================================================
    // 地理要素
    // ========================================================

    this.drawRoads();

    this.drawRailways();

    this.drawRivers();

    this.drawSettlements();


    // ========================================================
    // 移动范围
    // 必须位于单位下面
    // ========================================================

    this.drawMovementRange();


    // ========================================================
    // 单位
    // ========================================================

    this.drawUnits(
        units
    );

} // ← 关闭 render()


} // ← 关闭 Renderer 类
