/** @typedef {{ week_intent: string, kern: { why_it_matters: string, micro_actions: string[] }, micro: { why_it_matters: string, micro_actions: string[] } }} WeekEd */

function W(week_intent, kWhy, kMicro, mWhy, mMicro) {
  return {
    week_intent,
    kern: { why_it_matters: kWhy, micro_actions: kMicro },
    micro: { why_it_matters: mWhy, micro_actions: mMicro },
  };
}

/** @type {Record<string, WeekEd[]>} */
export const EDITORIAL_PART1 = {
  "behavioral-intelligence-system": [
    W(
      "Week 1: leg een neutrale baseline — je noteert alleen wat terugkomt, nog zonder oordeel of plan.",
      "Gedrag verandert pas als je ziet wat er echt gebeurt; deze sessie voorkomt dat je op gevoel stuurt.",
      [
        "Kies 3 vaste momenten (ochtend/middag/avond) om 2 min te noteren",
        "Schrijf per moment: situatie → wat je deed → korte lichaamssignalen",
        "Eindig met één zin: welk patroon zie je al schemeren?",
      ],
      "Reflectie maakt van losse notities een patroon; zonder dit blijft het lawaai.",
      [
        "Lees je notities van de week in 4 minuten",
        "Markeer wat minstens 2× voorkwam",
        "Kies nog geen oplossing — noteer alleen ‘dit valt op’",
      ],
    ),
    W(
      "Week 2: kies één concreet patroon en test één micro-interventie meerdere dagen.",
      "Kleine ingrepen zijn meetbaar; grote voornemens breken meestal op dag drie.",
      [
        "Noem het patroon in één zin (trigger → gedrag)",
        "Kies één interventie die binnen 60 seconden past",
        "Plan waar je die vandaag 2× kunt proberen",
      ],
      "Je checkt of je interventie haalbaar is — niet of je ‘sterk genoeg’ bent.",
      [
        "Tel hoe vaak je de interventie echt deed (niet bedoelde)",
        "Noteer 1 moment waar het lukte en 1 waar het niet lukte",
        "Pas de interventie aan tot hij kleiner of duidelijker is",
      ],
    ),
    W(
      "Week 3: meet effect — energie, spanning, uitkomst — zonder jezelf te veroordelen.",
      "Als je niet meet, blijf je gokken of iets ‘werkt’; cijfers of labels geven sturing.",
      [
        "Kies 2 signalen (bijv. rust 1–5, irritatie 1–5)",
        "Score vóór en ná 3 interventie-momenten deze week",
        "Vergelijk met week 1 — wat verschuift er?",
      ],
      "Korte terugblik voorkomt dat je opnieuw willekeurig iets anders probeert.",
      [
        "Vat de cijfers samen in max. 3 bullets",
        "Noteer: ‘dit helpt’ vs. ‘dit maakt het erger’",
        "Beslis of je doorgaat, aanpast of stopt met deze interventie",
      ],
    ),
    W(
      "Week 4: vertaal inzicht naar agenda — één gewoonte met tijd en plek.",
      "Gedrag verandert door context, niet door motivatie; vastleggen = commitment.",
      [
        "Kies 1 gewoonte uit je data (niet je wens)",
        "Zet 3 vaste slots in agenda of reminders",
        "Schrijf ‘als X dan Y’ in één regel",
      ],
      "Je sluit de cyclus af met een haalbare volgende stap, geen groot manifest.",
      [
        "Check: zijn de slots realistisch met je echte week?",
        "Noteer 1 risico en 1 backup (als ik skip, dan …)",
        "Eén zin: wat review je over 14 dagen?",
      ],
    ),
  ],
  "gardening-development-system": [
    W(
      "Week 1: maak je plek en zorgbasis helder — licht, water, vaste check.",
      "Planten falen meestal door inconsistente basics, niet door gebrek aan enthousiasme.",
      [
        "Loop je plek af met notitieblok: lichturen, tocht, waterbron",
        "Kies één vast moment per dag (of om de dag) voor 5 min check",
        "Foto vóór — die gebruik je volgende week opnieuw",
      ],
      "Je reflectie koppelt observatie aan volgende actie (meer/minder water, verplaatsen, etc.).",
      [
        "Noteer wat je planten vandaag deden (kreuk, geel, droog)",
        "1 hypothese: te veel / te weinig / verkeerde plek",
        "Geen koopimpuls — alleen bijstuur op wat je al hebt",
      ],
    ),
    W(
      "Week 2: ritme bouwen — water en inspectie op vaste dagen.",
      "Seizoenstaken vragen herhaling; willekeurige zorg geeft stress bij plant en bij jou.",
      [
        "Maak een mini-schema (4 dagen) op papier of in je HQ-taak",
        "Per dag: water? bladeren? onkruid? kies max. 2 acties",
        "Timer 10 min — stop als de timer stopt",
      ],
      "Je evalueert of het schema vol te houden is vóór je uitbreidt.",
      [
        "Welke dag werkte het wel / niet qua energie?",
        "Pas 1 dag of 1 taak aan (kleiner maken)",
        "Noteer 1 teken dat een plant blij is",
      ],
    ),
    W(
      "Week 3: één project — snoeien, verpotten of oogst — met duidelijke done-state.",
      "Diepte in één klus leert je meer dan vijf half afgeronde pogingen.",
      [
        "Kies één project; verzamel gereedschap eerst",
        "Werk in blokken van 15 min met pauze",
        "Maak af: opruimen telt mee",
      ],
      "Reflectie helpt je techniek en timing voor volgende keer te verbeteren.",
      [
        "Wat ging technisch goed / mis?",
        "Had je meer tijd of ander materiaal nodig?",
        "Welk klein project volgt logisch hierop?",
      ],
    ),
    W(
      "Week 4: seizoensevaluatie — wat neem je mee, wat laat je los?",
      "Tuinieren is cyclisch; leren vastleggen bespaart volgend jaar fouten.",
      [
        "Loop je foto’s en notities van 4 weken door",
        "Lijst ‘werkt hier’ vs. ‘werkt niet’",
        "Kies 1 experiment voor het volgende seizoen",
      ],
      "Je sluit af met rust: geen schuld, wel een duidelijke volgende cyclus.",
      [
        "Eén zin: wat was het minst stressvolle ritme?",
        "Eén zin: wat wil je volgend jaar anders in week 1?",
        "Beloon jezelf met rust of een kleine upgrade (optioneel)",
      ],
    ),
  ],
  "focus-rebuild-system": [
    W(
      "Week 1: herwin korte blokken — telefoon weg, timer aan, herhaalbaar ritme.",
      "Na afleiding of uitputting is volume minder belangrijk dan betrouwbare herhaling.",
      [
        "3× 20 min: vooraf schrijven welke ene taak telt",
        "Telefoon buiten kamer of in doos",
        "Na elk blok 2 min bewegen zonder scherm",
      ],
      "Je ziet welk blok het hardst was — daar zit je volgende hefboom.",
      [
        "Score elk blok 1–5 (haalbaarheid, geen schuld)",
        "Noteer de grootste afleider per dag",
        "Kies 1 micro-aanpassing voor volgende week",
      ],
    ),
    W(
      "Week 2: verleng één blok per dag met 10 min — alleen als week 1 stabiel voelt.",
      "Progressie in focus is stapsgewijs; te snel groter = terugval.",
      [
        "Kies hetzelfde dagdeel als vorige week",
        "Verleng alleen het sterkste blok met +10 min",
        "Als het breekt: terug naar 20 min zonder drama",
      ],
      "Reflectie bewaakt dat je niet ‘heldhaftig’ wordt i.p.v. consistent.",
      [
        "Waar voelde +10 min als winst, waar als stress?",
        "Blijf je morgen bij deze lengte of niet?",
        "Noteer 1 omgevingstweak (licht, geluid, stoel)",
      ],
    ),
    W(
      "Week 3: audit — top 3 afleiders en één concrete fix voor 7 dagen.",
      "Je kunt niet alles elimineren; één fix die blijft is genoeg.",
      [
        "Lijst afleiders: digitaal, sociaal, fysiek",
        "Kies de #1 met hoogste impact",
        "Implementeer één regel (app, deur dicht, koptelefoon)",
      ],
      "Je checkt of de fix echt gebruikt werd, niet alleen geïnstalleerd.",
      [
        "Hoeveel dagen hield je de regel vol?",
        "Wat was de vervang-afleider (bijv. nieuws i.p.v. social)?",
        "Blijft, wijzigt of vervang je de regel?",
      ],
    ),
    W(
      "Week 4: lock-in — template voor 4 weken (blokken, resets, review).",
      "Focus is een systeem; zonder template glijd je terug naar reactieve modus.",
      [
        "Schrijf je ideale week op 1 pagina (max. 5 regels)",
        "Koppel blokken aan vaste starttijden",
        "Plan wekelijkse 10 min review in agenda",
      ],
      "Laatste reflectie: commitment vs. wensdenken.",
      [
        "Is dit template eerlijk met je energie en werk?",
        "Wie of wat moet ‘nee’ horen om dit te beschermen?",
        "Datum gezet voor eerste review na 4 weken",
      ],
    ),
  ],
  "speed-reading-comprehension": [
    W(
      "Week 1: meet waar je nu staat — tempo én begrip, anders train je blind.",
      "Zonder baseline optimaliseer je voor snelheid en verlies je inhoud.",
      [
        "Kies 1 teksttype dat je echt gebruikt (werk/studie)",
        "Timeer 5 min lezen; noteer woorden/min ruw",
        "Beantwoord 3 begripsvragen zonder tekst te herlezen",
      ],
      "Reflectie scheidt ‘snel’ van ‘snap ik het’ — dat is je kompas.",
      [
        "Waar ging begrip mis: woorden, zinnen, structuur?",
        "Welke vraagtype is het lastigst?",
        "Eén doel voor week 2 in één zin",
      ],
    ),
    W(
      "Week 2: techniekweek — pointer of chunking, dagelijks kort.",
      "Techniek moet automatisch worden; lange sporadische sessies helpen minder.",
      [
        "Kies pointer óf chunking (niet beide tegelijk)",
        "20 min/dag dezelfde oefening",
        "Einde sessie: 1 zin wat anders voelde aan je oog/adem",
      ],
      "Je beoordeelt of de techniek haalbaar is in echte documenten.",
      [
        "Werkt dit in PDF/mail of alleen op papier?",
        "Waar werd het geforceerd?",
        "Behoud, tweak of wissel van techniek",
      ],
    ),
    W(
      "Week 3: integratie — lange tekst, output in 5 bullets.",
      "Lezen is pas nuttig als je kunt destilleren onder lichte druk.",
      [
        "Kies tekst van 15–25 min lezen",
        "Lees één keer door met week-2-techniek",
        "Schrijf 5 bullets: kern, nuance, actie",
      ],
      "Je ziet waar je nog ‘scant’ i.p.v. begrijpt.",
      [
        "Welke bullet was het zwakst — waarom?",
        "Wat zou je anders lezen (koppen eerst, einde eerst)?",
        "Eén aanpassing voor de toetsweek",
      ],
    ),
    W(
      "Week 4: toets — zelfde type tekst, strakkere tijdslimiet.",
      "Druk simuleert werk; hier meet je echte winst.",
      [
        "Herhaal week-1-meting met vergelijkbaar materiaal",
        "Strakkere timer (10–20% minder tijd)",
        "Zelfde 3 begripsvragen + moeilijkheidsgevoel 1–5",
      ],
      "Objectieve vergelijking week 1 vs. 4 — geen moraliseren.",
      [
        "Cijfers naast elkaar: tempo, begrip, stress",
        "Wat blijft je standaard oefening?",
        "Wat laat je los (techniek of doel)?",
      ],
    ),
  ],
  "decision-making-judgment": [
    W(
      "Week 1: beslislog — kort vastleggen wat je koos en wat er gebeurde.",
      "Je hersenen herschrijven geschiedenis; log = objectieve trainer.",
      [
        "3 dagen: 1 besluit per dag (ook klein)",
        "Formaat: opties → keuze → verwachting (1 regel)",
        "Later die dag: uitkomst in 1 regel",
      ],
      "Patronen in bias worden zichtbaar (uitstel, FOMO, perfectionisme).",
      [
        "Waar zat je onzekerheid het langst?",
        "Welke keuze voelde goed maar ging slecht (of omgekeerd)?",
        "Eén inzicht voor framework-week",
      ],
    ),
    W(
      "Week 2: pas één framework toe (ICE of reversible) op 2 echte keuzes.",
      "Frameworks vertragen rumination en maken trade-offs expliciet.",
      [
        "Schrijf het framework uit op papier (3–5 stappen)",
        "Keuze A: volledig doorlopen",
        "Keuze B: zelfde framework, vergelijk scores",
      ],
      "Je test of het framework je rust gaf of extra ruis.",
      [
        "Waar voelde het kunstmatig?",
        "Welke variabele miste je?",
        "Pas het framework aan tot het ‘van jou’ voelt",
      ],
    ),
    W(
      "Week 3: scenario — worst/best case in 15 min, zonder eindeloos uitwaaieren.",
      "Angstbeslissingen worden kleiner als je bandbreedte ziet.",
      [
        "Kies 1 besluit dat je uitstelt",
        "10 min worst case + 5 min best case",
        "Eind met: ‘als dit gebeurt, dan is mijn eerste stap …’",
      ],
      "Je checkt of scenario’s realistisch waren of catastroferend.",
      [
        "Welk deel was overdreven?",
        "Welke buffer of optie miste je?",
        "Nieuwe deadline of keuze gezet?",
      ],
    ),
    W(
      "Week 4: review — welk criterium leg je voortaan eerst?",
      "Snelheid, veiligheid, groei, relatie — je kunt niet alles tegelijk maxen.",
      [
        "Lees je logs van 3 weken",
        "Omcirkel 2 terugkerende waarden",
        "Kies 1 primair criterium voor de komende 30 dagen",
      ],
      "Commitment in één zin voorkomt eindeloos herkauwen.",
      [
        "Wat offer je bewust op als je dit criterium kiest?",
        "Wie moet dit weten (partner, team)?",
        "Reviewdatum in agenda",
      ],
    ),
  ],
  "persuasion-influence": [
    W(
      "Week 1: observeer zonder te oefenen — toon en framing in 2 gesprekken.",
      "Je kalibreert je oor voordat je technieken plakt.",
      [
        "Kies 2 gesprekken (werk/privé) waar je luistert > spreekt",
        "Noteer: openingszin, tempo, samenvatting door de ander?",
        "Wat voelde veilig vs. afgesloten?",
      ],
      "Reflectie vertaalt observatie naar jouw stijl, niet naar ‘trucjes’.",
      [
        "Welke toon wil jij vaker?",
        "Waar werd jij defensief — trigger?",
        "Eén micro-doel voor week 2",
      ],
    ),
    W(
      "Week 2: oefen samenvatten vóór je eigen punt legt.",
      "Mensen accepteren invloed als ze gehoord voelen.",
      [
        "Kies 3 korte gesprekken",
        "Start met: ‘Als ik het goed hoor …’ + 1 zin",
        "Pas daarna je vraag of standpunt",
      ],
      "Je meet of je samenvatting klopte (corrigeren is oké).",
      [
        "Waar was je ongeduldig?",
        "Welke formulering werkte het best?",
        "Pas je script aan in 2 regels op papier",
      ],
    ),
    W(
      "Week 3: moeilijk gesprek met vooraf schriftelijk doel en grens.",
      "Ethische invloed = duidelijkheid over intentie en uitkomst.",
      [
        "Schrijf doel + niet-onderhandelbare grens",
        "Oefen de openings-60-seconden hardop",
        "Plan buffer na het gesprek (geen direct volgende meeting)",
      ],
      "Debrief zonder oordeel: gedrag, niet identiteit.",
      [
        "Werd het doel gehaald? Zo nee, waarom?",
        "Wat zou je herhalen / anders doen?",
      ],
    ),
    W(
      "Week 4: reflectie op je defaults — te defensief of te soft.",
      "Zelfkennis voorkomt dat je rollen door elkaar haalt.",
      [
        "Noteer 3 momenten van deze maand",
        "Label elk: defensief / soft / helder",
        "Kies 1 default om bewust te trainen",
      ],
      "Plan voor volgende maand met concrete trigger.",
      [
        "Welke zin gebruik je bij spanning?",
        "Wie vraag je om feedback op 1 gesprek?",
      ],
    ),
  ],
  "emotional-control-regulation": [
    W(
      "Week 1: signaalkaart — lichaam en gedachte bij stress, zonder fix nog.",
      "Regulatie begint bij herkenning vóór de piek.",
      [
        "3× per dag 30 sec: waar zit spanning (kaak, borst, buik)?",
        "Noteer 1 automatische gedachte die meekomt",
        "Geen oplossing — alleen label (bijv. ‘catastrofe’, ‘schuld’)",
      ],
      "Je ziet patronen in triggers — dat is je trainingsdata.",
      [
        "Welke context komt het meest voor?",
        "Welk lichaamsdeel is je vroegste alarm?",
        "Eén woord dat je signaal samenvat",
      ],
    ),
    W(
      "Week 2: 2 min adem vóór moeilijke momenten, 5 dagen lang.",
      "Korte downshift verlaagt amplitude; consistentie > perfecte techniek.",
      [
        "Koppel adem aan bestaande trigger (deur, meeting-start)",
        "In-4, uit-6 of box adem — kies één",
        "Timer 2 min; stop altijd op tijd",
      ],
      "Je evalueert haalbaarheid, niet ‘of het werkte’ in dramatische zin.",
      [
        "Hoeveel van de 5 dagen deed je het echt?",
        "Wat was je smoes #1?",
        "Maak het kleiner (1 min) of koppel aan ander moment",
      ],
    ),
    W(
      "Week 3: na conflict — 10 min debrief zonder telefoon.",
      "Herstel na spike leert je zenuwstelsel dat down is veilig.",
      [
        "Zet telefoon op vliegtuigstand in andere kamer",
        "Schrijf: feiten → wat je zei → wat je voelde",
        "Eén zin: wat je morgen anders probeert",
      ],
      "Je voorkomt ruminatie-spiraal dezelfde avond.",
      [
        "Wanneer kwam je weer tot rust (tijd)?",
        "Wat had je eerder kunnen pauzeren?",
      ],
    ),
    W(
      "Week 4: escalatieplan — wie bel je, wanneer stop je, wat is ‘te ver’.",
      "Regulatie is ook grenzen; alleen ademen is onvoldoende bij chronic stress.",
      [
        "Lijst 2 mensen + voorwaarden wanneer je ze belt",
        "Definieer 3 ‘stop’-signalen voor jezelf",
        "Zet herinnering om plan te reviewen over 30 dagen",
      ],
      "Commitment aan jezelf en anderen — schriftelijk.",
      [
        "Wat maakt je trots aan dit plan?",
        "Wat is het engst — en wie weet dat?",
      ],
    ),
  ],
  "digital-productivity-workflow": [
    W(
      "Week 1: map je digitale landschap — apps, notificaties, inbox-bronnen.",
      "Je kunt niet versimpelen wat je niet ziet.",
      [
        "Lijst alle apps met notificaties aan",
        "Tel inbox-bronnen (mail, chat, tickets)",
        "Markeer top 3 ‘altijd-on’ aandachtvreters",
      ],
      "Reflectie kiest prioriteit: wat kost meeste context switches?",
      [
        "Welke bron is puur gewoonte, geen waarde?",
        "Eén bron om deze week te beperken",
      ],
    ),
    W(
      "Week 2: bescherm één deep-work window per dag — vast startpunt.",
      "Workflow verbetert als er een heilige blok bestaat.",
      [
        "Kies 60–90 min vaste starttijd",
        "Communicatie op ‘niet storen’",
        "Eén taak op scherm — tab-blokken",
      ],
      "Realiteitscheck: hoeveel dagen lukte 80%+ van het blok?",
      [
        "Wat brak het blok het meest?",
        "Aanpassing: korter, later, of andere ruimte?",
      ],
    ),
    W(
      "Week 3: automatisering of template voor één terugkerende klus.",
      "Herhaling vreet tijd; systeem schaalt.",
      [
        "Kies 1 terugkerende taak (rapport, mail, ticket)",
        "Maak template of macro of snippet",
        "Test 3× deze week",
      ],
      "ROI: minuten bespaard vs. setup-tijd.",
      [
        "Werkt het nog steeds na 3 gebruiken?",
        "Wat moet in template v2?",
      ],
    ),
    W(
      "Week 4: review — wat schrap je definitief (app, lijst, gewoonte)?",
      "Minder is vaak sneller dan beter organiseren.",
      [
        "Kies 1 app of bron om te verwijderen of uit te zetten",
        "Communiceer wijziging waar nodig (team)",
        "Plan geen nieuwe tool 30 dagen",
      ],
      "Einde cyclus: rustiger dashboard, meetbaar gevoel.",
      [
        "Wat merk je aan focus of stress?",
        "Wat is je enige nieuwe regel voor komende maand?",
      ],
    ),
  ],
  "discipline-consistency": [
    W(
      "Week 1: kies één niet-onderhandelbare gewoonte — zo klein dat het lachwekkend voelt.",
      "Discipline = betrouwbaarheid op micro-niveau.",
      [
        "Formuleer gewoonte in ‘als-dan’ (als koffie, dan …)",
        "Duur ≤ 5 min of één herkenbare actie",
        "Zet 1 dagelijkse trigger zichtbaar",
      ],
      "Reflectie: was het echt klein genoeg?",
      [
        "Op welke dag faalde de trigger — waarom?",
        "Maak kleiner i.p.v. harder",
      ],
    ),
    W(
      "Week 2: streak 7 dagen — geen nul-dagen, herstel binnen 24 uur telt.",
      "Streak bouwt identiteit; perfectie breekt streaks.",
      [
        "Zelfde gewoonte als week 1",
        "Als je mist: binnen 24 uur alsnog minimale versie",
        "Vink elke avond af in kalender",
      ],
      "Analyse van ‘bijna gemist’ momenten.",
      [
        "Wat was je meest voorkomende valkuil?",
        "Welke omgeving tweak helpt (avond, ochtend)?",
      ],
    ),
    W(
      "Week 3: obstakelanalyse — waar breekt het echt (tijd, schaamte, vermoeidheid)?",
      "Systemen falen op specifieke lekken, niet op ‘gebrek aan wil’.",
      [
        "Lijst 3 momenten waar je wél deed vs. 3 waar niet",
        "Zoek gemeenschappelijke factor (tijd, plek, mensen)",
        "Ontwerp 1 barrière of cue",
      ],
      "Implementatie-evaluatie: werkte de barrière?",
      [
        "Meet 5 dagen: werkte de cue?",
        "Pas aan tot succesratio omhoog gaat",
      ],
    ),
    W(
      "Week 4: 30 dagen — regel + accountability (persoon of publiek).",
      "Externe commit verhoogt follow-through als het passend is.",
      [
        "Schrijf regel + startdatum",
        "Kies accountability (buddy, post, journal check-in)",
        "Plan wekelijkse 5 min review",
      ],
      "Eerlijke verwachting: wat als leven rommelt?",
      [
        "Wat is je herstelprotocol bij 2 gemiste dagen?",
        "Eén zin motivatie die niet afhankelijk is van hype",
      ],
    ),
  ],
};
