// src/ui/CampaignSelection.js

import { CAMPAIGNS } from "../../data/campaigns.js";

 

export class CampaignSelection {

    constructor() {

        this.overlay = null;

        this.theater = null;

        this.phase = null;

        this.onScenarioSelected = null;
        this.onMainMenu = null;
        this.onReturnToBattle = null;
        this.hasActiveBattle = false;
        this._escHandler = (event) => { if (event.key === "Escape" && this.overlay) this.returnOut(); };
        document.addEventListener("keydown", this._escHandler);
    }

    show(onScenarioSelected, options = {}) {
        this.onScenarioSelected = onScenarioSelected;
        this.onMainMenu = options.onMainMenu ?? null;
        this.onReturnToBattle = options.onReturnToBattle ?? null;
        this.hasActiveBattle = !!options.hasActiveBattle;
        this.renderTheaters();
    }

    returnOut() {
        this.close();
        if (this.hasActiveBattle && this.onReturnToBattle) this.onReturnToBattle();
        else this.onMainMenu?.();
    }

 

    close() {

        this.overlay?.remove();

        this.overlay = null;

    }

 

    ensureOverlay() {

        this.close();

        this.overlay = document.createElement("div");

        this.overlay.id = "campaign-selection";

        Object.assign(this.overlay.style, {

            position: "fixed", inset: "0", zIndex: "100000",

            background: "rgba(28,31,26,.94)",

            display: "flex", alignItems: "center", justifyContent: "center",

            fontFamily: "FangSong, STFangsong, SimSun, serif"

        });

        document.body.appendChild(this.overlay);

        return this.overlay;

    }

 

    shell(title, subtitle, body, back = "") {

        const overlay = this.ensureOverlay();

        overlay.innerHTML = `

            <div style="width:min(980px,calc(100vw - 48px));max-height:90vh;overflow:auto;

                padding:32px 38px;box-sizing:border-box;background:#d6cfb2;color:#24251f;

                border:2px solid #5a5646;outline:1px solid #c6b98b;outline-offset:-8px;">

                <h1 style="margin:0;text-align:center;font-size:34px;letter-spacing:.12em;">${title}</h1>

                <div style="margin:8px 0 28px;text-align:center;color:#666253;">${subtitle}</div>

                ${body}

                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px;">
                  ${back ? `<button id="campaign-back" style="padding:9px 18px;">← 返回上一级</button>` : ""}
                  <button id="campaign-main" style="padding:9px 18px;">返回主界面</button>
                  ${this.hasActiveBattle ? `<button id="campaign-battle" style="padding:9px 18px;">返回当前战役</button>` : ""}
                </div>
            </div>`;

        if (back) overlay.querySelector("#campaign-back").onclick = back;
        overlay.querySelector("#campaign-main").onclick = () => { this.close(); this.onMainMenu?.(); };
        overlay.querySelector("#campaign-battle")?.addEventListener("click", () => { this.close(); this.onReturnToBattle?.(); });

        return overlay;

    }

 

    renderTheaters() {

        const cards = CAMPAIGNS.map(item => `

            <button data-theater="${item.id}" style="min-height:150px;padding:20px;

                border:1px solid #696553;background:#c8c1a4;cursor:pointer;font:inherit;text-align:left;">

                <strong style="display:block;font-size:26px;margin-bottom:10px;">${item.name}</strong>

                <span>${item.subtitle}</span>

            </button>`).join("");

 

        const overlay = this.shell(

            "选择战场",

            "1937–1945 主战役 · 特殊战役合集",

            `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">${cards}</div>`

        );

 

        overlay.querySelectorAll("[data-theater]").forEach(button => {

            button.onclick = () => {

                this.theater = CAMPAIGNS.find(x => x.id === button.dataset.theater);

                this.renderPhases();

            };

        });

    }

 

