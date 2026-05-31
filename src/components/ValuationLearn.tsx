import Link from "next/link";
import {
  TrendingUp,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  LineChart,
  RefreshCw,
} from "lucide-react";

// 法人怎麼看財報 + 預估 EPS — 完整教學頁
//
// 內容整理自使用者跟 Gemini 的深度對話、再加上實務補充
// 重點：Forward EPS + 反推 PE + 景氣循環陷阱 + 欣興 / 國巨實戰

export function ValuationLearn() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="overflow-hidden rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-50 p-6 shadow-md">
        <div className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <BookOpen size={11} /> 估值教學 · 法人視角
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          📊 法人怎麼看財報 + 預估 EPS
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
          從營收、毛利率推到 EPS、再到目標價 —
          一套<strong>機構投資人實戰流程</strong>。
          看完你會懂：為什麼欣興 PE 看起來 155 倍但其實是 37 倍？為什麼國巨毛利衝到 60% 反而要賣？
          <span className="block mt-1 text-[11px] text-gray-500">
            💡 純資料整理 + 估值方法論教學、不構成投資建議。
          </span>
        </p>

        {/* 章節導航 */}
        <nav className="mt-4 flex flex-wrap gap-2 text-[11px]">
          {[
            { id: "trends", emoji: "🔍", label: "1. 掌握產業趨勢" },
            { id: "eps-calc", emoji: "🧮", label: "2. EPS 5 步驟算法" },
            { id: "pe-method", emoji: "⚖️", label: "3. 合理 PE 怎麼給" },
            { id: "forward", emoji: "⏭️", label: "4. Forward EPS 心法" },
            { id: "case-uniwill", emoji: "🎯", label: "5. 欣興實戰" },
            { id: "retail-flow", emoji: "✅", label: "6. 散戶 3 步驟" },
            { id: "cyclical", emoji: "⚠️", label: "7. 景氣循環陷阱" },
            { id: "case-yageo", emoji: "💎", label: "8. 國巨 2018 + 推演" },
            { id: "tools", emoji: "🛠️", label: "9. 你可以用的工具" },
          ].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-md border border-indigo-300 bg-white px-2 py-1 font-medium text-indigo-800 hover:bg-indigo-100"
            >
              {s.emoji} {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ═══════════ Section 1: 掌握產業趨勢 ═══════════ */}
      <section id="trends" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<TrendingUp size={18} />}
          title="1. 法人怎麼掌握產業趨勢？"
          subtitle="不靠猜、靠交叉驗證 (Cross-Check)"
        />

        <Card>
          <h3 className="font-bold text-gray-900">🔄 三層交叉驗證</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <MiniCard
              tag="上游"
              title="產能 + 交期"
              desc="想知道台積電好不好？先看 ASML 光刻機訂單、矽晶圓廠稼動率"
            />
            <MiniCard
              tag="下游"
              title="終端需求"
              desc="想知道手機產業？追蹤零售通路、電信商庫存天數"
            />
            <MiniCard
              tag="同業"
              title="競爭態勢"
              desc="A 公司 vs B 公司營收消長 — 是「產業擴大」還是「市佔轉移」？"
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900">📡 關鍵前置指標 (Leading Indicators)</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase text-gray-500">
                  <th className="py-1.5 pr-3">產業</th>
                  <th className="py-1.5">追蹤指標</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b">
                  <td className="py-1.5 pr-3 font-semibold">半導體</td>
                  <td className="py-1.5">Book-to-Bill Ratio（訂單出貨比）、晶圓廠產能利用率</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 pr-3 font-semibold">航運</td>
                  <td className="py-1.5">SCFI（上海出口集裝箱運價指數）、BDI（波羅的海乾散貨指數）</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 pr-3 font-semibold">電子代工 / 品牌</td>
                  <td className="py-1.5">
                    庫存週轉天數 (DSI) — 若營收創高 + 庫存也創高 = 警惕通路塞貨
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 font-semibold">記憶體</td>
                  <td className="py-1.5">DDR5 / NAND 現貨報價（DRAMeXchange 月報）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900">🕵️ 第一手實地調研 (Channel Check)</h3>
          <p className="mt-1 text-xs text-gray-700">
            這是法人最大的優勢 — 直接打電話 / 拜訪：
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-700">
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              公司發言人 / 投資人關係（IR）
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              供應鏈經理（上游零組件廠）
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              離職員工（業界八卦最準）
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              探：「聽說 X 砍單、你們稼動率有影響嗎？」「新產品良率現在多少？」
            </li>
          </ul>
        </Card>
      </section>

      {/* ═══════════ Section 2: EPS 5 步驟 ═══════════ */}
      <section id="eps-calc" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<Calculator size={18} />}
          title="2. 從營業額算到 EPS 的 5 步驟"
          subtitle="法人會建一張「預估損益表」(Projected Income Statement)"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <StepCard
            num="1"
            title="預估毛利"
            formula="預估毛利 = 預估營業額 × 預估毛利率"
            note={[
              "營業額 = ASP × Volume（出貨量）",
              "毛利率 = f(產品組合、稼動率、原物料)",
            ]}
          />
          <StepCard
            num="2"
            title="扣營業費用 → 營業利益"
            formula="營業利益 = 毛利 - 營業費用"
            note={[
              "費用率法：營收 × OPEX% (通常 10%-15%)",
              "絕對金額法：人事 + 研發 + 管理 固定金額",
            ]}
          />
          <StepCard
            num="3"
            title="加減業外 → 稅前淨利"
            formula="稅前淨利 = 營業利益 ± 業外損益"
            note={[
              "業外含利息、補助、匯兌、轉投資",
              "穩定公司常打平、不必細估",
            ]}
          />
          <StepCard
            num="4"
            title="扣稅 → 稅後淨利"
            formula="稅後淨利 = 稅前淨利 × (1 - 稅率)"
            note={["台灣企業稅率通常 20%（參考公司歷史有效稅率）"]}
          />
          <StepCard
            num="5"
            title="÷ 股數 → EPS"
            formula="EPS = 稅後淨利 / 加權平均股數"
            note={[
              "用「加權平均流通在外股數」、不是發行股本",
              "減資 / 增資 / 換股都會影響",
            ]}
          />
          <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-4">
            <h4 className="text-sm font-bold text-emerald-900">💡 法人圈簡化公式</h4>
            <p className="mt-2 rounded bg-white p-2 text-[11px] font-mono leading-relaxed text-gray-800">
              預估 EPS ≈<br />
              <span className="ml-3">
                營業額 × (毛利率 - 營業費用率) × (1 - 稅率)
              </span>
              <br />
              <span className="ml-3 border-t border-gray-300 inline-block w-44 text-center">
                ÷ 發行股數
              </span>
            </p>
            <p className="mt-2 text-[11px] text-emerald-800">
              如果營業費用率 + 稅率穩定、這個公式抓 90% 準度
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ Section 3: 合理 PE ═══════════ */}
      <section id="pe-method" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<Target size={18} />}
          title="3. 「合理本益比」怎麼給？"
          subtitle="不是用數學算出來、是市場「比較」出來的"
        />

        <Card>
          <h3 className="font-bold text-gray-900">⚖️ 四種給 PE 的方法</h3>
          <div className="mt-3 space-y-3">
            <MethodCard
              num="①"
              name="歷史本益比河流圖 (PE Band)"
              desc="拉公司過去 3-5 年 PE 區間"
              example="成長峰值給上緣（如 22-25x）、常態平穩給中位數（如 15-18x）"
            />
            <MethodCard
              num="②"
              name="PEG 估值法"
              desc="PEG = PE ÷ 未來淨利成長率"
              example="PEG = 1 為合理。成長 30%、給 30x PE = PEG=1 合理；成長 10% 但給 30x = PEG=3 泡沫"
            />
            <MethodCard
              num="③"
              name="同業 + 龍頭溢價"
              desc="跟 3-8 家兄弟公司比、龍頭可以給更高"
              example="台積電技術領先 → PE 高於聯電。或對標美股同業（如 NVDA / Marvell）"
            />
            <MethodCard
              num="④"
              name="產業本質與能見度"
              desc="不同產業給的 PE 區間天差地別"
              example="軟體 / IC 設計 25-40x、AI 半導體 25-30x、硬體代工 10-15x、景氣循環 8-12x"
            />
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <h3 className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle size={16} /> 法人的目標價終極公式
          </h3>
          <p className="mt-2 rounded bg-white p-2 font-mono text-xs leading-relaxed">
            目標價 = 預估未來 12 個月的 EPS × 基於成長性 (PEG) 或歷史區間給予的合理 PE
          </p>
          <p className="mt-2 text-[11px] text-amber-800">
            產業趨勢向上時、法人會同時做兩件事：<strong>調升 EPS (Up-earning)</strong> + <strong>調高 PE 評等 (Re-rating)</strong>
            — 這就是飆股多頭時股價超出想像極限的原因。
          </p>
        </Card>
      </section>

      {/* ═══════════ Section 4: Forward EPS 心法 ═══════════ */}
      <section id="forward" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<RefreshCw size={18} />}
          title="4. Forward EPS / Forward PE 心法"
          subtitle="市場用「未來」定價、不是用「現在」"
        />

        <Card className="border-rose-200 bg-rose-50/40">
          <h3 className="font-bold text-rose-900">🎯 觀念核心修正</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase text-gray-500">
                ❌ 一般人以為
              </p>
              <p className="mt-1 text-xs text-gray-700">
                「用<strong>現在的 EPS + 現在的 PE</strong>、推估未來股價」
              </p>
              <p className="mt-2 text-[10px] text-gray-500 italic">
                這是「落後思維」 — 看盤軟體顯示的 PE 用的是過去 4 季 EPS
              </p>
            </div>
            <div className="rounded-md border-2 border-emerald-400 bg-emerald-50 p-3">
              <p className="text-[11px] font-semibold uppercase text-emerald-700">
                ✅ 法人實際操作
              </p>
              <p className="mt-1 text-xs text-gray-700">
                市場現在的股價 = 對<strong>未來 EPS × 未來 PE</strong> 的當下定價
              </p>
              <p className="mt-2 text-[10px] text-emerald-700 italic">
                法人腦袋裡的公式：股價 = Forward EPS × Forward PE
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900">🔁 反推法 (Reverse Engineering)</h3>
          <p className="mt-1 text-xs text-gray-700">
            這是 <strong>散戶最容易上手</strong>、也是法人實務最常用的方法：
          </p>
          <p className="mt-2 rounded bg-gray-900 p-3 font-mono text-xs text-emerald-300">
            市場隱含 Forward PE = 現在股價 ÷ 你預估的未來 EPS
          </p>
          <ul className="mt-3 space-y-1 text-xs text-gray-700">
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              用<strong>明年 (2026E) EPS</strong> 算出隱含 PE — 看市場「最近的預期」
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              用<strong>後年 (2027E) EPS</strong> 算出隱含 PE — 看市場「中期定價」
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-700">→</span>
              對照<strong>歷史 PE 區間 + 同業 PE</strong>、判斷合不合理
            </li>
          </ul>
        </Card>
      </section>

      {/* ═══════════ Section 5: 欣興實戰 ═══════════ */}
      <section id="case-uniwill" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<LineChart size={18} />}
          title="5. 實戰案例 — 欣興 (3037)"
          subtitle="2026/5 真實數據、看穿 155 倍 PE 的假象"
        />

        <Card>
          <h3 className="font-bold text-gray-900">📊 已知條件</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <FactRow label="股價" value="1,055 元" />
            <FactRow label="發行股數" value="約 15.89 億股" />
            <FactRow label="看盤軟體 PE" value="155.14 倍 ⚠️" />
            <FactRow label="2026 Q1 實際 EPS" value="3.28 元（YoY+24.5%）" />
            <FactRow label="2026E 全年 EPS (法人共識)" value="14~15 元" />
            <FactRow label="2027E 全年 EPS (法人預估)" value="28~29 元" />
          </div>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30">
          <h3 className="font-bold text-rose-900">🔍 用反推法看穿三組 PE</h3>
          <div className="mt-3 space-y-3">
            <ReverseCalcRow
              label="❌ 看盤軟體顯示的 PE"
              formula="1055 ÷ 過去 4 季 EPS 6.8 元"
              result="155 倍"
              comment="這是「落後指標」、用過去業績計算、看起來像超級泡沫但其實無意義"
              color="rose"
            />
            <ReverseCalcRow
              label="🟡 看 2026E 預估 EPS"
              formula="1055 ÷ 2026E EPS 14.5 元"
              result="72.7 倍"
              comment="如果你只看今年、股價真的是瘋了（同業最多給 25-30x）"
              color="amber"
            />
            <ReverseCalcRow
              label="✅ 看 2027E 預估 EPS"
              formula="1055 ÷ 2027E EPS 28.5 元"
              result="37 倍"
              comment="這才是市場真正的定價邏輯 — AI 半導體核心材料廠合理區間 35-40 倍"
              color="emerald"
            />
          </div>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <h3 className="flex items-center gap-2 font-bold text-emerald-900">
            <CheckCircle2 size={16} /> 結論
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-700">
            <strong>市場買 1055 元的人、根本沒在看 2026</strong>、他們已經把目光移到 2027 大爆發。
            欣興從「傳統 PCB 廠（PE 10-12x）」被 <strong>Re-rating</strong> 成「AI 半導體核心材料廠（PE 25-37x）」、
            合理目標價如果用 2027E EPS 28.5 × 30x = <strong>855 元</strong>、用 35x 則是 <strong>998 元</strong>。
            <br />
            <br />
            <strong className="text-emerald-800">→ 1055 元在這套框架下、是「市場已經提前定價 2027 的合理股價」、不是泡沫。</strong>
            <br />
            <span className="text-[10px] text-gray-500 italic">
              但前提：2027 EPS 真的會達到 28.5 元 — 需要持續用月營收、毛利率、訂單能見度去驗證。
            </span>
          </p>
        </Card>
      </section>

      {/* ═══════════ Section 6: 散戶 3 步驟 ═══════════ */}
      <section id="retail-flow" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<CheckCircle2 size={18} />}
          title="6. 散戶能做的 3 步驟流程"
          subtitle="不要自己建模 — 抄共識 + 反推 + 對照"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <RetailStepCard
            num="1"
            title="抄共識 EPS"
            desc="去財報狗「獲利預估」、券商報告、外資新聞、找 2026E / 2027E EPS 中位數"
            tip="不要自己算 — 抄市場主力們腦袋裡的數字"
          />
          <RetailStepCard
            num="2"
            title="反推市場 PE"
            desc="現在股價 ÷ 抄來的預估 EPS = 市場隱含 PE"
            tip="這告訴你「市場現在認定它值幾倍」"
          />
          <RetailStepCard
            num="3"
            title="對照歷史 + 同業"
            desc="反推出來的 PE，比歷史最高還高 → 太貴；在中位數 → 合理"
            tip="加上歷史 PE band、就能判斷現在進場時機"
          />
        </div>

        <Card className="border-indigo-200 bg-indigo-50/30">
          <h3 className="font-bold text-indigo-900">💡 心法總結</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-700">
            「別管現在的本益比多高、法人一定在看明年的 EPS、我去查查他們估多少？」<br />
            「用現在的股價除以明年的 EPS、原來市場正在給它 OOO 倍的本益比啊！」<br />
            「這個 OOO 倍對照它的歷史紀錄跟同業、算合理嗎？」
          </p>
        </Card>
      </section>

      {/* ═══════════ Section 7: 景氣循環陷阱 ═══════════ */}
      <section id="cyclical" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<AlertTriangle size={18} />}
          title="7. 景氣循環股 vs 成長股的 PE 陷阱"
          subtitle="這是最違背直覺、最多人陣亡的地方"
        />

        <Card className="border-amber-300 bg-amber-50/40">
          <h3 className="font-bold text-amber-900">⚠️ 反直覺真相</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase text-gray-500">
                  <th className="py-1.5 pr-3">公司類型</th>
                  <th className="py-1.5 pr-3">獲利越高 →</th>
                  <th className="py-1.5">本益比變化</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5 pr-3 font-semibold">成長科技股</td>
                  <td className="py-1.5 pr-3">市場越嗨</td>
                  <td className="py-1.5 text-emerald-700">PE 給越高（雙擊 ↗↗）</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 font-semibold">景氣循環股</td>
                  <td className="py-1.5 pr-3">市場知道好景不長</td>
                  <td className="py-1.5 text-rose-700">PE 反而越低（雙殺 ↘↘）</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-amber-900">
            <strong>原因：</strong>產品同質性高的循環股（被動元件、航運、鋼鐵）、毛利噴出時市場知道
            「同業會擴產、最終毛利會回到常態」。因此<strong>毛利越高、市場越認為這是「最後高點」</strong>、PE 急速收斂到 8-12x。
          </p>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900">📋 景氣循環股操作戰法</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 p-3">
              <p className="text-xs font-bold text-emerald-900">🟢 買進時機</p>
              <ul className="mt-1 space-y-1 text-[11px] text-gray-700">
                <li>· 毛利在谷底（25-28%）</li>
                <li>· 營收年增率開始翻正</li>
                <li>· <strong>看盤軟體顯示 PE 看起來超高（50-100x）</strong></li>
                <li>· 這時候閉著眼睛買</li>
              </ul>
            </div>
            <div className="rounded-md border-2 border-rose-300 bg-rose-50 p-3">
              <p className="text-xs font-bold text-rose-900">🔴 賣出時機</p>
              <ul className="mt-1 space-y-1 text-[11px] text-gray-700">
                <li>· 新聞瘋狂報導缺貨</li>
                <li>· 公司單季 EPS 30 元創歷史</li>
                <li>· 毛利率摸到 50-60%</li>
                <li>· <strong>看盤軟體顯示 PE 看起來超便宜（6-8x）</strong></li>
                <li>· 趕快獲利了結、不要貪戀</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* ═══════════ Section 8: 國巨 2018 + 推演 ═══════════ */}
      <section id="case-yageo" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<LineChart size={18} />}
          title="8. 實戰案例 — 國巨 (2327) 2018 神級循環 + 未來推演"
          subtitle="景氣循環股 PE 陷阱的歷史鐵證"
        />

        <Card>
          <h3 className="font-bold text-gray-900">🎢 2018 超級循環時間軸</h3>
          <div className="mt-2 space-y-2">
            <TimelineRow
              date="2017 Q1"
              event="谷底"
              detail="毛利率 25.05% / 單季 EPS 1.62 元"
              color="gray"
            />
            <TimelineRow
              date="2018/01"
              event="醞釀爆發"
              detail="股價 382 元、PE 103.83x（市場開始定價未來、看起來像超級泡沫）"
              color="emerald"
              tag="此時該買"
            />
            <TimelineRow
              date="2018 Q2"
              event="毛利神級噴出"
              detail="毛利率 64.10% / 營益率 55.77% / 單季 EPS 25.70 元"
              color="amber"
            />
            <TimelineRow
              date="2018 Q3"
              event="獲利絕對巔峰"
              detail="單季 EPS 34.35 元 / 全年化 EPS 約 100-120 元"
              color="amber"
            />
            <TimelineRow
              date="2018/07"
              event="股價歷史天價"
              detail="股價 1,310 元、隱含 PE 僅 13x（用全年化 EPS 100 元）— 看起來超便宜"
              color="rose"
              tag="此時該賣"
            />
            <TimelineRow
              date="2018 H2 之後"
              event="暴跌"
              detail="毛利從 64% 急速收斂、股價腰斬再腰斬"
              color="gray"
            />
          </div>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30">
          <h3 className="font-bold text-purple-900">🔮 未來推演：如果 2026-2027 國巨毛利再摸 60%</h3>
          <p className="mt-1 text-xs text-gray-700">
            AI 伺服器 + 車用電子需求大爆發、MLCC 再次缺貨、毛利率從現在的 33% 一路衝到 60% 領域：
          </p>
          <div className="mt-3 space-y-2">
            <ProjectionRow
              label="預估巔峰年化 EPS"
              value="120 元"
              note="比 2018 規模更大（併購基美後）"
            />
            <ProjectionRow
              label="合理景氣循環 PE"
              value="10 - 12x"
              note="高階車用比重提升、抗跌性比 2018 好一點"
            />
            <ProjectionRow
              label="目標價天花板"
              value="1,200 - 1,440 元"
              note="120 × 10 = 1,200 / 120 × 12 = 1,440"
              highlight
            />
          </div>
          <p className="mt-3 rounded bg-white p-2 text-[11px] text-purple-900">
            <strong>關鍵心法：</strong>巔峰 EPS × 低 PE（10-12x） = 目標價。
            就算 EPS 翻倍、PE 不會跟著翻倍、反而會壓縮 — 這就是循環股的數學特性。
          </p>
        </Card>
      </section>

      {/* ═══════════ Section 9: 工具列 ═══════════ */}
      <section id="tools" className="space-y-3 scroll-mt-4">
        <SectionHeader
          icon={<ArrowRight size={18} />}
          title="9. 你可以用本站工具實作這套流程"
          subtitle="從教學 → 直接動手實作、Stockmate 已準備好"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <ToolCard
            href="/topics/timeline"
            emoji="📅"
            title="題材輪動 Timeline"
            desc="26 個 AI 供應鏈題材的當前 status + Tier 台股、判斷你在循環的哪一階段"
          />
          <ToolCard
            href="/companies/nvda"
            emoji="📖"
            title="NVIDIA 完整供應鏈"
            desc="21 個零組件分類 + 對應台股、看懂 AI 鏈的全貌"
          />
          <ToolCard
            href="/topics/leo-satellite"
            emoji="🛰️"
            title="低軌衛星深度頁"
            desc="另一個產業 vertical 的完整供應鏈拆解"
          />
          <ToolCard
            href="/stock/2330.TW"
            emoji="🔍"
            title="個股深度頁（例：2330 台積電）"
            desc="即時股價、PE band 圖、月營收 YoY、AI 公開資料統整"
          />
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-[11px] text-gray-600">
        <p className="font-semibold text-gray-700">⚖️ 法律免責</p>
        <p className="mt-1 leading-relaxed">
          本頁面為估值方法論教學整理、純資訊整理工具、不構成投資建議。
          所有數字（包含案例中的 EPS / PE / 目標價）為教學示意、實際進場決策請以即時報價 + 自己研究為主。
          投資有賺有賠、申購前應詳閱公開說明書。
        </p>
      </footer>
    </div>
  );
}

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b-2 border-indigo-200 pb-2">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <span className="text-indigo-600">{icon}</span>
        {title}
      </h2>
      <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

