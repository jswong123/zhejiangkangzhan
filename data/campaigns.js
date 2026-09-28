// data/campaigns.js

// ============================================================

// 《战线 1937-1945》

// 多战场 / 阶段 / 战役目录

// ============================================================

 

export const CAMPAIGNS = [

 

    // ========================================================

    // 特殊战役：超出 1937-1945 主时间线

    // ========================================================

    {

        id: "special_operations",

        name: "特殊战役",

        subtitle: "Special Operations · Beyond 1937–1945",

        phases: [

            {

                id: "korea_1979",

                name: "1979：汉城政变之夜",

                scenarios: [

                    {

                        id: "seoul_1979_1212",

                        name: "双十二之夜",

                        subtitle: "12·12 Military Insurrection",

                        dateText: "1979年12月12日—13日",

                        location: "韩国·汉城",

                        status: "available",

                        scenarioPath: "./data/scenario-seoul1979.json",

                        unitsPath: "./data/units-seoul1979.json",

                        factions: ["NEWMIL", "ROK_GOV"],

                        roles: { attacker: "new_military", defender: "rok_government" },

                        start: { year:1979, month:12, day:12, hour:18, minute:0, hoursPerTurn:0.5, startingPhase:"new_military" }

                    }

                ]

            }

        ]

    },

 

    // ========================================================

    // 苏德战场

    // ========================================================

    {

        id: "eastern_front",

        name: "苏德战场",

        subtitle: "Eastern Front",

 

        phases: [

 

            // ------------------------------------------------

            // 1941 巴巴罗萨

            // ------------------------------------------------

            {

                id: "barbarossa_1941",

                name: "1941：巴巴罗萨",

 

                scenarios: [

 

                    {

                        id: "dubno",

                        name: "杜布诺战役",

                        subtitle: "Battle of Dubno",

 

                        dateText: "1941年6月26日",

                        location: "乌克兰西部",

 

                        status: "available",

 

                        scenarioPath: "./data/scenario.json",

                        unitsPath: "./data/units.json",

 

                        factions: ["GER", "USSR"],

 

                        roles: {

                            attacker: "german",

                            defender: "soviet"

                        },

 

                        start: {

                            year: 1941,

                            month: 6,

                            day: 26,

                            hour: 8,

                            minute: 0,

                            hoursPerTurn: 2,

                            startingPhase: "german"

                        }

                    },

 

                    {

                        id: "smolensk",

                        name: "斯摩棱斯克战役",

                        subtitle: "Battle of Smolensk",

 

                        dateText: "1941年7月10日",

                        location: "斯摩棱斯克",

 

                        status: "available",

 

                        scenarioPath: "./data/scenario-smolensk.json",

                        unitsPath: "./data/units-smolensk.json",

 

                        factions: ["GER", "USSR"],

 

                        roles: {

                            attacker: "german",

                            defender: "soviet"

                        },

 

                        start: {

                            year: 1941,

                            month: 7,

                            day: 10,

                            hour: 8,

                            minute: 0,

                            hoursPerTurn: 2,

                            startingPhase: "german"

                        }

                    }

                ]

            },

 

            {

                id: "blue_1942",

                name: "1942：蓝色方案",

                scenarios: []

            },

 

            {

                id: "counteroffensive_1943",

                name: "1943：库尔斯克与战略反攻",

                scenarios: [

                    {

                        id: "kursk_1943",

                        name: "库尔斯克会战",

                        subtitle: "Battle of Kursk · Operation Citadel",

                        dateText: "1943年7月5日",

                        location: "苏联·库尔斯克突出部",

                        status: "available",

                        scenarioPath: "./data/scenario-kursk.json",

                        unitsPath: "./data/units-kursk.json",

                        factions: ["GER", "USSR"],

                        roles: { attacker: "german", defender: "soviet" },

                        start: { year:1943, month:7, day:5, hour:4, minute:30, hoursPerTurn:6, startingPhase:"german" }

                    }

                ]

            },

 

            // ------------------------------------------------

            // 1944-45 攻入德国

            // ------------------------------------------------

            {

                id: "germany_1944_45",

                name: "1944–45：攻入德国",

 

                scenarios: [

 

                    {

                        id: "berlin",

                        name: "柏林战役",

                        subtitle: "Battle of Berlin",

 

                        dateText: "1945年4月—5月",

                        location: "德国·柏林",

 

                        status: "available",

 

                        scenarioPath: "./data/scenario-berlin.json",

                        unitsPath: "./data/units-berlin.json",

 

                        factions: ["USSR", "GER"],

 

                        roles: {

                            attacker: "soviet",

                            defender: "german"

                        },

 

                        start: {

                            year: 1945,

                            month: 4,

                            day: 16,

                            hour: 5,

                            minute: 0,

                            hoursPerTurn: 6,

                            startingPhase: "soviet"

                        }

                    }

                ]

            }

        ]

    },

 

 

    // ========================================================

    // 中国战场：抗日战争主要战役总表接口

    // ========================================================

    {

        id: "china_front", name: "中国战场", subtitle: "China Front · 1931–1945",

        phases: [

            {

                id: "china_1931_36", name: "1931–1936：局部抗战",

                scenarios: [

                    { id: "mukden_1931", name: "九一八事变", dateText: "1931年9月18日", location: "辽宁·沈阳", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "heilongjiang_1931", name: "黑龙江战役", dateText: "1931年", location: "黑龙江", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "jiangqiao_1931", name: "江桥抗战", dateText: "1931年11月", location: "黑龙江·江桥", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "harbin_1932", name: "哈尔滨保卫战", dateText: "1932年", location: "哈尔滨", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "shanghai_1932", name: "淞沪抗战（一·二八）", dateText: "1932年1月—3月", location: "上海", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "rehe_1933", name: "热河战役", dateText: "1933年", location: "热河", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "great_wall_1933", name: "长城抗战", dateText: "1933年", location: "长城沿线", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "suiyuan_1936", name: "绥远抗战", dateText: "1936年", location: "绥远", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false }

                ]

            },

            {

                id: "china_1937_38", name: "1937–1938：全面抗战初期",

                scenarios: [

                    { id: "lugouqiao_1937", name: "七七事变", dateText: "1937年7月7日", location: "北平·卢沟桥", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "beiping_tianjin_1937", name: "平津作战", dateText: "1937年7月—8月", location: "北平—天津", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "nankou_1937", name: "南口战役", dateText: "1937年8月", location: "察哈尔·南口", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "shanghai", name: "淞沪会战", dateText: "1937年8月—11月", location: "上海", status: "available", scenarioPath: "./data/scenario-shanghai.json", unitsPath: "./data/units-shanghai.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1937,month:8,day:13,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true , children:[{ id:"sihang", name:"四行仓库保卫战", dateText:"1937年10月26日—11月1日", location:"上海·闸北·四行仓库", status:"available", scenarioPath:"./data/scenario-sihang.json", unitsPath:"./data/units-sihang.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1937,month:10,day:26,hour:22,minute:0,hoursPerTurn:2,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true }] },

                    { id: "jiangyin_1937", name: "江阴保卫战", dateText: "1937年8月—12月", location: "江苏·江阴", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "nanjing", name: "南京保卫战", dateText: "1937年12月", location: "南京", status: "available", scenarioPath: "./data/scenario-nanjing.json", unitsPath: "./data/units-nanjing.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1937,month:12,day:1,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true },

                    { id: "taiyuan_1937", name: "太原会战（含平型关、忻口）", dateText: "1937年9月—11月", location: "山西", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "xuzhou_1938", name: "徐州会战", dateText: "1938年1月—5月", location: "江苏—山东", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true, children:[{ id: "tengxian", name: "滕县保卫战", dateText: "1938年3月16日—18日", location: "山东·滕县", status: "available", scenarioPath: "./data/scenario-tengxian.json", unitsPath: "./data/units-tengxian.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1938,month:3,day:16,hour:6,minute:0,hoursPerTurn:2,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true }, { id: "taierzhuang", name: "台儿庄战役", dateText: "1938年3月—4月", location: "山东·台儿庄", status: "available", scenarioPath: "./data/scenario-taierzhuang.json", unitsPath: "./data/units-taierzhuang.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1938,month:3,day:24,hour:8,minute:0,hoursPerTurn:2,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true }] },

                    { id: "lanfeng_1938", name: "兰封会战", dateText: "1938年5月—6月", location: "河南·兰封", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "chongqing_bombing", name: "重庆大轰炸", dateText: "1938—1943年", location: "重庆", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "wuhan_1938", name: "武汉会战", dateText: "1938年6月11日—10月27日", location: "安徽—江西—湖北·武汉", status: "available", scenarioPath:"./data/scenario-wuhan.json", unitsPath:"./data/units-wuhan.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1938,month:6,day:11,hour:6,minute:0,hoursPerTurn:24,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true, children:[{ id: "wanjialing", name: "万家岭战役", dateText: "1938年10月", location: "江西·德安·万家岭", status: "available", scenarioPath: "./data/scenario-wanjialing.json", unitsPath: "./data/units-wanjialing.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1938,month:10,day:2,hour:8,minute:0,hoursPerTurn:2,startingPhase:"japanese"}, urbanDefense:false, wallSystem:false }] },

                    { id: "guangzhou_1938", name: "广州战役", dateText: "1938年10月12日—29日", location: "广东·大亚湾—惠阳—东莞—广州", status: "available", scenarioPath: "./data/scenario-guangzhou.json", unitsPath: "./data/units-guangzhou.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1938,month:10,day:12,hour:6,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true }

                ]

            },

            {

                id: "china_1939_41_full", name: "1939–1941：战略相持",

                scenarios: [

                    { id: "nanchang_1939", name: "南昌会战", dateText: "1939年3月—5月", location: "江西·南昌", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "suizao_1939", name: "随枣会战", dateText: "1939年5月", location: "湖北·随县—枣阳", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "changsha_campaigns", name: "长沙会战", dateText: "1939—1942年", location: "湖南·长沙及周边", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true, children:[

                        { id: "changsha1_1939", name: "第一次长沙会战", dateText: "1939年9月—10月", location: "湖南·长沙", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                        { id: "changsha2_1941", name: "第二次长沙会战", dateText: "1941年9月—10月", location: "湖南·长沙", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                        { id: "changsha3", name: "第三次长沙会战", dateText: "1941年12月—1942年1月", location: "湖南·长沙", status: "available", scenarioPath: "./data/scenario-changsha3.json", unitsPath: "./data/units-changsha3.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1941,month:12,day:24,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true }

                    ] },

                    { id: "guinan_1939", name: "桂南会战（含昆仑关战役）", dateText: "1939年11月—1940年2月", location: "广西南部", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "kunlun", name: "昆仑关战役", dateText: "1939年12月—1940年1月", location: "广西·昆仑关", status: "available", scenarioPath: "./data/scenario-kunlun.json", unitsPath: "./data/units-kunlun.json", factions:["CHN","JPN"], roles:{attacker:"chinese",defender:"japanese"}, start:{year:1939,month:12,day:18,hour:8,minute:0,hoursPerTurn:6,startingPhase:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "wuyuan_1940", name: "五原战役", dateText: "1940年3月", location: "绥远·五原", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "zaoyi_1940", name: "枣宜会战", dateText: "1940年5月—6月", location: "湖北", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "hundred_regiments_1940", name: "百团大战", dateText: "1940年8月—12月", location: "华北", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "yunan_1941", name: "豫南会战", dateText: "1941年1月—2月", location: "河南南部", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "shanggao_1941", name: "上高会战", dateText: "1941年3月—4月", location: "江西·上高", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "zhongtiaoshan_1941", name: "中条山战役", dateText: "1941年5月—6月", location: "山西·中条山", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

 

                ]

            },

            {

                id: "china_1942_45_full", name: "1942–1945：反攻与战争后期",

                scenarios: [

                    { id: "yenangyaung_1942", name: "仁安羌大捷", dateText: "1942年4月", location: "缅甸·仁安羌", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "western_hubei_1943", name: "鄂西会战", dateText: "1943年5月—6月", location: "湖北西部", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "burma_yunnan_1943", name: "缅北滇西战役", dateText: "1943—1945年", location: "缅北—滇西", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "changde", name: "常德会战", dateText: "1943年11月—12月", location: "湖南·常德", status: "available", scenarioPath: "./data/scenario-changde.json", unitsPath: "./data/units-changde.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1943,month:11,day:2,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true },

                    { id: "ichigo_1944", name: "豫湘桂会战", dateText: "1944年4月—12月", location: "河南—湖南—广西", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "central_henan_1944", name: "豫中会战", dateText: "1944年4月—6月", location: "河南", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "myitkyina_1944", name: "密支那战役", dateText: "1944年5月—8月", location: "缅甸·密支那", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true },

                    { id: "changheng_1944", name: "长衡会战", dateText: "1944年5月—8月", location: "长沙—衡阳", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:true, children:[

                        { id: "hengyang", name: "衡阳保卫战", dateText: "1944年6月23日—8月8日", location: "湖南·衡阳", status: "available", scenarioPath: "./data/scenario-hengyang.json", unitsPath: "./data/units-hengyang.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1944,month:6,day:23,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true }

                    ] },

                    { id: "guilin_liuzhou", name: "桂柳会战", dateText: "1944年9月—11月", location: "广西·桂林—柳州", status: "available", scenarioPath: "./data/scenario-guilin_liuzhou.json", unitsPath: "./data/units-guilin_liuzhou.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1944,month:9,day:14,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true },

                    { id: "xiangyuegan_1945", name: "湘粤赣战役", dateText: "1945年1月—3月", location: "湖南—广东—江西", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "western_henan_hubei_1945", name: "豫西鄂北会战", dateText: "1945年3月—5月", location: "河南西部—湖北北部", status: "interface", interfaceOnly: true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                    { id: "west_hunan", name: "湘西会战", dateText: "1945年4月—6月", location: "湖南西部", status: "available", scenarioPath: "./data/scenario-west_hunan.json", unitsPath: "./data/units-west_hunan.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1945,month:4,day:9,hour:8,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:false, wallSystem:false }

                ]

            },

          {

                id: "zhejiang_resistance", name: "浙江抗战",

                scenarios: [

                    {

                        id: "hangzhou_resistance",

                        name: "杭州地区抗战",

                        dateText: "1937—1945年",

                        location: "浙江·杭州及周边",

                        status: "interface",

                        interfaceOnly: true,

                        factions:["CHN","JPN"],

                        roles:{attacker:"japanese",defender:"chinese"},

                        urbanDefense:true,

                        wallSystem:true,

                        children:[

                            { id:"hangzhou_1937", name:"杭州方向作战", dateText:"1937年12月20日—24日", location:"余杭—杭州—钱塘江", status:"available", scenarioPath:"./data/scenario-hangzhou_1937.json", unitsPath:"./data/units-hangzhou_1937.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1937,month:12,day:20,hour:6,minute:0,hoursPerTurn:6,startingPhase:"japanese"}, urbanDefense:true, wallSystem:true },

                            { id:"qiantang_bridge_1937", name:"钱塘江大桥阻击与爆破", dateText:"1937年12月23日", location:"杭州·钱塘江大桥", status:"interface", interfaceOnly:true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:true, wallSystem:false },

                            { id:"dongzhou_1939", name:"东洲保卫战", dateText:"1939年3月", location:"浙江·富阳·东洲", status:"interface", interfaceOnly:true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false },

                            { id:"tianmu_guerrilla", name:"天目山地区敌后作战", dateText:"1938—1945年", location:"浙江西北·天目山区", status:"interface", interfaceOnly:true, factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, urbanDefense:false, wallSystem:false }

                        ]

                    },

                    { id: "zhejiang_jiangxi_1942", name: "浙赣会战", dateText: "1942年5月15日—9月", location: "浙江—江西·浙赣铁路战区", status: "available", scenarioPath: "./data/scenario-zhejiang_jiangxi.json", unitsPath: "./data/units-zhejiang_jiangxi.json", factions:["CHN","JPN"], roles:{attacker:"japanese",defender:"chinese"}, start:{year:1942,month:5,day:15,hour:6,minute:0,hoursPerTurn:24,startingPhase:"japanese"}, urbanDefense:true, wallSystem:false }

                ]

            },

        ]

    },

 

    // ========================================================

    // 东欧战场

    // ========================================================

    {

        id: "eastern_europe",

        name: "东欧战场",

        subtitle: "Eastern Europe",

 

        phases: [

 

            {

                id: "poland_1939",

                name: "1939：波兰战役",

                scenarios: []

            },

 

            {

                id: "balkans_1941",

                name: "1941：巴尔干战役",

                scenarios: []

            },

 

            {

                id: "romania_hungary_1944",

                name: "1944：罗马尼亚—匈牙利",

                scenarios: []

            },

 

            {

                id: "central_europe_1945",

                name: "1945：中欧决战",

                scenarios: []

            }

        ]

    },

 

 

    // ========================================================

    // 北非战场

    // ========================================================

    {

        id: "north_africa",

        name: "北非战场",

        subtitle: "North Africa",

 

        phases: [

 

            {

                id: "desert_1940_41",

                name: "1940–41：沙漠战争初期",

                scenarios: []

            },

 

            {

                id: "rommel_1941_42",

                name: "1941–42：隆美尔攻势",

                scenarios: []

            },

 

            {

                id: "el_alamein_1942",

                name: "1942：阿拉曼阶段",

                scenarios: []

            },

 

            {

                id: "tunisia_1942_43",

                name: "1942–43：突尼斯战役",

                scenarios: []

            }

        ]

    },

 

 

    // ========================================================

    // 架空太平洋战场

    // ========================================================

    {

        id: "alternate_pacific",

        name: "架空太平洋战场",

        subtitle: "Alternate Pacific War",

 

        phases: [

 

            {

                id: "australia_1943",

                name: "1943：澳洲最后防线",

 

                scenarios: [

 

                    {

                        id: "melbourne_1943",

                        name: "墨尔本保卫战",

                        subtitle: "Defense of Melbourne",

 

                        dateText: "1943年9月",

                        location: "澳大利亚·墨尔本",

 

                        status: "available",

 

                        scenarioPath: "./data/scenario-melbourne.json",

                        unitsPath: "./data/units-melbourne.json",

 

                        factions: ["ALLIED", "JPN"],

 

                        roles: {

                            attacker: "japanese",

                            defender: "allied"

                        },

 

                        start: {

                            year: 1943,

                            month: 9,

                            day: 15,

                            hour: 6,

                            minute: 0,

                            hoursPerTurn: 6,

                            startingPhase: "japanese"

                        }

                    }

,

                    {

                        id: "melbourne_cbd_1943",

                        name: "墨尔本城区保卫战",

                        subtitle: "Defense of Melbourne CBD",

                        dateText: "1943年9月",

                        location: "澳大利亚·墨尔本CBD",

                        status: "available",

                        scenarioPath: "./data/scenario-melbourne-cbd.json",

                        unitsPath: "./data/units-melbourne-cbd.json",

                        factions: ["ALLIED", "JPN"],

                        roles: { attacker: "japanese", defender: "allied" },

                        start: { year: 1943, month: 9, day: 28, hour: 6, minute: 0, hoursPerTurn: 2, startingPhase: "japanese" }

                    }

                ]

            }

        ]

    }

 

];

 

 

// ============================================================

// 战役查找

// ============================================================

 

/**

 * 根据 scenario id 查找战役。

 *

 * @param {string} id

 * @returns {{theater: object, phase: object, scenario: object}|null}

 */

export function findScenarioById(id) {

 

    if (!id) {

        return null;

    }

 

    for (const theater of CAMPAIGNS) {

 

        if (!theater || !Array.isArray(theater.phases)) {

            continue;

        }

 

        for (const phase of theater.phases) {

 

            if (!phase || !Array.isArray(phase.scenarios)) {

                continue;

            }

 

            for (const item of phase.scenarios) {

                if (!item) continue;

                if (item.id === id) return { theater, phase, scenario: item };

                if (Array.isArray(item.children)) {

                    const child = item.children.find(child => child && child.id === id);

                    if (child) return { theater, phase, scenario: child, parentScenario: item };

                }

            }

        }

    }

 

    return null;

}