    renderPhases() {

        const cards = this.theater.phases.map(item => `

            <button data-phase="${item.id}" style="min-height:110px;padding:18px;

                border:1px solid #696553;background:#c8c1a4;cursor:pointer;font:inherit;text-align:left;">

                <strong style="font-size:21px;">${item.name}</strong>

                <div style="margin-top:10px;color:#625e50;">

                    ${item.scenarios.some(s => s.status === "available") ? "可进入" : (item.scenarios.some(s => s.status === "interface") ? "战役接口已建立" : "尚未开放")}

                </div>

            </button>`).join("");

 

        const overlay = this.shell(

            this.theater.name,

            "选择战役阶段",

            `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">${cards}</div>`,

            () => this.renderTheaters()

        );

 

        overlay.querySelectorAll("[data-phase]").forEach(button => {

            button.onclick = () => {

                this.phase = this.theater.phases.find(x => x.id === button.dataset.phase);

                this.renderScenarios();

            };

        });

    }

 

    renderScenarios() {

        const list = this.phase.scenarios.length

            ? this.phase.scenarios.map(item => {

                const locked = !["available", "interface"].includes(item.status);
                const interfaceOnly = item.status === "interface" || item.interfaceOnly === true;

                return `<button data-scenario="${item.id}" ${locked ? "disabled" : ""}

                    style="min-height:130px;padding:20px;border:1px solid #696553;

                    background:${locked ? "#aaa58f" : "#c8c1a4"};cursor:${locked ? "not-allowed" : "pointer"};

                    font:inherit;text-align:left;opacity:${locked ? ".65" : "1"};">

                    <strong style="display:block;font-size:24px;">${item.name}</strong>

                    ${Array.isArray(item.children) && item.children.length ? `<span style="display:inline-block;margin-top:8px;padding:3px 8px;border:1px solid #817a62;background:#ded7bb;color:#403d32;font-size:13px;">含 ${item.children.length} 个子战役</span>` : ""}

                    <span style="display:block;margin-top:8px;">${item.dateText ?? "开发中"}</span>

                    <span style="display:block;margin-top:8px;color:#625e50;">

                        ${locked ? "尚未开放" : (interfaceOnly ? `${item.location ?? ""} · 接口已建立 / 地图与单位待制作` : (item.location ?? "可进入战役"))}

                    </span>

                </button>`;

            }).join("")

            : `<div style="padding:40px;text-align:center;">该阶段战役尚未开放。</div>`;

 

        const overlay = this.shell(

            this.phase.name,

            this.theater.name,

            `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">${list}</div>`,

            () => this.renderPhases()

        );

 

        overlay.querySelectorAll("[data-scenario]:not([disabled])").forEach(button => {

            button.onclick = () => {
                const item = this.phase.scenarios.find(x => x.id === button.dataset.scenario);
                if (Array.isArray(item?.children) && item.children.length) this.renderScenarioGroup(item);
                else this.renderBriefing(button.dataset.scenario);
            };

        });

    }

 

    renderScenarioGroup(parent) {
        const entries = [parent, ...(parent.children ?? [])];
        const cards = entries.map((item, index) => {
            const interfaceOnly = item.status === "interface" || item.interfaceOnly === true;
            const label = index === 0 ? (interfaceOnly ? "会战总览接口" : "进入会战主战役") : "子战役";
            return `<button data-child="${item.id}" style="min-height:130px;padding:20px;border:1px solid #696553;background:#c8c1a4;cursor:pointer;font:inherit;text-align:left;">
                <strong style="display:block;font-size:24px;">${item.name}</strong>
                <span style="display:block;margin-top:8px;">${item.dateText ?? ""}</span>
                <span style="display:block;margin-top:8px;color:#625e50;">${label} · ${item.location ?? ""}</span>
            </button>`;
        }).join("");
        const overlay = this.shell(parent.name, "会战主战役与所属子战役", `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">${cards}</div>`, () => this.renderScenarios());
        overlay.querySelectorAll("[data-child]").forEach(button => {
            button.onclick = () => {
                const id = button.dataset.child;
                const item = entries.find(x => x.id === id);
                this.renderBriefingObject(item, parent);
            };
        });
    }

