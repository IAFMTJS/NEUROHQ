function W(week_intent, kWhy, kMicro, mWhy, mMicro) {
  return {
    week_intent,
    kern: { why_it_matters: kWhy, micro_actions: kMicro },
    micro: { why_it_matters: mWhy, micro_actions: mMicro },
  };
}

export const EDITORIAL_PART2 = {
  "financial-control-literacy": [
    W(
      "Week 1: volledig overzicht — vaste lasten en inkomsten op één blad.",
      "Rust komt van zicht, niet van optimaliseren voordat je weet wat er binnenkomt en uitgaat.",
      [
        "Verzamel alle vaste lasten (huur, verzekeringen, abonnementen)",
        "Noteer netto inkomsten per maand",
        "Tel saldo: kom je rond? Waar is de grootste post?",
      ],
      "Eerste reflectie: waar kriebelt onzekerheid — cijfers of gedrag?",
      [
        "Welk getal verraste je?",
        "Welke post wil je volgende week verifiëren?",
        "Eén zin: wat is je grootste zorg nu?",
      ],
    ),
    W(
      "Week 2: weekritme — 20 min transacties taggen zodat patronen zichtbaar worden.",
      "Zonder tagging blijft geld een zwarte doos; kleine wekelijkse discipline wint.",
      [
        "Kies vaste dag + tijd (bijv. zondag 10:00)",
        "Tag 2 weken terug (eten, transport, hobby)",
        "Stop op timer — geen perfectionisme",
      ],
      "Reflectie: waar gaat ongemerkt geld heen?",
      [
        "Top 3 categorieën qua volume",
        "Eén categorie om volgende week te beperken (experiment)",
      ],
    ),
    W(
      "Week 3: één hefboom — besparing of bewuste schuldstap (klein, concreet).",
      "Eén goede hefboom verslaat tien goede voornemens.",
      [
        "Kies hefboom: opzeggen, heronderhandelen, automatische overschrijving",
        "Voer uit binnen 7 dagen (bellen/mail telt)",
        "Documenteer besparing of afspraak in je notities",
      ],
      "Check: deed je het echt of alleen gepland?",
      [
        "Wat was het grootste obstakel (angst, tijd)?",
        "Volgende hefboom of pauze?",
      ],
    ),
    W(
      "Week 4: bufferdoel — concrete X euro tegen datum, met tussenstap.",
      "Buffers verlagen cortisol; vage ‘sparen’ werkt niet.",
      [
        "Kies bufferbedrag en deadline (realistisch)",
        "Automatiseer wekelijks bedrag of zichtbare pot",
        "Schrijf ‘niet aanraken tenzij …’ regel",
      ],
      "Commitment en angst benoemen.",
      [
        "Wat is het eerste teken dat je het doel moet bijstellen?",
        "Wie weet van je doel (optioneel)?",
      ],
    ),
  ],
  "deep-work-focus-mastery": [
    W(
      "Week 1: twee diepe blokken — 50 min, één taak per blok, geen context switch.",
      "Diepte is trainbaar; 50 min is de minimale unit voor echte progressie.",
      [
        "Plan 2× 50 min op je scherpste uren",
        "Voor elk blok: output-definitie (wat is klaar?)",
        "Telefoon weg; geen inbox tussen door",
      ],
      "Reflectie: waar brak diepte (energie, onduidelijkheid, angst)?",
      [
        "Self-rating diepte 1–10 per blok",
        "Eén concrete tweak voor week 2",
      ],
    ),
    W(
      "Week 2: meet diepte — zelfscore na elke sessie, zoek het patroon.",
      "Wat je meet, kun je verhogen; gevoel alleen misleidt.",
      [
        "Zelfde blokstructuur als week 1",
        "Direct na sessie: score 1–10 + 1 woord (bijv. ‘wollig’, ‘scherp’)",
        "Noteer slaap en cafeïne grofweg",
      ],
      "Correlaties: wanneer score het hoogst?",
      [
        "Beste dagdeel en duur voor jou?",
        "Pas 1 variabele volgende week bewust aan",
      ],
    ),
    W(
      "Week 3: elimineer grootste context switch één week lang.",
      "Context switches zijn de #1 diepte-moordenaar.",
      [
        "Identificeer #1 switch (mail, Slack, collega, multitask)",
        "Kies regel: batches, DND, deur dicht",
        "Volhouden 5 werkdagen",
      ],
      "Eerlijke evaluatie: werkte de regel in jouw context?",
      [
        "Wat was de workaround die je zelf maakte?",
        "Blijft de regel, of versie 2?",
      ],
    ),
    W(
      "Week 4: diepte-budget voor volgende maand — uren per week op voorhand.",
      "Diepte zonder budget verdrinkt in meetings.",
      [
        "Tel beschikbare uren per week (realistisch)",
        "Reserveer 40–60% voor diepte in agenda",
        "Blokkeer; communiceer waar nodig",
      ],
      "Plan vs. wens: waar moet je ‘nee’ zeggen?",
      [
        "Eerste week na dit plan: wat schuift?",
        "Reviewmoment gezet?",
      ],
    ),
  ],
  "communication-clarity-control": [
    W(
      "Week 1: drie gesprekken — vooraf doel in één zin, daarna evalueren.",
      "Helderheid begint bij intentie, niet bij woorden schuiven.",
      [
        "Voor elk gesprek: schrijf doel + gewenst resultaat",
        "Open met doel of vraag binnen 60 sec",
        "Sluit af met samenvatting en volgende stap",
      ],
      "Reflectie: waar werd het wollig?",
      [
        "Welk gesprek had het minst heldere doel van tevoren?",
        "Eén formulering die je hergebruikt",
      ],
    ),
    W(
      "Week 2: oefen ‘nee’ in max. 10 woorden — vriendelijk en kort.",
      "Lange nee’s klinken als excuus en nodigen uit tot onderhandeling.",
      [
        "Schrijf 3 varianten van je standaard-nee",
        "Gebruik ze minstens 2× deze week",
        "Geen over-uitleg tenzij gevraagd",
      ],
      "Hoe voelde kort nee in je lichaam?",
      [
        "Waar ging je alsnog uitleggen?",
        "Welke variant voelde het meest ‘van jou’?",
      ],
    ),
    W(
      "Week 3: moeilijk mailtje — concept, pauze 1 uur, dan verzenden.",
      "Angst-mailtjes rotten in concepten; tijd + herlezen verlaagt risico.",
      [
        "Schrijf concept in 10 min",
        "Weg van scherm 1 uur",
        "Herlees: toon + feiten; verzend of plan verzendtijd",
      ],
      "Debrief: wat was het echte risico?",
      [
        "Kwam de angst uit feiten of uit imaginaire scene?",
        "Wat leer je voor volgende moeilijke mail?",
      ],
    ),
    W(
      "Week 4: één constructief feedbackgesprek met kort script (SBI of vergelijkbaar).",
      "Feedback faalt door willekeur; structuur houdt veiligheid.",
      [
        "Kies situatie + gedrag + impact (3 zinnen)",
        "Oefen hardop 2×",
        "Plan gesprek + buffer na",
      ],
      "Reflectie: werd boodschap gehoord?",
      [
        "Wat ging goed in je levering?",
        "Wat zou je herformuleren?",
      ],
    ),
  ],
  "critical-thinking-reasoning": [
    W(
      "Week 1: drie claims — bron + zekerheidsscore 1–5.",
      "Je traint om onzekerheid te zien i.p.v. alles gelijkwaardig te geloven.",
      [
        "Kies claims uit nieuws, werk of social",
        "Per claim: primaire bron of ‘geen bron’",
        "Score zekerheid en noteer waarom die score",
      ],
      "Patroon: waar neem je dingen te zeker aan?",
      [
        "Welke claim had de grootste gap bron ↔ zekerheid?",
      ],
    ),
    W(
      "Week 2: steel-man — sterkste tegenargument op één pagina.",
      "Als je het sterkste tegenargument niet kunt, begrijp je je eigen positie niet.",
      [
        "Kies een standpunt dat je verdedigt",
        "Schrijf 10–15 regels beste tegenargument",
        "Eindig met: wat blijft overeind van jouw punt?",
      ],
      "Intellectuele eerlijkheid: wat moest je toegeven?",
      [
        "Welk deel van je argument was zwakst?",
      ],
    ),
    W(
      "Week 3: beslis met expliciete onzekerheid — interval of scenario’s.",
      "Goede besluiten omvatten vaak ‘tussen X en Y’.",
      [
        "Kies 1 besluit met onbekende parameters",
        "Noteer interval (bijv. kosten, tijd, impact)",
        "Kies actie + voorwaarde om te herzien",
      ],
      "Werkt interval-denken voor jou of maakt het angst?",
      [
        "Wanneer kies je te smal (vals zekerheid)?",
      ],
    ),
    W(
      "Week 4: checklist voor volgende grote beslissing — herbruikbaar.",
      "Checklists voorkomen dat je elke keer opnieuw vergeet wat belangrijk is.",
      [
        "Combineer inzichten uit weken 1–3 in 5–7 bullets",
        "Test op een kleine beslissing",
        "Bewaar waar je hem terugvindt",
      ],
      "Commitment: wanneer gebruik je deze checklist verplicht?",
      [
        "Drempelbedrag of impact die ‘groot’ betekent voor jou",
      ],
    ),
  ],
  "memory-recall-mastery": [
    W(
      "Week 1: kies één domein; 20 kaarten/dag actieve recall.",
      "Geheugen verbetert door retrieval, niet door herlezen.",
      [
        "Kies tool (papier, app) en domein",
        "Maak of importeer set; 20 reviews/dag",
        "Einde dag: tijd + moeite scoren",
      ],
      "Reflectie: waar ging fout → herkenning i.p.v. recall?",
      [
        "Welke kaarten faalden het meest?",
      ],
    ),
    W(
      "Week 2: log leercurve — fouten per sessie bijhouden.",
      "Data toont of je te snel gaat of te saai blijft.",
      [
        "Na elke sessie: aantal fouten + totaal kaarten",
        "Plot grof weektrend (omhoog/omlaag)",
        "Pas interval of moeilijkheid licht aan",
      ],
      "Wat zegt de trend — volume of focus probleem?",
      [
        "Eén aanpassing voor week 3",
      ],
    ),
    W(
      "Week 3: verhoog moeilijkheid óf volume licht — niet beide.",
      "Progressive overload geldt ook voor cognitie.",
      [
        "Kies +10% kaarten óf moeilijkere subset",
        "Houd sessieduur ongeveer gelijk",
        "Stop bij >40% fout (te zwaar)",
      ],
      "Was de verhoging productief of demotiverend?",
      [
        "Blijf je op dit niveau of terug?",
      ],
    ),
    W(
      "Week 4: toets zonder materiaal — 1× per week blind recall.",
      "Echte transfer is produceren, niet herkennen in app.",
      [
        "Kies subset van 15–25 items",
        "Whiteboard of papier; geen peek",
        "Vergelijk met app-scores",
      ],
      "Gap tussen app en blind: waar zit hij?",
      [
        "Plan volgende maand: vaker blind of andere kaartvorm?",
      ],
    ),
  ],
  "cooking-kitchen-mastery": [
    W(
      "Week 1: keukenbasis — setup en messen (slijpen/check).",
      "Slechte tools = langzamer + onveiliger + minder plezier.",
      [
        "Ruim werkblad; essentials binnen handbereik",
        "Check/slijp messen of plan reparatie",
        "Foto ‘voor’ en ‘na’ setup",
      ],
      "Reflectie: waar verloor je tijd in de keuken?",
      [
        "Eén upgrade of gewoonte voor week 2",
      ],
    ),
    W(
      "Week 2: twee nieuwe recepten — timer per stap.",
      "Timing leert je waar recept en realiteit divergeren.",
      [
        "Kies recepten met heldere stappen",
        "Timer per stap; noteer afwijking",
        "Maak mise vooraf waar mogelijk",
      ],
      "Welk recept past bij jouw week — snel vs. slow?",
      [
        "Eén recept bewaren in ‘rotation’",
      ],
    ),
    W(
      "Week 3: batch — één ingrediënt voor drie maaltijden.",
      "Batching verlaagt weekstress en voedselverspilling.",
      [
        "Kies ingrediënt (rijst, bonen, groente)",
        "Kook/portioneer voor 3 gebruiksmomenten",
        "Label data in koelkast/vriezer",
      ],
      "Werkte planning of at je toch anders?",
      [
        "Aanpassing batchgrootte of receptkeuze",
      ],
    ),
    W(
      "Week 4: signature-schaal — eigen gerecht onder 30 min betrouwbaar.",
      "Mastery = herhaalbaar zonder chaos.",
      [
        "Kies gerecht dat je lekker vindt",
        "Timeer tot onder 30 min met routine",
        "Schrijf je definitieve stappenlijst",
      ],
      "Trots en volgende uitbreiding.",
      [
        "Voor wie kook je dit eerst op repeat?",
      ],
    ),
  ],
  "sleep-recovery-optimization": [
    W(
      "Week 1: vast opstaan + 7 dagen slaaplog (kwaliteit 1–5).",
      "Ritme en subjectieve kwaliteit zijn de snelste hefbomen vóór gadgets.",
      [
        "Kies vast opstaantijd (±30 min venster)",
        "Elke ochtend: score 1–5 + 1 woord (rustig/fragmented/etc.)",
        "Noteer cafeïne na 14:00 ja/nee",
      ],
      "Wat correleert met slechte scores bij jou?",
      [
        "Eén hypothese voor week 2",
      ],
    ),
    W(
      "Week 2: scherm na 21:00 beperken 5 nachten.",
      "Licht en prikkels vertragen downshift voor veel mensen.",
      [
        "Kies vervanging (boek, stretch, douche)",
        "Telefoon buiten slaapkamer of grijs scherm",
        "Log scores naast week 1",
      ],
      "Werkte het subjectief en in log?",
      [
        "Blijft regel, wordt zachter, of andere tijd?",
      ],
    ),
    W(
      "Week 3: ochtendlicht 10 min binnen 30 min na wakker.",
      "Licht ankert circadiaans ritme.",
      [
        "Binnen 30 min naar buiten of helder raam",
        "Combineer met koffie routine of wandeling",
        "Log alertheid middag 1–5",
      ],
      "Verschil met week 1–2?",
      [
        "Houd je dit vast na het traject?",
      ],
    ),
    W(
      "Week 4: kies één aanpassing voor 30 dagen — de winnaar uit eerdere weken.",
      "Te veel wijzigingen tegelijk maakt data onleesbaar.",
      [
        "Kies 1 interventie op basis van logs",
        "Schrijf succescriterium (bijv. 5×/week ≥4 score)",
        "Reviewdatum in agenda",
      ],
      "Commitment en compassion.",
      [
        "Wat doe je bij 3 slechte nachten op rij (plan B)?",
      ],
    ),
  ],
  "body-language-nonverbal": [
    W(
      "Week 1: video 2 min — openingshouding + eerste zin.",
      "Je ziet wat anderen zien voordat je het voelt.",
      [
        "Neem 2 min clip (presentatie of update)",
        "Bekijk zonder geluid eerst: schouders, kin, ogen",
        "Kies 1 aanpassing voor volgende take",
      ],
      "Welk signaal wil je uitstralen volgende week?",
      [
        "Eén zin die je opening wordt",
      ],
    ),
    W(
      "Week 2: licht spiegelen in één gesprek — subtiel.",
      "Spiegelen bouwt rapport; overdrijven breekt vertrouwen.",
      [
        "Kies laag-stakes gesprek",
        "Spiegel tempo en houding lichtjes",
        "Check: voelt het natuurlijk?",
      ],
      "Reflectie: merkte de ander iets — wil je dat?",
      [
        "Wanneer stop je met spiegelen bewust?",
      ],
    ),
    W(
      "Week 3: pauzes na kernzin — 2 sec stilte trainen.",
      "Stilte voegt gewicht toe en voorkomt ratelen.",
      [
        "Kies 3 momenten deze week (werk/privé)",
        "Na kernzin: tel 2 sec in gedachten",
        "Observeer reactie ander",
      ],
      "Waar was stilte oncomfortabel voor jou?",
      [
        "Script voor spanning: adem in, dan verder",
      ],
    ),
    W(
      "Week 4: feedback — vriend of collega op één specifiek punt.",
      "Externe spiegel versnelt correctie.",
      [
        "Vraag: ‘Wat valt op aan mijn houding/stem in meeting X?’",
        "Noteer 1 tip; geen discussie in het moment",
        "Oefen tip 5× bewust",
      ],
      "Wat neem je permanent mee?",
      [
        "Eén gewoonte die je weekelijks checkt",
      ],
    ),
  ],
  "mobility-movement-control": [
    W(
      "Week 1: screening — nek, schouder, heup: waar zit strakheid?",
      "Gerichte mobiliteit begint bij kaart, niet bij willekeurige stretches.",
      [
        "Langzaam beweeg elk gebied; noteer pijn vs. rek",
        "Foto houding werkplek optioneel",
        "Kies 1 prioriteitsgebied",
      ],
      "Reflectie: lijkt het belasting of blessure-rand?",
      [
        "Zo ja bij twijfel: professional — noteer voor wie",
      ],
    ),
    W(
      "Week 2: 10 min routine 5 dagen — video of vaste volgorde.",
      "Consistentie wint van perfecte oefening eenmalig.",
      [
        "Kies video of 4 oefeningen op briefje",
        "Zelfde tijdstip",
        "Timer 10 min harde stop",
      ],
      "Wat werd makkelijker aan het eind van de week?",
      [
        "Behoud, uitbreiden of vereenvoudigen?",
      ],
    ),
    W(
      "Week 3: loop + adem — 20 min 3× deze week.",
      "Cardio licht verbetert doorbloeding en mood — mobiliteit is niet alleen static stretch.",
      [
        "Rustig tempo; neusadem als het kan",
        "Noteer humeur 1–5 voor/na",
      ],
      "Combinatie met week 2: merk je verschil?",
      [
        "Houd je walks vast na traject?",
      ],
    ),
    W(
      "Week 4: progressie — +1 oefening of +2 min volgende maand.",
      "Zonder progressie plafonneer je; met te veel riskeer je quit.",
      [
        "Kies kleine progressie",
        "Zet in agenda 3×/week",
        "Evalueer pijn/discomfort grens",
      ],
      "Plan veiligheid en volhoudbaarheid.",
      [
        "Stop-criteria (welk gevoel = stop)",
      ],
    ),
  ],
  "identity-self-mastery": [
    W(
      "Week 1: drie waarden + één concreet gedrag per waarde.",
      "Identiteit zonder gedrag is een poster.",
      [
        "Kies waarden die je al leeft, niet ideaal-ik",
        "Per waarde: 1 gedrag dat anderen zien",
        "Schrijf op kaartje op werkplek",
      ],
      "Welke waarde voelt het kwetsbaarst om te claimen?",
      [
        "Waarom — imposter of echte mismatch?",
      ],
    ),
    W(
      "Week 2: dagelijks bewijslog — één zin ‘bewijs van waarde’.",
      "Je hersenen geloven wat je documenteert.",
      [
        "Elke avond voor 2 min",
        "Formaat: vandaag leefde ik X door Y",
        "Geen oordeel op gemiste dagen",
      ],
      "Patroon na 7 dagen: welke waarde het minst zichtbaar?",
      [
        "Micro-actie om die te voeden week 3",
      ],
    ),
    W(
      "Week 3: obstakel — waar gedrag niet matcht met wie je wilt zijn.",
      "Cognitieve dissonantie is data, geen falen.",
      [
        "Kies 1 moment van deze maand",
        "Analyse: wat wilde je vermijden?",
        "Ontwerp if-then plan",
      ],
      "Empathie voor jezelf + duidelijke tweak.",
      [
        "Wie kan je helpen herinneren?",
      ],
    ),
    W(
      "Week 4: commitment — publiek, partner of journal (kies één).",
      "Social contract verhoogt follow-through als het authentiek is.",
      [
        "Formuleer commitment in 2 zinnen",
        "Deel met gekozen kanaal",
        "Plan check-in over 14 dagen",
      ],
      "Reflectie: wat maakt je trots op deze 4 weken?",
      [
        "Eén zin die je herleest bij twijfel",
      ],
    ),
  ],
  "leadership-team-execution": [
    W(
      "Week 1: 1-op-1 — doel, deadline, definitie van ‘klaar’.",
      "Ambigue verwachtingen zijn de #1 executie-killer.",
      [
        "Voorbereid 3 punten op briefje",
        "Eindig met schriftelijke samenvatting (mail/chat)",
        "Vraag expliciet: ‘Wat is onduidelijk?’",
      ],
      "Reflectie: waar ging het nog mis in helderheid?",
      [
        "Eén templatezin voor volgende 1-op-1",
      ],
    ),
    W(
      "Week 2: board of lijst — wie wacht op wie; één bottleneck weg.",
      "Execution = flow; bottlenecks zichtbaar maken.",
      [
        "Teken simpele flow of tabel",
        "Identificeer #1 wachtrij",
        "Actie binnen 48 uur om wachtrij te breken",
      ],
      "Werkte actie of verschoof bottleneck?",
      [
        "Volgende bottleneck of procesfix?",
      ],
    ),
    W(
      "Week 3: feedback situatie–gedrag–impact één keer.",
      "SBI vermindert defensiviteit en verhoogt gedragsverandering.",
      [
        "Schrijf script vooraf",
        "Lever binnen 48 uur na observatie",
        "Eindig met vraag: wat heb jij nodig?",
      ],
      "Reflectie: werd boodschap begrepen?",
      [
        "Wat zou je herformuleren?",
      ],
    ),
    W(
      "Week 4: team sync korter en scherper — agenda + uitkomst.",
      "Lange meetings maskeren gebrek aan voorbereiding.",
      [
        "Verkort bestaande sync met 10–15 min",
        "Vooraf 3 bullets gedeeld",
        "Eind met acties + eigenaren",
      ],
      "Teamfeedback (informeel) op het nieuwe format.",
      [
        "Blijft, of iteratie?",
      ],
    ),
  ],
  "stress-regulation-baseline": [
    W(
      "Week 1: stresslog — pieken + context 7 dagen.",
      "Je ziet load-patronen; zonder log blijft stress ‘alles en niets’.",
      [
        "3× per dag 30 sec: niveau 1–5 + context (werk, relatie, lichaam)",
        "Noteer slaap en cafeïne grof",
        "Geen oordeel — alleen data",
      ],
      "Eerste hypothese: wat voedt pieken het meest?",
      [
        "Eén context om week 2 te beïnvloeden",
      ],
    ),
    W(
      "Week 2: dagelijkse downshift 5 min vóór lunch.",
      "Zenuwstelsel heeft micro-recovery om niet op laag pitje te crashen.",
      [
        "Timer vóór lunch: adem, wandeling of stilte",
        "Geen scherm in die 5 min",
        "Log stress middag 1–5",
      ],
      "Verschil t.o.v. week 1 middag?",
      [
        "Blijft ritueel, andere tijd, of andere duur?",
      ],
    ),
    W(
      "Week 3: één commitment minder — expliciet nee of uitstel.",
      "Load management is regulatie.",
      [
        "Kies 1 taak/afspraak om te schrappen of te verplaatsen",
        "Communiceer helder naar betrokkenen",
        "Geen schuldgevoel — noteer gewonnen uren",
      ],
      "Reflectie: wat weerhield je normaal van nee?",
      [
        "Welke zin gebruik je volgende keer?",
      ],
    ),
    W(
      "Week 4: plan — signalen die ‘stop’ betekenen voor jou.",
      "Preventie is ook weten wanneer je remt vóór crash.",
      [
        "Lijst 3 lichamelijke + 3 gedachte-signalen",
        "Koppel elk signaal aan 1 actie (pauze, hulp, slaap)",
        "Deel met iemand als dat helpt",
      ],
      "Commitment aan jezelf.",
      [
        "Review over 30 dagen in agenda",
      ],
    ),
  ],
};
