import {NAV_ITEMS} from "./tokens"

export const ANALOG = {
  analog:"Netflix", analogYear:"2011", confidence:78, matchCount:3, corpusPercentile:94,
  comparison:[
    { dimension:"Revenue growth",   then:"Decelerating YoY",      now:"Slowing vs. prior 4Q",     trend:[-2,-1,-3,-4,-3,-5,-4], dir:"down", delta:"−1.2pp" },
    { dimension:"Input spend",      then:"Margin compression",     now:"Rising COGS dependency",   trend:[2,3,3,4,3,5,6],       dir:"up",   delta:"+2.1pp" },
    { dimension:"Geographic focus", then:"Intl. expansion pivot",  now:"New-market push",          trend:[1,1,2,2,3,4,4],       dir:"up",   delta:"+14%" },
    { dimension:"Core pricing",     then:"Subscriber stress",      now:"Unit economics pressure",  trend:[-1,-2,-1,-3,-2,-4,-3], dir:"down", delta:"−3.7%" },
  ],
  outcome:"18-month restructuring. Stock fell 77% before a decade-long recovery. The pivot, not the crisis, defined the company.",
};

export const CHAIN = [
  { id:1, label:"Market pressure rising",      detail:"Revenue growth slowing vs. prior 4 quarters — a structural deceleration, not a seasonal dip.",            signal:"−3.4pp YoY",      dir:"down",    strength:3 },
  { id:2, label:"Supply dependency increasing",detail:"3 critical vendors account for 61% of COGS. Concentration risk is rising, not stabilizing.",               signal:"61% concentration",dir:"up",     strength:3 },
  { id:3, label:"Margin compression risk",     detail:"Gross margin has declined 4.2 percentage points over 6 quarters — a consistent structural trend.",         signal:"−4.2pp / 6Q",     dir:"down",    strength:2 },
  { id:4, label:"Historical match found",      detail:"78% structural similarity to Netflix 2011 — the closest analog in the corpus by signal density.",          signal:"78% similarity",   dir:"neutral", strength:2 },
  { id:5, label:"Potential strategic shift",   detail:"Historical base rate: companies with this pattern undertake an expansion pivot or pricing restructure within 18 months.", signal:"Base rate: 68%", dir:"neutral", strength:1 },
];

export const STRUCTURAL_FEED = [
  {
    company:"Nvidia",        sector:"Semiconductors",
    event:"Dependency concentration rising",
    detail:"Top 3 customers now 54% of revenue. Concentration increasing for 3rd consecutive quarter.",
    spark:[3,4,4,5,5,6,7,8],  confidence:82, dir:"up",
    horizon:"12–18mo",        updated:"4h",  severity:"warning",
    density:[1,1,1,1,0,1,1,1],
  },
  {
    company:"Microsoft",     sector:"Enterprise Software",
    event:"Margin structure stabilizing",
    detail:"Operating margin variance narrowing after 6 quarters of compression. Structural floor forming.",
    spark:[8,6,5,4,4,4,4,5],  confidence:71, dir:"neutral",
    horizon:"6–12mo",         updated:"6h",  severity:"neutral",
    density:[0,1,0,1,0,0,1,0],
  },
  {
    company:"Amazon",        sector:"Cloud / Retail",
    event:"Expansion pivot detected",
    detail:"AWS capex trajectory and geographic signals match pre-pivot patterns in 2018 corpus analog.",
    spark:[2,3,3,4,5,6,6,7],  confidence:74, dir:"up",
    horizon:"18–24mo",        updated:"12h", severity:"warning",
    density:[1,0,1,1,0,1,0,1],
  },
  {
    company:"Tesla",         sector:"EVs / Energy",
    event:"Revenue deceleration deepening",
    detail:"YoY growth rate has declined for 5 consecutive quarters. Structural, not cyclical.",
    spark:[9,8,7,6,5,4,3,2],  confidence:88, dir:"down",
    horizon:"6–12mo",         updated:"1d",  severity:"warning",
    density:[1,1,1,1,1,1,1,1],
  },
  {
    company:"Alphabet",      sector:"Digital Advertising",
    event:"Input cost dependency easing",
    detail:"COGS as % of revenue declined 2.1pp over 4 quarters. Structural improvement in cost base.",
    spark:[8,7,7,6,6,5,5,4],  confidence:68, dir:"down",
    horizon:"12mo",           updated:"1d",  severity:"positive",
    density:[1,0,0,1,0,1,0,0],
  },
];