function MiniCard({
  tag,
  title,
  desc,
}: {
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-md border border-indigo-200 bg-indigo-50/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase text-indigo-700">{tag}</p>
      <p className="mt-0.5 text-xs font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-700">{desc}</p>
    </div>
  );
}

function StepCard({
  num,
  title,
  formula,
  note,
}: {
  num: string;
  title: string;
  formula: string;
  note: string[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-baseline gap-2">
        <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
          Step {num}
        </span>
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      </div>
      <p className="mt-2 rounded bg-gray-900 p-2 font-mono text-[11px] text-emerald-300">
        {formula}
      </p>
      <ul className="mt-2 space-y-0.5">
        {note.map((n, i) => (
          <li key={i} className="text-[11px] text-gray-600">
            · {n}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MethodCard({
  num,
  name,
  desc,
  example,
}: {
  num: string;
  name: string;
  desc: string;
  example: string;
}) {
  return (
    <div className="rounded-md border-l-4 border-indigo-400 bg-indigo-50/30 p-3">
      <p className="text-sm font-bold text-gray-900">
        <span className="text-indigo-700">{num}</span> {name}
      </p>
      <p className="mt-1 text-xs text-gray-700">{desc}</p>
      <p className="mt-1.5 rounded bg-white px-2 py-1 text-[10px] italic text-gray-600">
        例：{example}
      </p>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5">
      <span className="text-[11px] text-gray-600">{label}</span>
      <span className="text-xs font-bold tabular-nums text-gray-900">
        {value}
      </span>
    </div>
  );
}

function ReverseCalcRow({
  label,
  formula,
  result,
  comment,
  color,
}: {
  label: string;
  formula: string;
  result: string;
  comment: string;
  color: "rose" | "amber" | "emerald";
}) {
  const styles = {
    rose: { border: "border-rose-200", bg: "bg-white", result: "text-rose-700" },
    amber: { border: "border-amber-200", bg: "bg-white", result: "text-amber-700" },
    emerald: { border: "border-emerald-300", bg: "bg-emerald-50", result: "text-emerald-700" },
  };
  const s = styles[color];
  return (
    <div className={`rounded-md border-2 ${s.border} ${s.bg} p-3`}>
      <p className="text-xs font-bold text-gray-900">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
        <code className="rounded bg-gray-900 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
          {formula}
        </code>
        <span className="text-[10px] text-gray-500">=</span>
        <span className={`text-lg font-bold tabular-nums ${s.result}`}>
          {result}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-700">{comment}</p>
    </div>
  );
}

function RetailStepCard({
  num,
  title,
  desc,
  tip,
}: {
  num: string;
  title: string;
  desc: string;
  tip: string;
}) {
  return (
    <div className="rounded-lg border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
        {num}
      </div>
      <h4 className="mt-2 text-sm font-bold text-gray-900">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-gray-700">{desc}</p>
      <p className="mt-2 rounded bg-indigo-100/60 px-2 py-1 text-[11px] text-indigo-800">
        💡 {tip}
      </p>
    </div>
  );
}

function TimelineRow({
  date,
  event,
  detail,
  color,
  tag,
}: {
  date: string;
  event: string;
  detail: string;
  color: "gray" | "emerald" | "amber" | "rose";
  tag?: string;
}) {
  const colors = {
    gray: "border-gray-300 bg-gray-50",
    emerald: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
  };
  return (
    <div className={`rounded-md border-l-4 ${colors[color]} p-2.5`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold uppercase text-gray-500 tabular-nums">
            {date}
          </span>
          <span className="text-xs font-bold text-gray-900">{event}</span>
        </div>
        {tag && (
          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {tag}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-gray-700">{detail}</p>
    </div>
  );
}

function ProjectionRow({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border ${highlight ? "border-purple-400 bg-purple-100 border-2" : "border-gray-200 bg-white"} p-2.5`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span
          className={`text-base font-bold tabular-nums ${highlight ? "text-purple-900" : "text-gray-900"}`}
        >
          {value}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] text-gray-500">{note}</p>
    </div>
  );
}

function ToolCard({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-white p-3 transition hover:border-indigo-400 hover:shadow-md"
    >
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-600">{desc}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700">
          進入 <ArrowRight size={9} />
        </p>
      </div>
    </Link>
  );
}