    renderBriefingObject(scenario, parent = null) {
        const overlay = this.shell(
            scenario.name, `${scenario.dateText ?? ""} · ${scenario.location ?? ""}`,
            `<div style="padding:24px;background:#c8c1a4;border:1px solid #696553;line-height:1.8;">
                ${parent && parent.id !== scenario.id ? `<div><strong>所属会战：</strong>${parent.name}</div>` : ""}
                <div><strong>战场：</strong>${this.theater.name}</div><div><strong>阶段：</strong>${this.phase.name}</div>
                <div><strong>战役：</strong>${scenario.name}</div><div><strong>规模：</strong>营 / 连级战术单位</div>
                ${scenario.urbanDefense ? `<div><strong>城市防御：</strong>启用分段城墙系统（独立耐久 / 0耐久形成缺口 / 完整城墙禁止绕行）</div>` : ""}
                ${scenario.interfaceOnly ? `<div style="margin-top:18px;padding:12px;border:1px dashed #696553;"><strong>开发状态：</strong>战役接口已建立；地图、单位与具体任务数据将在后续版本制作。</div>` : ""}
                <button id="campaign-start" ${scenario.interfaceOnly ? "disabled" : ""} style="display:block;margin:28px auto 0;padding:12px 34px;font:inherit;font-size:18px;cursor:${scenario.interfaceOnly ? "not-allowed" : "pointer"};opacity:${scenario.interfaceOnly ? ".55" : "1"};">${scenario.interfaceOnly ? "接口已建立 · 待制作" : "开始战役"}</button>
            </div>`, () => parent ? this.renderScenarioGroup(parent) : this.renderScenarios());
        if (!scenario.interfaceOnly) overlay.querySelector("#campaign-start").onclick = () => { this.close(); this.onScenarioSelected?.(scenario.id); };
    }

    renderBriefing(id) {

        const parent = this.phase.scenarios.find(x => x.id === id || x.children?.some(c => c.id === id));
        const scenario = parent?.id === id ? parent : parent?.children?.find(c => c.id === id);
        if (!scenario) return;
        if (parent?.id !== id) return this.renderBriefingObject(scenario, parent);

        const overlay = this.shell(

            scenario.name,

            `${scenario.dateText ?? ""} · ${scenario.location ?? ""}`,

            `<div style="padding:24px;background:#c8c1a4;border:1px solid #696553;line-height:1.8;">

                <div><strong>战场：</strong>${this.theater.name}</div>

                <div><strong>阶段：</strong>${this.phase.name}</div>

                <div><strong>战役：</strong>${scenario.name}</div>

                <div><strong>规模：</strong>营 / 连级战术单位</div>
                ${scenario.urbanDefense ? `<div><strong>城市防御：</strong>启用分段城墙系统（独立耐久 / 0耐久形成缺口 / 完整城墙禁止绕行）</div>` : ""}
                ${scenario.interfaceOnly ? `<div style="margin-top:18px;padding:12px;border:1px dashed #696553;"><strong>开发状态：</strong>战役接口已建立；地图、单位与具体任务数据将在后续版本制作。</div>` : ""}

                <button id="campaign-start" ${scenario.interfaceOnly ? "disabled" : ""} style="display:block;margin:28px auto 0;padding:12px 34px;

                    font:inherit;font-size:18px;cursor:${scenario.interfaceOnly ? "not-allowed" : "pointer"};opacity:${scenario.interfaceOnly ? ".55" : "1"};">${scenario.interfaceOnly ? "接口已建立 · 待制作" : "开始战役"}</button>

            </div>`,

            () => this.renderScenarios()

        );

 

        if (!scenario.interfaceOnly) {
            overlay.querySelector("#campaign-start").onclick = () => {
                this.close();
                this.onScenarioSelected?.(scenario.id);
            };
        }

    }

}
