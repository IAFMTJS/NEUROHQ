# Ideeën: slimmer, handiger, intuïtiever + agenda & iOS

**Doel**: **iOS/Apple-agenda eerst**; daarnaast Google-sync. En ideeën om de site slimmer, handiger, intuïtiever en gebruiksvriendelijker te maken.

---

## 1. Kalender: iOS/Apple (geïmplementeerd) + Google

### iOS / Apple Kalender (native, prioriteit)

- **Subscribe-URL (iCal-feed)**: Instellingen → "iOS / Apple Kalender" → kopieer de abonnement-URL. Op iPhone: Instellingen → Kalenders → Abonnement toevoegen → plak URL. Events verschijnen en updaten automatisch. API: `GET /api/calendar/feed?token=xxx`.
- **.ics-export**: "Exporteer vandaag" in instellingen → download .ics. API: `GET /api/calendar/export?from=&to=`.
- **Per event "Apple Kalender"**: Bij elk agenda-item: link "Apple Kalender" → download .ics voor dat event. API: `GET /api/calendar/event/[id]/ics`.

### Google (optioneel)

- **sync_to_google**: Bij "in google agenda" bij een afspraak → events naar Google Calendar. Op iPhone zichtbaar als Google is gekoppeld.

### Huidige situatie (Google)

- **sync_to_google**: Als de user "in google agenda" / "sync" zegt bij een afspraak, wordt `sync_to_google: true` meegegeven. De app gebruikt dan `addManualEvent(..., { sync_to_google: true })` en schrijft naar Google Calendar als de user verbonden is.
- **iPhone**: Als de user Google Calendar op de iPhone gebruikt (app of account in Instellingen → Kalenders), verschijnen die events automatisch in de Apple Kalender-app. Geen extra integratie nodig voor “Google → iPhone”.

### Opties voor expliciete iOS/Apple-integratie

| Optie | Wat | Voor/Nadeel |
|-------|-----|-------------|
| **Google Calendar koppelen** (huidig) | User koppelt Google; events gaan naar Google Calendar. Op iPhone: Google-account toevoegen of Google Calendar-app → events zichtbaar. | Pro: al gebouwd. Con: user moet Google willen gebruiken. |
| **.ics / iCal-export** | "Exporteer vandaag" of "Download agenda" → genereren van .ics-bestand (standaard iCalendar). User opent op iPhone → voegt toe aan Apple Kalender. | Pro: geen account nodig; werkt op elke device. Con: handmatig; geen live sync. |
| **Web Cal / subscribe-URL** | Een publieke (of token-gebaseerde) URL die een iCal-feed geeft voor de user. In Apple Kalender: "Abonnement toevoegen" → URL invoeren → events verschijnen en updaten. | Pro: eenmalig instellen, daarna automatisch. Con: beveiliging (token), implementatie (feed endpoint). |
| **CalDAV** | Server als CalDAV-provider; Apple Kalender kan een CalDAV-account toevoegen en syncen. | Pro: native sync op iOS. Con: complex om te bouwen en te hosten. |

**Praktische aanbeveling**: Eerst **Google-sync** goed uitleggen (in app/assistant: "Zeg 'in google agenda' of koppel Google in instellingen; dan zie je events op je iPhone als je Google Kalender gebruikt"). Daarna optioneel: **.ics-export** voor "exporteer vandaag/deze week" en later een **subscribe-URL** (iCal-feed) voor wie geen Google wil.

---

## 2. Site slimmer maken

- **Assistant als centraal startpunt**: Eerste scherm of snelkoppeling "Praat met de assistant" – taak, uitgave, afspraak, vraag in één zin; assistant voert uit of toont suggesties.
- **Slimme defaults**: Bij "Eten maken vanavond" automatisch suggestie agenda + taak; bij "japans leren" suggestie wekelijkse blok + taak (al geïmplementeerd).
- **Context uit eerdere dagen**: "Wat heb ik gisteren uitgesteld?" of "Laat zien wat ik vorige week niet afkreeg" – lijst uit taken/state.
- **Korte samenvatting bij inloggen**: "Vandaag: 3 taken, 2 afspraken, energie 6/10" – één regel op dashboard.
- **Suggesties op basis van patroon**: Bij hoge avoidance + lage energie → zachtere suggesties; bij stabiele week → meer strategische vragen.

---

## 3. Handiger maken

- **Sneltoetsen**: bv. `N` = nieuwe taak, `A` = assistant openen, `Esc` = sluiten. Toon in UI: "N = taak".
- **Quick-add overal**: In nav of header een klein invoerveld: "Taak of bericht…" → enter = taak toevoegen of naar assistant sturen.
- **Bulk-acties**: Selecteer meerdere taken → "Verplaats naar morgen", "Markeer als gedaan", "Verwijder".
- **Terugkerende taken/afspraken**: "Elke maandag Japans" → suggestie of expliciete ondersteuning voor recurrence (tasks/calendar).
- **Template-dagen**: "Vandaag als 'focusdag'" → standaard blokken of taken uit een template toepassen.

---

## 4. Intuïtiever maken

- **Duidelijke feedback**: Na "Taak toegevoegd" of "Afspraak in agenda" kort bevestiging + waar het staat ("Staat op vandaag" / "Staat in je agenda").
- **Eén plek voor "wat nu?"**: Dashboard of assistant: "Volgende stap", "Eén taak nu", "Eén afspraak nu" – geen keuzestress.
- **Voorkeuren onthouden**: Bij "in google agenda" onthouden dat deze user vaker Google wil → standaard sync_to_google aan bij nieuwe afspraken (optioneel).
- **Geen jargon in UI**: "Avoidance", "IAS" alleen waar nodig; in dagelijks gebruik "Uitstel", "Hoe goed past wat je deed bij je focus?".
- **Foutmeldingen in gewone taal**: "Deze taak kon niet worden toegevoegd. Controleer of je nog bent ingelogd." in plaats van technische codes.

---

## 5. Gebruiksvriendelijker maken

- **Eerste keer / onboarding**: Korte tour: "Dit is je dashboard", "Hier praat je met de assistant", "Zo voeg je een taak toe" – max. 3–5 stappen.
- **Empty states**: Geen taken vandaag → "Geen taken vandaag. Zeg tegen de assistant: voeg taak X toe, of typ hieronder."
- **Mobiel**: Grote knoppen, weinig scrollen voor primaire acties; assistant en quick-add prominent.
- **Toegankelijkheid**: Labels op knoppen, focusvolgorde, contrast; screenreader-teksten voor assistant-berichten en suggestieknoppen.
- **Snel terug**: Na het toevoegen van een taak/afspraak/uitgave direct terug naar waar de user vandaan kwam (assistant open houden of terug naar dashboard).

---

## 6. Korte prioriteiten (status)

1. **iOS / Apple Kalender** (gedaan): Subscribe-URL in Instellingen; .ics-export "Exporteer vandaag"; per event "Apple Kalender" link.
2. **Quick-add** (gedaan): Invoerveld "Taak of bericht…" in layout; Enter → ga naar assistant met pre-fill.
3. **Bevestiging** (gedaan): API antwoord bevat al "Taak toegevoegd" / "Afspraak in agenda gezet".
4. **Empty state taken** (gedaan): "Geen taken vandaag. Zeg tegen de assistant: voeg taak X toe" + link naar assistant.
5. **Later**: Sneltoetsen (N = taak, A = assistant); voorkeur "standaard sync naar Google"; CalDAV alleen bij behoefte.