export const TICKER_ITEMS = [
  "Nvidia · Dependency concentration ↑ · 82%",
  "Tesla · Revenue deceleration deepening · 88%",
  "Amazon · Expansion pivot detected · 74%",
  "Alphabet · Cost structure improving · 68%",
  "Microsoft · Margin floor forming · 71%",
  "Apple · Pricing pressure stabilizing · 65%",
  "Meta · Capex cycle accelerating · 77%",
  "TSMC · Geographic diversification · 70%",
];

export const PULSE_MATRIX = [
  {
    label:"Pressure increasing",
    count:31, change:"+4 this week",
    spark:[2,3,3,4,5,6,7,8,8,9],
    dir:"up", severity:"warning",
    description:"Companies with rising cost, margin, or competitive pressure signals",
  },
  {
    label:"Growth slowing",
    count:18, change:"+2 this week",
    spark:[9,8,8,7,6,6,5,4,4,3],
    dir:"down", severity:"warning",
    description:"Companies showing structural deceleration in core revenue metrics",
  },
  {
    label:"Restructuring risk",
    count:9, change:"stable",
    spark:[4,4,5,4,4,5,5,4,5,5],
    dir:"neutral", severity:"neutral",
    description:"Companies with analog matches to historical restructuring patterns",
  },
  {
    label:"Expansion pivot",
    count:14, change:"+1 this week",
    spark:[3,3,4,4,5,5,6,7,7,8],
    dir:"up", severity:"positive",
    description:"Companies showing signals consistent with geographic or segment expansion",
  },
];

export const SEARCH_TRENDING = [
  { label:"Nvidia",    signal:"Dependency risk ↑",  confidence:82, spark:[3,4,5,6,7,8], analyzed:"4h ago" },
  { label:"Tesla",     signal:"Deceleration deep",  confidence:88, spark:[9,8,7,6,4,2], analyzed:"1d ago" },
  { label:"Amazon",    signal:"Expansion pivot",    confidence:74, spark:[2,3,4,5,6,7], analyzed:"12h ago" },
  { label:"Apple",     signal:"Margin stable",      confidence:71, spark:[6,6,5,5,5,5], analyzed:"2d ago" },
];
export const SEARCH_RECENT = [
  { label:"Microsoft · FY2024 structural analysis", time:"Yesterday" },
  { label:"Alphabet vs Google 2015 analog",         time:"2d ago" },
  { label:"Netflix restructuring pattern",          time:"3d ago" },
];

export const COVERAGE = ["Apple","Microsoft","Nvidia","Amazon","Alphabet","Meta","Tesla","Berkshire","TSMC","Reliance"];

const TICKER_MAP = {
  "Apple": "AAPL",
  "Microsoft": "MSFT",
  "Nvidia": "NVDA",
  "Amazon": "AMZN",
  "Alphabet": "GOOGL",
  "Meta": "META",
  "Tesla": "TSLA",
  "Berkshire": "BRK.B",
  "TSMC": "TSM",
  "Reliance": "RELIANCE.NS",
  "Spotify": "SPOT",
  "Adobe": "ADBE",
  "Salesforce": "CRM",
  "Samsung": "SSNLF"
};

export const CMD_ITEMS = [
  { group:"Navigate",   items: NAV_ITEMS.map(n => ({ label:n.label, sub:"Page", path:n.path })) },
  { group:"Companies",  items: [...COVERAGE,"Spotify","Adobe","Salesforce","Samsung"].map(c => ({ label:c, sub:"Company", path: `/company/${TICKER_MAP[c] ?? c.toUpperCase()}` })) },
  { group:"Actions",    items:[ { label:"Toggle theme", sub:"Shortcut", action:"theme" }, { label:"Upgrade to Pro", sub:"Account", path:"/upgrade" } ]},
];
