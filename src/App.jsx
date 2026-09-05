import { useState, useEffect } from 'react'
import './App.css'



import hammerPortrait from './assets/Hammer.png'
import żmijewskiPortrait from './assets/Żmijewski.png'
import kalePortrait from './assets/Kale_Iona.png'
import mason from './assets/mason.jpg'
import rook from './assets/rook.png'
import alienBackground from './assets/savage-table-bg.jpg'



import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage, db } from './firebase'
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteField,
} from 'firebase/firestore'


function rollExplodingDie(die) {
  const sides = Number(die.replace('d', ''))

  let total = 0
  const rolls = []
  let roll 

  do {
    roll = Math.floor(Math.random() * sides) + 1
    rolls.push(roll)
    total += roll
  } while (roll === sides)

  return {
    total,
    rolls,
  }
}


function getRank(advancements) {
  if (advancements >= 16) return 'Legenda'
  if (advancements >= 12) return 'Heros'
  if (advancements >= 8) return 'Weteran'
  if (advancements >= 4) return 'Doświadczony'

  return 'Nowicjusz'
}

function getCharacterStorageKey(characterName) {
  return `savageTableCharacterSheet_${characterName}`
}


async function saveCharacterToFirestore(character) {
  try {
    await setDoc(
      doc(db, 'characters', character.storageName),
      character
    )

    console.log(
      'POSTAĆ ZAPISANA W FIRESTORE:',
      character.name
    )
  } catch (error) {
    console.error(
      'Błąd zapisu postaci do Firestore:',
      error
    )
  }
}

function App() {

  const characters = [
  { name: 'Hammer', storageName: 'Hammer', pin: '2642' },
  { name: 'Żmijewski', storageName: 'Żmijewski', pin: '7319' },
  { name: 'Kale', storageName: 'Kale', pin: '4826' },
  { name: 'Mason', storageName: 'Mason', pin: '5937' },
  { name: 'Rook', storageName: 'Rook', pin: '8164' },
]

  const gmPin = '4269'

 function createDefaultCharacterSheet(characterName) {

    if (characterName === 'Żmijewski') {
    return {
      name: 'St.Szer. Stanisław T. Żmijewski',
      player: 'Olaf',
      portrait: żmijewskiPortrait,

      race: 'Człowiek',
      concept: 'Marines ',
      rank: 'Nowicjusz',
      advancements: 0,

      attributes: [
        { name: 'Zręczność', die: 'd8' },
        { name: 'Spryt', die: 'd6' },
        { name: 'Duch', die: 'd4' },
        { name: 'Siła', die: 'd6' },
        { name: 'Wigor', die: 'd8' },
      ],

      skills: [
        { name: 'Prowadzenie', die: 'd6' },
        { name: 'Przekonywanie', die: 'd4' },
        { name: 'Reperowanie', die: 'd4' },
        { name: 'Rzucanie', die: 'd4' },
        { name: 'Strzelanie', die: 'd8' },
        { name: 'Skradanie', die: 'd6' },
        { name: 'Spostrzegawczość', die: 'd6' },
        { name: 'Walka', die: 'd6' },
        { name: 'Wysportowanie', die: 'd6' },
        { name: 'Wiedza powrzechna', die: 'd4' },
        { name: 'Niewytrenowana', die: 'd4' },

      ],

      stats: {
        pace: 10,
        parry: 5,
        toughness: 10,
        armor: 4,
      },

      status: {
        bennies: 3,
        maxBennies: 3,
        wounds: 0,
        maxWounds: 3,
        fatigue: 0,
        maxFatigue: 2,
        shaken: false,
      },

      edges: [
        {
      name: 'Nerwy ze stali',
      description: 'Może zignorować 1 punkt kary za Rany.',
    },
     {
      name: 'Ulubiona broń (karabin M41A)',
      description: ' dodaje +1 do strzelania i + 1 do obrony.',
    },
      ],
      hindrances: [
        {
      name: 'Mściwy(Poważna) ',
      description: 'Zemsta jest rozkoszą bogów a ten awanturnik ma zamiar jej zakosztować. ',
    },

     {
      name: 'Porywczy(Poważna) ',
      description: 'Ten w gorącej wodzie kąpany bohater zawsze rzuca się głową naprzód i działa zawsze rzuca się głową naprzód i działa, zanim pomyśli. ',
    },
  ],
      loot: [
        {
    name: 'Przykładowa zdobycz',
    description: 'Tutaj można wpisać dodatkową informację o przedmiocie.',
  },
      ],
      equipment: [{
    name: 'M41A Pulse Rifle',
    description: 'zasieg 24/48/96',
    damage: '2d8',
    rateOfFire: 3,
    ap: 2,
    magazineSize: 99,
    ammo: 99,
  },

  {
    name: 'M4A3 Service Pistol',
    description: 'zasieg 12/24/48',
    damage: '2d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 12,
    ammo: 12,
  },

  {
    name: 'Miotacz Ognia M240',
    description: 'Jeżeli ogień trafi łatwopalny cel (decyduje MG), rzuć 1k6. 6 oznacza, że trafiony obiekt zapłonął i otrzymuje obrażenia',
    damage: '3d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 10,
    ammo: 10,
  },
  {
  name: 'Nóż bojowy',
  description: 'broń do walki wręcz.',
  damage: 'strength+d4',
},

    {
      name: 'Pancerz bojowy M3',
      description: 'Zapewnia dodatkową ochronę 4.(Korpus, ręce,nogi),'
    },

    {
  name: 'Reszta ekwipunku',
  description: 'pancerz osobisty M3 z kamerą taktyczną i modułem komunikacyjnym, kamizelka taktycznalatarka naramienna,ciepłe ubrania, opaska na rękę z OPD i transponderem lokalizującym.',
},

],
    }
  }

    if (characterName === 'Kale') {
    return {
      name: 'Mł. sierżant Kale Iona',
      player: 'Olek',
      portrait: kalePortrait,

      race: 'Człowiek',
      concept: 'Marines',
      rank: 'Nowicjusz',
      advancements: 0,

      attributes: [
        { name: 'Zręczność', die: 'd10' },
        { name: 'Spryt', die: 'd4' },
        { name: 'Duch', die: 'd4' },
        { name: 'Siła', die: 'd8' },
        { name: 'Wigor', die: 'd6' },
      ],

      skills: [
         { name: 'Prowadzenie', die: 'd4' },  
         { name: 'Przekonywanie', die: 'd4' }, 
         { name: 'Strzelanie', die: 'd8' },
         { name: 'Spostrzegawczość', die: 'd4' },
         { name: 'Walka', die: 'd8' },
         { name: 'Wysportowanie', die: 'd8' },
         { name: 'Wiedza powrzechna', die: 'd4' },
         { name: 'Niewytrenowana', die: 'd4' },
      ],

      stats: {
        pace: 10,
        parry: 6,
        toughness: 9,
        armor: 4,
      },

      status: {
        bennies: 3,
        maxBennies: 3,
        wounds: 0,
        maxWounds: 3,
        fatigue: 0,
        maxFatigue: 2,
        shaken: false,
      },

      edges: [
        {
      name: 'Błyskawiczny refleks',
      description: 'Bohaterka ma iście koci refleks i nigdy nie wpada w panikę.Jeżeli ciągnąc Kartę Akcji, dostaniesz piątkę albo mniej, możesz ją odrzucić i wylosować nową – póki nie trafi ci się coś lepszego, niż piątka.' ,
    },
     {
      name: 'Berserk',
      description: 'Berserk to niekontrolowany szał bitewny, który zmienia wojownika w prawdziwą maszynę do zabijania. Kiedy postać otrzyma Ranę lub dozna Szoku od obrażeń fizycznych, musisz przetestować Spryt porażka oznacza, że zaczął się berserk.Jeżeli chcesz, możesz dobrowolnie oblać ten test Berserk ma następujące efekty:FURIA: Siła postaci wzrasta o rodzaj kostki a każdy atak wręcz musi być Wściekły(patrz strona 111).Nie można w tym czasie używać żadnych umiejętności wymagających koncentracji albo pomyślunku (decyduje MG) – choć na przykład straszliwe groźby przy pomocy Zastraszania są bardzo na miejscu.WŚCIEKŁOŚĆ: Gniew i adrenalina wzmacniają mięśnie berserkera, który dodaje +2 do Wytrzymałości i ignoruje jeden poziom Ran (przewaga kumuluje się z innymi zdolnościami pozwalającymi ignorować Rany. CZERWONA MGŁA: Za każdym razem, gdy test Walki berserkera skończy się Katastrofą, trafiony zostaje losowy cel w jego zasięgu (poza tym, w którego atak mierzył) – przyjaciel lub wróg. Jeżeli w pobliżu nie ma potencjalnych celów, atak chybia, być może coś rozwalając. Po pięciu kolejnych rundach szału postać otrzymuje poziom Zmęczenia. Po dziesięciu dostaje kolejne Zmęczenie i berserk się kończy. Wojownik może też próbować opanować się wcześniej, testując Spryt−2 (akcja darmowa, pozwala uniknąć Zmęczenia, jeżeli szał skończy się przed końcem odnośnej rundy). Dla każdego ataku berserka zacznij odliczanie od nowa, nawet jeżeli ma miejsce w tej samej walce. ' ,
    },
      ],
      hindrances: [
        { name: 'Porywczy(Poważna) ',
      description: 'Ten w gorącej wodzie kąpany bohater zawsze rzuca się głową naprzód i działa zawsze rzuca się głową naprzód i działa, zanim pomyśli.. ',
    },

     { name: 'Ciekawski(Poważna) ',
      description: 'Jeżeli to pierwszy stopień do piekła, to gdzie cię zaprowadzi? Ciekawski bohater musi sam wszystko sprawdzić i aż się pali, by odkryć każdy sekret i tajemnicę.. ',
    },
      ],
      loot: [],
      equipment: [   {
    name: 'M56A2 Smart Gun',
    description: 'min str K8, +1 Shooting or -2 Cover penalty with helmet , zasieg 30/60/120',
    damage: '2d10',
    rateOfFire: 4,
    ap: 2,
    magazineSize: 200,
    ammo: 200,
  },

{
    name: 'M4A3 Service Pistol',
    description: 'zasieg 12/24/48',
    damage: '2d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 12,
    ammo: 12,
  },


{
    name: 'Granat Wielozadaniowy M40',
    description: 'zasieg 5/10/20',
    damage: '3d6',
    magazineSize: 4,
    ammo: 4,
  },

{
  name: 'Łom',
  description: 'broń do walki wręcz.',
  damage: 'strength+d4',
},

    {
      name: 'Pancerz bojowy M3',
      description: 'Zapewnia dodatkową ochronę 4.(Korpus, ręce,nogi),'
    },

    {
  name: 'Reszta ekwipunku',
  description: 'pancerz osobisty M3 z kamerą taktyczną i modułem komunikacyjnym, kamizelka taktycznalatarka naramienna,ciepłe ubrania, opaska na rękę z OPD i transponderem lokalizującym.',
},
],
    }
  }

  if (characterName === 'Mason') {
   
    return {
      name: 'Mł. sierżant Peter Mason',
      player: 'Maciek',
      portrait: mason,
      race: 'Człowiek',
      concept: 'Specjalista obrony przed bronią chemiczną, biologiczną radiologiczną i jądrową (CBRJ) ',
      rank: 'Nowicjusz',
      advancements: 0,
      attributes: [
        { name: 'Zręczność', die: 'd6' },
        { name: 'Spryt', die: 'd8' },
        { name: 'Duch', die: 'd6' },
        { name: 'Siła', die: 'd4' },
        { name: 'Wigor', die: 'd6' },
      ],
      skills: [
        { name: 'Elektronika', die: 'd4' },
        { name: 'Nauka', die: 'd6' },
        { name: 'Przekonywanie', die: 'd6' },
        { name: 'Reperowanie', die: 'd8' },
        { name: 'Strzelanie', die: 'd6' },
        { name: 'Skradanie', die: 'd4' },
        { name: 'Spostrzegawczość', die: 'd8' },
        { name: 'Wyszukiwanie', die: 'd4' },
        { name: 'Wysportowanie', die: 'd6' },
        { name: 'Wiedza powrzechna', die: 'd4' },
        { name: 'Niewytrenowana', die: 'd4' },
      ],
      stats: {
        pace: 10,
        parry: 2,
        toughness: 9,
        armor: 4,
      },
      status: {
        bennies: 3,
        maxBennies: 3,
        wounds: 0,
        maxWounds: 3,
        fatigue: 0,
        maxFatigue: 2,
        shaken: false,
      },
      edges: [
        {
      name: 'Czujny',
      description: '+2 do testów Spostrzegawczości wykonywanych, by coś zobaczyć, usłyszeć czy zauważyć w inny sposób',
    },
     {
      name: 'McGyver',
      description: 'McGyver potrafi zmontować proste urządzenia urządzenie z pospolitych przedmiotów: wystarczy dać mu trochę śmiecia, a wykona test Reperowania i przerobi dziadostwo na broń, materiał wybuchowy albo narzędzie, którym można posługiwać się do zużycia albo do końca spotkania (decyduje MG). Majsterkowanie trwa całą turę, w czasie której postać nie może się ruszać ani robić nic innego.Porażka w teście oznacza, że urządzenie nie jest jeszcze gotowe. Katastrofa sprawia, że nie da się go zbudować z dostępnych materiałów, a próby nie można powtórzyć do końca spotkania.Sukces pozwala zrobić porcję słabego materiału wybuchowego (2k4 obrażeń pod Małym Wzornikiem),jednostrzałową broń dystansową w rodzaju paralizatora (Zasięg 5/10/20, Obrażenia 2k6), prowizoryczną tratwę,ogniwo elektryczne i tak dalej. Przebicie pozwala wywołać większą eksplozję (2k6 obrażeń pod Średnim Wzornikiem albo 2k4pod Dużym), lepszą broń dystansową (pięć strzałów, obrażenia 2k8, Zasięg 10/20/40),mniej wywrotną tratwę, trwalszą baterię i tak dalej. Jakość i możliwości urządzenia zależą całkowicie od MG, która powinna nagrodzić kreatywność, zwłaszcza w obliczu trudności i niebezpieczeństw. ',
    },
      ],
      hindrances: [
        {
      name: 'Przysięga (Poważna) ',
      description: 'przysięga złożona byłemu dowódcy przed tym zanim uciekłem - stojac przy zwłokach dziecka - że nigdy nie dopuszczę i zrobię wszystko żeby te stwory trafiły na wolność . ',
    },

     {
      name: 'Tajemnica (Drobna) ',
      description: 'To ja postrzeliłem porucznika w nogę żeby uciec i wysadzić stację. W końcu złożyłem mu przysięgę że się nie wydostaną... musiał zrozumieć  . ',
    },

    {
      name: 'Świr  (Drobna) ',
      description: 'Postać święcie wierzy w coś, co u innych .budzi w najlepszym razie zdumienie. Drobny Świr ma niegroźne przekonania albo ich nie rozgłasza. ',
    },
  ],
      loot: [
        {
    name: 'Przykładowa zdobycz',
    description: 'Tutaj można wpisać dodatkową informację o przedmiocie.',
  },
      ],
      equipment: [{
    name: 'M41A Pulse Rifle',
    description: 'zasieg 24/48/96',
    damage: '2d8',
    rateOfFire: 3,
    ap: 2,
    magazineSize: 99,
    ammo: 99,
  },

  {
    name: 'Granatnik U1',
    description: 'zasieg 24/48/96',
    damage: '4d8',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 3,
    ammo: 3,
  },

  {
    name: 'M4A3 Service Pistol',
    description: 'zasieg 12/24/48',
    damage: '2d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 12,
    ammo: 12,
  },

  {
    name: 'Miotacz Ognia M240',
    description: 'zasieg 12/24/48',
    damage: '3d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 10,
    ammo: 10,
  },

   {
      name: 'Pancerz bojowy M3',
      description: 'Zapewnia dodatkową ochronę 4.(Korpus, ręce,nogi),'
    },

    {
  name: 'Reszta ekwipunku',
  description: 'Zestaw wykrywający CBRJ,pakiet tabletek BezSen, pancerz osobisty M3 z kamerą taktyczną i modułem komunikacyjnym, kamizelka taktycznalatarka naramienna,ciepłe ubrania, opaska na rękę z OPD i transponderem lokalizującym.',
},

],
    }
  }

   if (characterName === 'Rook') {
    return {
      name: 'St. Szer.Leon Rook',
      player: 'Rafał',
      portrait: rook,
      race: 'Człowiek',
      concept: 'Marines',
      rank: 'Nowicjusz',
      advancements: 0,
      attributes: [
        { name: 'Zręczność', die: 'd8' },
        { name: 'Spryt', die: 'd6' },
        { name: 'Duch', die: 'd8' },
        { name: 'Siła', die: 'd6' },
        { name: 'Wigor', die: 'd8' },
      ],
      skills: [
        { name: 'Przekonywanie', die: 'd4' },
        { name: 'Strzelanie', die: 'd12' },
        { name: 'Skradanie', die: 'd4' },
        { name: 'Spostrzegawczość', die: 'd4' },
        { name: 'Walka', die: 'd10' },
        { name: 'Wysportowanie', die: 'd4' },
        {name: 'Wiedza powrzechna', die: 'd4' },
        { name: 'Niewytrenowana', die: 'd4' },
      ],
      stats: {
        pace: 10,
        parry: 2,
        toughness: 10,
        armor: 4,
      },
      status: {
        bennies: 3,
        maxBennies: 3,
        wounds: 0,
        maxWounds: 3,
        fatigue: 0,
        maxFatigue: 2,
        shaken: false,
      },
      edges: [
        {
      name: 'Żołnierz',
      description: 'Zawodowy żołnierz potrafi dwie rzeczy: nosić ciężary i przeżyć w trudnych warunkach. Po kilku dniach przyzwyczajania do osprzętowania (decyzja MG) traktuj Siłę bohatera, jakby była o jeden rodzaj kostki wyższa, gdy obliczasz jego Obładowanie (strona 69) i Minimalną Siłę konieczną do używania zbroi, broni i ekwipunku bez kar (strona 68). Rzecz kumuluje się z przewagą Krzepki. Możesz ponadto za darmo jednokrotnie przerzucić każdy test Wigoru, kiedy jesteś w nieprzyjaznym środowisku (patrz Zagrożenia, strona 136)',
    },
      ],
      hindrances: [
        {
      name: 'Kalectwo - implant i mimowolne wystrzały (Poważna) ',
      description: 'implant i mimowolne wystrzały',
    },

    {
      name: 'Zhańbiony (Drobna) ',
      description: 'Coś prześladuje tego awanturnika. Może nie dotrzymał przysięgi. Może przegrał w honorowym  pojedynku, a potem dla dobra sprawy zamordował przeciwnika. Albo nie jest tchórzem, ale raz uciekł z pola walki i przylgnęła do niego łatka strachajły.Przy Drobnej Zawadzie hańba nie jest powszechnie znana – prześladuje tylko myśli bohatera. W efekcie może na przykład zachowywać się głupio i ryzykownie, byle nie powtórzyć tamtego błędu. ',
    },

    {
      name: 'Ostrożny (Drobna) ',
      description: 'Postać jest ucieleśnieniem zachowawczej ostrożności Nigdy nie działa pod wpływem impulsu i jeżeli w ogóle się do czegoś zabiera, zawsze opracowuje najpierw szczegółowy plan.',
    },
      ],
      loot: [],
      equipment: [
        {
    name: 'M41A Pulse Rifle',
    description: 'zasieg 24/48/96',
    damage: '2d8',
    rateOfFire: 3,
    ap: 2,
    magazineSize: 99,
    ammo: 99,
  },

  {
    name: 'Granatnik U1',
    description: 'zasieg 24/48/96',
    damage: '4d8',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 3,
    ammo: 3,
  },

  {
    name: 'M4A3 Service Pistol',
    description: 'zasieg 12/24/48',
    damage: '2d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 12,
    ammo: 12,
  },

  {
    name: 'Ręczny Granatnik Przeciwpancerny M5A3',
    description: 'zasieg 24/48/96',
    damage: '4d8',
    rateOfFire: 8,
    ap: 1,
    magazineSize: 6,
    ammo: 6,
  },

   {
      name: 'Pancerz bojowy M3',
      description: 'Zapewnia dodatkową ochronę 4.(Korpus, ręce,nogi),'
    },

    {
  name: 'Reszta ekwipunku',
  description: 'Palnik, pancerz osobisty M3 z kamerą taktyczną i modułem komunikacyjnym, kamizelka taktycznalatarka naramienna,ciepłe ubrania, opaska na rękę z OPD i transponderem lokalizującym.',
},
      ],
    }
  }

  return {
    name: 'Szer.Nathaniel A.W. Hammer',
    player: 'Sebastian',
    portrait: hammerPortrait,
    race: 'Człowiek',
    concept: 'Marines',
    rank: 'Nowicjusz',
    advancements: 0,
    attributes: [
      { name: 'Zręczność', die: 'd8' },
      { name: 'Spryt', die: 'd4' },
      { name: 'Duch', die: 'd6' },
      { name: 'Siła', die: 'd6' },
      { name: 'Wigor', die: 'd8' },
    ],
    skills: [
  { name: 'Przekonywanie', die: 'd4' },
  { name: 'Strzelanie', die: 'd12' },
  { name: 'Skradanie', die: 'd4' },
  { name: 'Spostrzegawczość', die: 'd4' },
  { name: 'Walka', die: 'd10' },
  { name: 'Wysportowanie', die: 'd4' },
  { name: 'Wiedza powrzechna', die: 'd4' },
  { name: 'Niewytrenowana', die: 'd4' },
],
stats: {
  pace: 10,
  parry: 7,
  toughness: 11,
  armor: 4,
},

status: {
  bennies: 3,
  maxBennies: 3,
  wounds: 0,
  maxWounds: 3,
  fatigue: 0,
  maxFatigue: 2,
  shaken: false,
},

edges: [
    {
      name: 'Dzielny',
      description: '+2 do testów strachu i -2 do wyniku w tabeli strachu',
    },
    {
      name: 'Krzepki',
      description: '+1 do Wytrzymałości, Rozmaru i Sły na potrzeby ustalenia udźwigu i minimalnej siły na potrzeby broni ',
    },
    {
      name: 'Trzecia Przewaga',
      description: 'Kolejny przykład Przewagi postaci.',
    },
  ],

  hindrances: [
    {
      name: 'Lojalny(Drobna) ',
      description: 'Ten niezłomny obrońca bez wahania zaryzykuje życie dla przyjaciół. Część Lojalnych postaci stara się ten fakty ukrywać,ale gdy zrobi się gorąco, bez wahania ruszą ,towarzyszom na pomoc. Hammer nigdy nie porzuca przyjaciół.',
    },
    {
      name: 'Obsesja(Drobna) ',
      description: ' Hammer ma swój cel, a jego celem jest cel Korpusu.',
    },
    {
      name: 'Arogancki(Poważna) ',
      description: 'Lubisz górować nad przeciwnikiem, zawsze atakujesz najpotężniejszego wroga.',
    },
  ],

  loot: [
  {
    name: 'Narkotyk Bojowy X ',
    description: '4 dawki.',
  },
],

  equipment: [
     {
    name: 'M56A2 Smart Gun',
    description: 'min str K8, +1 Shooting or -2 Cover penalty with helmet , zasieg 30/60/120',
    damage: '2d10',
    rateOfFire: 4,
    ap: 2,
    magazineSize: 200,
    ammo: 200,
  },

{
    name: 'M4A3 Service Pistol',
    description: 'zasieg 12/24/48',
    damage: '2d6',
    rateOfFire: 1,
    ap: 1,
    magazineSize: 12,
    ammo: 12,
  },


{
    name: 'Granat Wielozadaniowy M40',
    description: 'zasieg 5/10/20',
    damage: '3d6',
    magazineSize: 4,
    ammo: 4,
  },

{
  name: 'Nóż bojowy',
  description: 'broń do walki wręcz.',
  damage: 'strength+d4',
},

    {
      name: 'Pancerz bojowy M3',
      description: 'Zapewnia dodatkową ochronę 4.(Korpus, ręce,nogi),'
    },

    {
  name: 'Reszta ekwipunku',
  description: 'pancerz osobisty M3 z kamerą taktyczną i modułem komunikacyjnym, kamizelka taktycznalatarka naramienna,ciepłe ubrania, opaska na rękę z OPD i transponderem lokalizującym.',
},
],
  }

}

const [characterSheet, setCharacterSheet] = useState(() => {
  return createDefaultCharacterSheet()
})

  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [activeCharacterName, setActiveCharacterName] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('card')
  const [selectedRoll, setSelectedRoll] = useState(null)
  const [burstSize, setBurstSize] = useState(null)
  const [burstResult, setBurstResult] = useState(null)
  const [burstRerollResult, setBurstRerollResult] = useState(null)
  const [rollModifier, setRollModifier] = useState(0)
  const [rollResult, setRollResult] = useState(null)
  const [rerollResult, setRerollResult] = useState(null)
  const [soakResult, setSoakResult] = useState(null)
  const [damageResult, setDamageResult] = useState(null)
  const [rollHistory, setRollHistory] = useState([])
  const [chosenFinalResult, setChosenFinalResult] = useState(null)


  const [initiativeDeck, setInitiativeDeck] = useState([])
  const [initiativeResults, setInitiativeResults] = useState([])
  const [initiativeName, setInitiativeName] = useState('')

  const [selectedDie, setSelectedDie] = useState('d6')
  const [diceRollResult, setDiceRollResult] = useState(null)
  const [showLootForm, setShowLootForm] = useState(false)
  const [newLootName, setNewLootName] = useState('')
  const [newLootDescription, setNewLootDescription] = useState('')
  const [editingLootIndex, setEditingLootIndex] = useState(null)
 
  const [isGmLogin, setIsGmLogin] = useState(false)
  const [isGmLoggedIn, setIsGmLoggedIn] = useState(false)
  const [gmPinInput, setGmPinInput] = useState('')
  const [gmError, setGmError] = useState('')
  const [gmActiveTab, setGmActiveTab] = useState('characters') 
  const [gmSelectedCharacter, setGmSelectedCharacter] = useState(null)
  const [isGmEditingCharacter, setIsGmEditingCharacter] = useState(false)

  const [gmEditName, setGmEditName] = useState('')

  const [gmEditPlayer, setGmEditPlayer] = useState('')
  const [gmEditRace, setGmEditRace] = useState('')
  const [gmEditConcept, setGmEditConcept] = useState('')
  const [gmEditRank, setGmEditRank] = useState('')
  const [gmEditAdvancements, setGmEditAdvancements] = useState(0)

  const [gmEditStats, setGmEditStats] = useState({
  pace: 6,
  parry: 5,
  toughness: 5,
  armor: 0,
})

  const [gmEditAttributes, setGmEditAttributes] = useState([])
  const [gmEditSkills, setGmEditSkills] = useState([])
  const [gmEditEdges, setGmEditEdges] = useState([])
  const [gmEditHindrances, setGmEditHindrances] = useState([])
  const [gmEditEquipment, setGmEditEquipment] = useState([])
  const [gmEditStatus, setGmEditStatus] = useState(null)

  const [, setGmRefresh] = useState(0)
  const [gmBennies, setGmBennies] = useState(0)

const [galleryImages, setGalleryImages] = useState([])
const [galleryImageTitle, setGalleryImageTitle] = useState('')
const [activeGalleryImage, setActiveGalleryImage] = useState(null)
const [galleryImageFile, setGalleryImageFile] = useState(null)
const [galleryCategory, setGalleryCategory] = useState('Postacie')
const [sharedGalleryImages, setSharedGalleryImages] = useState([])
const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)

const [selectedGameMap, setSelectedGameMap] = useState(null)
const [isGameMapOpen, setIsGameMapOpen] = useState(true)
const [mapMarkerText, setMapMarkerText] = useState('H')
const [mapMarkers, setMapMarkers] = useState([])


const [gmNotes, setGmNotes] = useState('')

const [npcs, setNpcs] = useState([])
const [selectedNpc, setSelectedNpc] = useState(null)
const [editingNpc, setEditingNpc] = useState(null)

const [isCharacterLoaded, setIsCharacterLoaded] = useState(false)

const [npcForm, setNpcForm] = useState({
  name: '',
  type: 'extra',

  agility: 'd6',
  smarts: 'd6',
  spirit: 'd6',
  strength: 'd6',
  vigor: 'd6',

  fighting: 'd6',
  shooting: 'd6',
  athletics: 'd6',
  stealth: 'd6',
  notice: 'd6',

  pace: 6,
  defense: 5,
  toughness: 5,

  attacks: [],

  notes: '',
})

const [npcAttackName, setNpcAttackName] = useState('')
const [npcAttackDamage, setNpcAttackDamage] = useState('')
const [npcAttackPP, setNpcAttackPP] = useState(0)



useEffect(() => {
  async function loadGalleryImages() {
    try {
      const querySnapshot = await getDocs(
        collection(db, 'galleryImages')
      )

      const loadedImages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      loadedImages.sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      )

      setGalleryImages(loadedImages)

    } catch (error) {
      console.error(
        'Błąd podczas wczytywania galerii:',
        error
      )
    }
  }


  loadGalleryImages()
}, [])

useEffect(() => {

  const unsubscribe = onSnapshot(
    doc(db, 'gallerySettings', 'sharedImages'),
    (snapshot) => {

      if (snapshot.exists()) {

        const data = snapshot.data()

        setSharedGalleryImages(
          Object.entries(data).map(([id, image]) => ({
            id,
            ...image,
          }))
        )

      } else {

        setSharedGalleryImages([])

      }

    },
    (error) => {

      console.error(
        'Błąd podczas wczytywania udostępnionych grafik:',
        error
      )

    }
  )

  return () => unsubscribe()

}, [])

useEffect(() => {
  const activeImageRef = doc(
    db,
    'gallerySettings',
    'activeImage'
  )

  const unsubscribe = onSnapshot(
    activeImageRef,
    (snapshot) => {
      if (snapshot.exists()) {
        setActiveGalleryImage({
          id: snapshot.data().imageId,
          title: snapshot.data().title,
          url: snapshot.data().url,
        })
      } else {
        setActiveGalleryImage(null)
      }
    },
    (error) => {
      console.error(
        'Błąd podczas pobierania aktywnej grafiki:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [])

useEffect(() => {
  const gameMapRef = doc(
    db,
    'gallerySettings',
    'gameMap'
  )

  const unsubscribe = onSnapshot(
    gameMapRef,
    (snapshot) => {
      if (snapshot.exists()) {
  setSelectedGameMap({
    id: snapshot.data().imageId,
    title: snapshot.data().title,
    url: snapshot.data().url,
  })

  setMapMarkers(snapshot.data().markers || [])
} else {
  setSelectedGameMap(null)
  setMapMarkers([])
}
    },
    (error) => {
      console.error(
        'Błąd podczas pobierania mapy gry:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [])



useEffect(() => {
  async function loadGmNotes() {
    try {
      const notesRef = doc(db, 'gmData', 'notes')
      const notesSnapshot = await getDoc(notesRef)

      if (notesSnapshot.exists()) {
        setGmNotes(notesSnapshot.data().content || '')
      }
    } catch (error) {
      console.error(
        'Błąd podczas wczytywania notatek MG:',
        error
      )
    }
  }

  loadGmNotes()
}, [])


useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'npcs'),
    (snapshot) => {
      const loadedNpcs = snapshot.docs.map((npcDoc) => ({
        id: npcDoc.id,
        ...npcDoc.data(),
      }))

      setNpcs(loadedNpcs)
    },
    (error) => {
      console.error(
        'Błąd podczas wczytywania NPC:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [])

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'rollHistory'),
    (snapshot) => {
      const loadedRolls = snapshot.docs
        .map((rollDoc) => ({
          id: rollDoc.id,
          ...rollDoc.data(),
        }))
        .sort((a, b) => {
  const timeA = a.createdAt?.toMillis?.() || 0
  const timeB = b.createdAt?.toMillis?.() || 0

  return timeB - timeA
})

      setRollHistory(loadedRolls)
    },
    (error) => {
      console.error(
        'Błąd podczas wczytywania historii rzutów:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [])


async function addRollToHistory(rollData) {
  try {
    await addDoc(
      collection(db, 'rollHistory'),
      {
        ...rollData,
        createdAt: serverTimestamp(),
      }
    )
  } catch (error) {
    console.error(
      'Błąd podczas zapisywania rzutu:',
      error
    )
  }
}

useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'gameState', 'initiative'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()

        setInitiativeDeck(data.deck || [])
        setInitiativeResults(data.results || [])
      } else {
        setInitiativeDeck([])
        setInitiativeResults([])
      }
    },
    (error) => {
      console.error(
        'Błąd podczas wczytywania inicjatywy:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [])


useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'gameState', 'gmBennies'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()

        setGmBennies(data.count || 0)
      } else {
        setGmBennies(0)
      }
    },
    (error) => {
      console.error(
        'Błąd podczas wczytywania Fuksów MG:',
        error
      )
    }
  )

  return () => unsubscribe()
}, [])


useEffect(() => {
  if (
    !isCharacterLoaded ||
    !selectedCharacter ||
    !characterSheet?.name
  ) {
    return
  }

  const storageKey = getCharacterStorageKey(
    selectedCharacter.name
  )

  // Lokalna kopia — zostawiamy jako zabezpieczenie
  localStorage.setItem(
    storageKey,
    JSON.stringify(characterSheet)
  )

  // Wspólna kopia — Firestore
  const saveCharacterToFirestore = async () => {
    try {
      await setDoc(
        doc(db, 'characters', selectedCharacter.storageName),
        characterSheet
      )

      console.log(
        'POSTAĆ ZAPISANA W FIRESTORE:',
        characterSheet.name
      )
    } catch (error) {
      console.error(
        'Błąd podczas zapisywania postaci w Firestore:',
        error
      )
    }
  }

  saveCharacterToFirestore()
}, [
  characterSheet,
  selectedCharacter,
  isCharacterLoaded,
])








function rollNpcTrait(npc, traitName, die) {
  const sides = Number(die.replace('d', ''))

  // Rzut kością z eksplozjami
  const rollExploding = (diceSides) => {
    let total = 0
    let roll

    do {
      roll = Math.floor(Math.random() * diceSides) + 1
      total += roll
    } while (roll === diceSides)

    return total
  }

  const traitResult = rollExploding(sides)

  let finalResult = traitResult

if (npc.type === 'wildcard') {
  const wildResult = rollExploding(6)
  finalResult = Math.max(traitResult, wildResult)
}

  let outcome = 'PORAŻKA'

  if (finalResult >= 4) {
    outcome =
      finalResult >= 8
        ? 'SUKCES + PODBICIE'
        : 'SUKCES'
  }

  addRollToHistory({
  type: 'npc',
  character: npc.name,
  name: `🎲 ${traitName}`,
  die:
    npc.type === 'wildcard'
      ? `${die} + Wild d6`
      : die,
  result: finalResult,
  outcome,
})
}

async function rollNpcDamage(npc, attack) {
  const damageText = attack.damage.trim()
  const diceResults = []
  let totalDamage = 0

  // Obrażenia oparte na Sile, np. strength+d6
  if (damageText.toLowerCase().startsWith('strength+')) {
    const weaponDie = damageText
      .replace(/^strength\+/i, '')
      .trim()

    if (!/^d\d+$/i.test(weaponDie)) {
      alert(
        `Nieprawidłowy zapis obrażeń: ${damageText}`
      )
      return
    }

    // Kość Siły NPC
    const strengthResult = rollExplodingDie(
      npc.strength
    )

    // Kość broni
    const weaponResult = rollExplodingDie(
      weaponDie
    )

    diceResults.push({
      label: `Siła ${npc.strength}`,
      ...strengthResult,
    })

    diceResults.push({
      label: `Broń ${weaponDie}`,
      ...weaponResult,
    })

    totalDamage =
      strengthResult.total +
      weaponResult.total
  }

  // Zwykłe obrażenia, np. 2d6, 2d8, 1d10
  else {
    const diceMatch =
      damageText.match(/^(\d+)d(\d+)$/i)

    if (!diceMatch) {
      alert(
        `Nieprawidłowy zapis obrażeń: ${damageText}`
      )
      return
    }

    const numberOfDice = Number(diceMatch[1])
    const dieSize = Number(diceMatch[2])

    for (
      let index = 0;
      index < numberOfDice;
      index++
    ) {
      const rollResult = rollExplodingDie(
        `d${dieSize}`
      )

      diceResults.push({
        label: `Kość ${index + 1}`,
        ...rollResult,
      })

      totalDamage += rollResult.total
    }
  }

  const newRoll = {
  character: npc.name,
  name: npc.name,
  type: 'damage',
  label: `💥 ${attack.name} — obrażenia`,
  dice: attack.damage,
  diceResults,
  results: diceResults.map(
    (result) => result.total
  ),
  result: totalDamage,
  pp: attack.pp ?? 0,
}

  await addRollToHistory(newRoll)
}

function sortInitiativeResults(results) {
  const cardValues = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14,
  }

  const suitValues = {
    '♠': 4,
    '♥': 3,
    '♦': 2,
    '♣': 1,
  }

  function parseCard(card) {
    const value = card.slice(0, -1)
    const suit = card.slice(-1)

    return {
      value,
      suit,
    }
  }

  return [...results].sort((a, b) => {
    const aIsJoker = a.card === '🃏 JOKER'
    const bIsJoker = b.card === '🃏 JOKER'

    // Joker zawsze pierwszy
    if (aIsJoker && !bIsJoker) return -1
    if (!aIsJoker && bIsJoker) return 1
    if (aIsJoker && bIsJoker) return 0

    const aCard = parseCard(a.card)
    const bCard = parseCard(b.card)

    // Najpierw starszeństwo karty
    if (
      cardValues[aCard.value] !==
      cardValues[bCard.value]
    ) {
      return (
        cardValues[bCard.value] -
        cardValues[aCard.value]
      )
    }

    // Przy tej samej wartości: ♠ > ♥ > ♦ > ♣
    return (
      suitValues[bCard.suit] -
      suitValues[aCard.suit]
    )
  })
}

  function changeStatusValue(field, maxField, amount) {
  setCharacterSheet((currentSheet) => {
    const currentValue = currentSheet.status[field]
    const maxValue = currentSheet.status[maxField]

    const newValue = Math.max(
      0,
      Math.min(maxValue, currentValue + amount)
    )

    return {
      ...currentSheet,
      status: {
        ...currentSheet.status,
        [field]: newValue,
      },
    }
  })
}

function changeAmmo(weaponName, amount) {
  setCharacterSheet((currentSheet) => ({
    ...currentSheet,

    equipment: currentSheet.equipment.map((item) => {
      if (item.name !== weaponName) return item

      if (
        typeof item.ammo !== 'number' ||
        typeof item.magazineSize !== 'number'
      ) {
        return item
      }

      const newAmmo = Math.max(
        0,
        Math.min(
          item.magazineSize,
          item.ammo + amount
        )
      )

      return {
        ...item,
        ammo: newAmmo,
      }
    }),
  }))
}

function toggleShaken() {
  setCharacterSheet((currentSheet) => ({
    ...currentSheet,
    status: {
      ...currentSheet.status,
      shaken: !currentSheet.status.shaken,
    },
  }))
}



function rollDamageDice(damage) {
  const diceResults = []
  let total = 0

  if (damage.startsWith('strength+')) {
    const strength = characterSheet.attributes.find(
      (attribute) => attribute.name === 'Siła'
    )

    if (!strength) return null

    const weaponDie = damage.replace('strength+', '')

    const strengthResult = rollExplodingDie(strength.die)
    const weaponResult = rollExplodingDie(weaponDie)

    diceResults.push({
      label: `Siła ${strength.die}`,
      ...strengthResult,
    })

    diceResults.push({
      label: `Broń ${weaponDie}`,
      ...weaponResult,
    })

    total = strengthResult.total + weaponResult.total

    return {
      damage,
      diceResults,
      total,
    }
  }

  const match = damage.match(/^(\d*)d(\d+)$/)

  if (!match) return null

  const numberOfDice = Number(match[1] || 1)
  const sides = Number(match[2])

  for (let i = 0; i < numberOfDice; i++) {
    const result = rollExplodingDie(`d${sides}`)

    diceResults.push({
      label: `Kość ${i + 1}`,
      ...result,
    })

    total += result.total
  }

  return {
    damage,
    diceResults,
    total,
  }
}


function performRoll() {
  if (!selectedRoll) return

  const traitResult = rollExplodingDie(selectedRoll.die)
  const wildResult = rollExplodingDie('d6')

  const chosenResult = Math.max(
    traitResult.total,
    wildResult.total
  )

  const finalResult = chosenResult + rollModifier

  return {
    traitResult,
    wildResult,
    chosenResult,
    modifier: rollModifier,
    finalResult,
  }
}

function getBurstAmmoCost(rateOfFire) {
  const ammoCosts = {
    1: 1,
    2: 5,
    3: 10,
    4: 20,
    5: 40,
    6: 50,
  }

  return ammoCosts[rateOfFire] ?? 0
}

function performBurstRoll(rateOfFire) {
  if (!selectedRoll) return

  const shots = []

  for (let i = 0; i < rateOfFire; i++) {
    const result = rollExplodingDie(selectedRoll.die)

    shots.push({
      ...result,
      finalResult: result.total + rollModifier,
    })
  }

  const wildResult = rollExplodingDie('d6')

  const allResults = [
    ...shots,
    {
      ...wildResult,
      finalResult: wildResult.total + rollModifier,
      isWild: true,
    },
  ]

  // Zostawiamy dokładnie tyle wyników,
  // ile wynosi RoF. Dzika może zastąpić jeden z nich.
  const chosenResults = [...allResults]
    .sort((a, b) => b.finalResult - a.finalResult)
    .slice(0, rateOfFire)

  const successCount = chosenResults.filter(
    (result) => result.finalResult >= 4
  ).length

  const raiseCount = chosenResults.filter(
    (result) => result.finalResult >= 8
  ).length

  return {
    shots,
    wildResult,
    chosenResults,
    successCount,
    raiseCount,
    modifier: rollModifier,
  }
}

function rerollBurst() {
  if (!burstSize) return

  const result = performBurstRoll(burstSize)

    setBurstRerollResult(result)

}

function performSoakRoll() {
  const vigor = characterSheet.attributes.find(
    (attribute) => attribute.name === 'Wigor'
  )

  if (!vigor) return null

  const vigorResult = rollExplodingDie(vigor.die)
  const wildResult = rollExplodingDie('d6')

  const chosenResult = Math.max(
    vigorResult.total,
    wildResult.total
  )

  return {
    vigorResult,
    wildResult,
    chosenResult,
  }
}


function getRollOutcome(result) {
  if (result < 4) {
    return 'PORAŻKA'
  }

  const raises = Math.floor((result - 4) / 4)

  if (raises === 0) {
    return 'SUKCES'
  }

  if (raises === 1) {
    return 'SUKCES + 1 PODBICIE'
  }

  return `SUKCES + ${raises} PODBICIA`
}

function getRollOutcomeClass(finalResult) {
  if (finalResult < 4) {
    return 'roll-outcome-failure'
  }

  if (finalResult >= 12) {
    return 'roll-outcome-raise'
  }

  return 'roll-outcome-success'
}

  function selectCharacter(character) {
    setSelectedCharacter(character)
    setPin('')
    setError('')
  }

  function openGmLogin() {
  setIsGmLogin(true)
  setGmPinInput('')
  setGmError('')
}

  function loginGm() {
  if (gmPinInput !== gmPin) {
    setGmError('Nieprawidłowy PIN MG')
    return
  }

  setIsGmLoggedIn(true)
  setIsGmLogin(false)
  setGmPinInput('')
  setGmError('')
}

  function logoutGm() {
  setIsGmLoggedIn(false)
  setGmPinInput('')
  setGmError('')
  setGmActiveTab('characters')
}

function getAllCharactersForGm() {
  return characters.map((character) => {
    const storageKey = getCharacterStorageKey(character.storageName)

    const savedCharacterSheet = localStorage.getItem(storageKey)

    let characterSheet

  const defaultCharacterSheet =
  createDefaultCharacterSheet(character.name)

if (savedCharacterSheet) {
  const savedSheet = JSON.parse(savedCharacterSheet)

  characterSheet = {
    ...defaultCharacterSheet,
    ...savedSheet,

    portrait:
      savedSheet.portrait || defaultCharacterSheet.portrait,
  }
} else {
  characterSheet = defaultCharacterSheet
}

    return {
      ...characterSheet,
      storageName: character.storageName,
    }
  })
}


async function loginCharacter() {
  if (pin !== selectedCharacter.pin) {
    setError('Nieprawidłowy PIN')
    return
  }

  const characterName = selectedCharacter.name
  const storageKey = getCharacterStorageKey(characterName)

  const defaultCharacterSheet =
    createDefaultCharacterSheet(characterName)

  try {
    const characterDoc = await getDoc(
      doc(db, 'characters', selectedCharacter.storageName)
    )

    if (characterDoc.exists()) {
      const savedSheet = characterDoc.data()

      setCharacterSheet({
        ...defaultCharacterSheet,
        ...savedSheet,
        portrait: defaultCharacterSheet.portrait,
      })

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...defaultCharacterSheet,
          ...savedSheet,
          portrait: defaultCharacterSheet.portrait,
        })
      )
    } else {
      const savedCharacterSheet =
        localStorage.getItem(storageKey)

      if (savedCharacterSheet) {
        const savedSheet = JSON.parse(savedCharacterSheet)

        setCharacterSheet({
          ...defaultCharacterSheet,
          ...savedSheet,
          portrait: defaultCharacterSheet.portrait,
        })
      } else {
        localStorage.setItem(
          storageKey,
          JSON.stringify(defaultCharacterSheet)
        )

        setCharacterSheet(defaultCharacterSheet)
      }
    }
  } catch (error) {
    console.error(
      'Błąd podczas wczytywania postaci z Firestore:',
      error
    )

    const savedCharacterSheet =
      localStorage.getItem(storageKey)

    if (savedCharacterSheet) {
      const savedSheet = JSON.parse(savedCharacterSheet)

      setCharacterSheet({
        ...defaultCharacterSheet,
        ...savedSheet,
        portrait: defaultCharacterSheet.portrait,
      })
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify(defaultCharacterSheet)
      )

      setCharacterSheet(defaultCharacterSheet)
    }
  }

  setIsCharacterLoaded(true)
  setNewLootName('')
  setNewLootDescription('')
  setEditingLootIndex(null)
  setShowLootForm(false)
  setActiveCharacterName(characterName)
  setActiveTab('card')
}

function goBack() {

  setSelectedCharacter(null)

  setPin('')

  setError('')

}

function logout() {
  setIsCharacterLoaded(false)

  if (selectedCharacter) {

const characterName = selectedCharacter.name

const storageKey = getCharacterStorageKey(characterName)


localStorage.setItem(
  storageKey,
  JSON.stringify(characterSheet)
)

  }

  setSelectedCharacter(null)
  setActiveCharacterName(null)
  setPin('')
  setError('')
  setActiveTab('card')

}

function renderRecentRolls() {
  const recentRolls = rollHistory.slice(0, 5)

  return (
    <section className="recent-rolls-panel">
      <h3>🎲 OSTATNIE RZUTY</h3>

      {recentRolls.length === 0 ? (
        <p>Brak rzutów.</p>
      ) : (
        <div className="recent-rolls-list">
          {recentRolls.map((roll) => (
            <div
              className="recent-roll-card"
              key={roll.id}
            >
              <div className="recent-roll-header">
                <strong>{roll.character}</strong>
                <span>
                  {roll.outcome || 'RZUT'}
                </span>
              </div>

              <strong className="recent-roll-name">
                {roll.label || roll.name}
              </strong>

              <div className="recent-roll-result">
                Wynik:{' '}
                <strong>{roll.result}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}



function renderCard() {
    return (
      <section className="character-sheet">
       <div className="sheet-header">
          <div> 
            <p className="sheet-label">POSTAĆ</p>
            <h2>{characterSheet.name}</h2>
          </div>

          <div className="sheet-rank">
            <span>RANGA</span>
            <strong>{characterSheet.rank}</strong>
          </div>
        </div>

        <div className="character-main-info">

  {characterSheet.portrait && (
    <div className="character-portrait">
      <img
        src={characterSheet.portrait}
        alt={`Portret postaci ${characterSheet.name}`}
      />
    </div>
  )}

  <div className="character-info">

    <div className="info-field">
      <span>GRACZ</span>
      <strong>{characterSheet.player}</strong>
    </div>

    <div className="info-field">
      <span>RASA</span>
      <strong>{characterSheet.race}</strong>
    </div>

    <div className="info-field">
      <span>KONCEPCJA</span>
      <strong>{characterSheet.concept}</strong>
    </div>

  </div>

</div>

        <div className="sheet-section">
          <h3>CECHY</h3>

          <div className="attributes-grid">
            {characterSheet.attributes.map((attribute) => (
              <button
                className="attribute-card"
                key={attribute.name}
                onClick={() => {
                  setSelectedRoll({
                      name: attribute.name,
                      die: attribute.die,
              })
            }}
              >
                <span>{attribute.name}</span>
                <strong>{attribute.die}</strong>
              </button>
            ))}
          </div>
        </div>
                <div className="sheet-section">
          <h3>UMIEJĘTNOŚCI</h3>

          <div className="skills-list">
            {characterSheet.skills.map((skill) => (
              <button
                className="skill-row"
                key={skill.name}
                onClick={() => {
                       console.log('WYBRANO:', skill)
                       setSelectedRoll(skill)
                 }}
              >
                <span>{skill.name}</span>
                <strong>{skill.die}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="sheet-section">
  <h3>ROZWINIĘCIA</h3>

  <div className="advancements-card">
    <p>
      Kupione rozwinięcia:{' '}
      <strong>{characterSheet.advancements}</strong>
    </p>

    <p>
      Aktualna ranga:{' '}
      <strong>{getRank(characterSheet.advancements)}</strong>
    </p>
  </div>
</div>
<div className="sheet-section">

  <h3>⭐ PRZEWAGI</h3>

  <div className="traits-list edges-list">
    {characterSheet.edges.map((edge) => (
      <div className="trait-card" key={edge.name}>
        <strong>{edge.name}</strong>

        <p>{edge.description}</p>
      </div>
    ))}
  </div>
</div>

<div className="sheet-section">

  <h3>⚠️ ZAWADY</h3>

  <div className="traits-list hindrances-list">
    {characterSheet.hindrances.map((hindrance) => (
      <div className="trait-card" key={hindrance.name}>
        <strong>{hindrance.name}</strong>

        <p>{hindrance.description}</p>
      </div>
    ))}
  </div>
</div>

                <div className="sheet-section">
          <h3>PODSTAWOWE STATYSTYKI</h3>

          <div className="stats-grid">
            <div className="stat-card">
              <span>TEMPO</span>
              <strong>{characterSheet.stats.pace}</strong>
            </div>

            <div className="stat-card">
              <span>OBRONA</span>
              <strong>{characterSheet.stats.parry}</strong>
            </div>

            <div className="stat-card">
              <span>WYTRZYMAŁOŚĆ</span>
              <strong>
  {characterSheet.stats.toughness}
  {characterSheet.stats.armor !== undefined &&
    ` (${characterSheet.stats.armor})`}
</strong>
            </div>
          </div>
        </div>

        <div className="sheet-section">
          <h3>STAN POSTACI</h3>

<div className="status-grid">

  <div className="status-card">
    <span>🟡 FUKSY</span>

    <div className="status-controls">
      <button
        onClick={() =>
          changeStatusValue('bennies', 'maxBennies', -1)
        }
      >
        −
      </button>

      <strong>
        {characterSheet.status.bennies} / {characterSheet.status.maxBennies}
      </strong>

      <button
        onClick={() =>
          changeStatusValue('bennies', 'maxBennies', 1)
        }
      >
        +
      </button>
    </div>
  </div>

 <div className="status-card">
  <span>🩸 RANY</span>

  <div className="status-controls">
    <button
      onClick={() =>
        changeStatusValue('wounds', 'maxWounds', -1)
      }
    >
      −
    </button>

    <strong>
      {characterSheet.status.wounds} / {characterSheet.status.maxWounds}
    </strong>

    <button
      onClick={() =>
        changeStatusValue('wounds', 'maxWounds', 1)
      }
    >
      +
    </button>
  </div>

  {characterSheet.status.bennies > 0 && (
    <button
  className="soak-button"
  onClick={() => {
    if (characterSheet.status.bennies <= 0) return

    changeStatusValue('bennies', 'maxBennies', -1)

    const result = performSoakRoll()

    setSoakResult(result)

    const vigor = characterSheet.attributes.find(
      (attribute) => attribute.name === 'Wigor'
    )

    addRollToHistory({
  type: 'soak',
  character: characterSheet.name,
  name: '🛡️ Wyparowanie',
  die: vigor?.die || '',
  result: result.chosenResult,
  outcome: getRollOutcome(result.chosenResult),
})
  }}
>
  🛡️ WYPAROWANIE
</button>
  )}
</div>

  <div className="status-card">
    <span>😫 ZMĘCZENIE</span>

    <div className="status-controls">
      <button
        onClick={() =>
          changeStatusValue('fatigue', 'maxFatigue', -1)
        }
      >
        −
      </button>

      <strong>
        {characterSheet.status.fatigue} / {characterSheet.status.maxFatigue}
      </strong>

      <button
        onClick={() =>
          changeStatusValue('fatigue', 'maxFatigue', 1)
        }
      >
        +
      </button>
    </div>
  </div>

  <div className="status-card shaken-card">
    <span>⚡ SZOK</span>

    <button
      className={
        characterSheet.status.shaken
          ? 'shaken-button active'
          : 'shaken-button'
      }
      onClick={toggleShaken}
    >
      {characterSheet.status.shaken ? 'SZOK: TAK' : 'SZOK: NIE'}
    </button>
  </div>
</div>
        </div>

      <div className="sheet-section">
  <h3>🎒 ZDOBYCZE</h3>

  <div className="traits-list">
    {characterSheet.loot.map((item, index) => (
  <div className="trait-card loot-card" key={`${item.name}-${index}`}>
    <strong>{item.name}</strong>

    <p>{item.description}</p>

    <div className="loot-item-actions">
      <button
  onClick={() => {
    setEditingLootIndex(index)
    setNewLootName(item.name)
    setNewLootDescription(item.description)
    setShowLootForm(true)
  }}
>
  ✏️ EDYTUJ
</button>

      <button
        onClick={() => {
          setCharacterSheet((currentSheet) => ({
            ...currentSheet,
            loot: currentSheet.loot.filter(
              (_, lootIndex) => lootIndex !== index
            ),
          }))
        }}
      >
        🗑️ USUŃ
      </button>
    </div>
  </div>
))}
  </div>

    <button
  className="add-loot-button"
  onClick={() => setShowLootForm(true)}
>
  ➕ DODAJ ZDOBYCZ
</button>

{showLootForm && (
  <div className="loot-form">
    <input
      type="text"
      placeholder="Nazwa zdobyczy"
      value={newLootName}
      onChange={(event) =>
        setNewLootName(event.target.value)
      }
    />

    <textarea
      placeholder="Opis / notatka"
      value={newLootDescription}
      onChange={(event) =>
        setNewLootDescription(event.target.value)
      }
    />

    <button
  onClick={() => {
    if (!newLootName.trim()) return

    setCharacterSheet((currentSheet) => {
      if (editingLootIndex !== null) {
        return {
          ...currentSheet,
          loot: currentSheet.loot.map((item, index) =>
            index === editingLootIndex
              ? {
                  ...item,
                  name: newLootName.trim(),
                  description: newLootDescription.trim(),
                }
              : item
          ),
        }
      }

      return {
        ...currentSheet,
        loot: [
          ...currentSheet.loot,
          {
            name: newLootName.trim(),
            description: newLootDescription.trim(),
          },
        ],
      }
    })

    setNewLootName('')
    setNewLootDescription('')
    setEditingLootIndex(null)
    setShowLootForm(false)
  }}
>
  {editingLootIndex !== null ? 'ZAPISZ ZMIANY' : 'DODAJ'}
</button>

    <button
      onClick={() => {
        setShowLootForm(false)
        setNewLootName('')
        setNewLootDescription('')
        setEditingLootIndex(null)
      }}
    >
      ANULUJ
    </button>
  </div>
)}

</div>

        <div className="sheet-section">
  <h3>EKWIPUNEK</h3>

  <div className="traits-list">
    {characterSheet.equipment.map((item, index) => (
      <div
  className={
    item.damage
      ? 'trait-card weapon-card'
      : 'trait-card equipment-card'
  }
  key={item.name}
>
        <strong>{item.name}</strong>

        <p>{item.description}</p>

        {item.range && (
  <p>
    📏 Zasięg: <strong>{item.range}</strong>
  </p>
)}

        {item.damage && (
          <p>
            💥 Obrażenia: <strong>{item.damage}</strong>
          </p>
        )}

        {item.ap !== undefined && (
  <p>
    🛡️ PP: <strong>{item.ap}</strong>
  </p>
)}

        {item.rateOfFire && (
          <p>
            🔥 Szybkostrzelność: <strong>{item.rateOfFire}</strong>
          </p>
        )}

{item.magazineSize !== undefined && (
  <div className="ammo-controls">
    <span>🔫 AMUNICJA</span>

    <div className="status-controls">
      <button
        onClick={() => changeAmmo(item.name, -1)}
      >
        −
      </button>

      <strong>
        {item.ammo} / {item.magazineSize}
      </strong>

      <button
        onClick={() => changeAmmo(item.name, 1)}
      >
        +
      </button>
    </div>
  </div>
)}

{item.damage && (
  <>
    <button
      className="roll-button"
      onClick={() => {
        const shootingSkill = characterSheet.skills.find(
          (skill) => skill.name === 'Strzelanie'
        )

        if (!shootingSkill) {
          alert('Postać nie ma umiejętności Strzelanie')
          return
        }

        setSelectedRoll({
  ...shootingSkill,
  weaponName: item.name,
  rateOfFire: item.rateOfFire ?? 1,
})
      }}
    >
      🔫 STRZAŁ
    </button>

    <button
      className="damage-button"
      onClick={() => {
        const result = rollDamageDice(item.damage)
        setDamageResult({
          ...result,
          weaponName: item.name,
        })
        addRollToHistory({
          type: 'damage',
          character: characterSheet.name,
          name: `💥 ${item.name}`,
          die: item.damage,
          result: result.total,
          outcome: 'OBRAŻENIA',
          pp: item.ap ?? 0,
        })
      }}
    >
      💥 RZUĆ OBRAŻENIA
    </button>
  </>
)}


      </div>
    ))}
  </div>
</div>

</section>
)
}

  function renderTabContent() {
    if (activeTab === 'card') {
  return (
    <div className="player-card-layout">
      <div className="player-card-column">
        {renderCard()}
      </div>

      <div className="player-rolls-column">
        {renderRecentRolls()}
      </div>
    </div>
  )
}

    if (activeTab === 'rolls') {
  return (
    <section className="tab-content">

  <div className="dice-roller">
    <h2>🎲 SZYBKI RZUT</h2>

    <div className="dice-buttons">
      {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((die) => (
        <button
          key={die}
          className={
            selectedDie === die
              ? 'die-button active'
              : 'die-button'
          }
          onClick={() => setSelectedDie(die)}
        >
          {die}
        </button>
      ))}
    </div>

   <button
  className="roll-button"
  onClick={() => {
    const sides = Number(selectedDie.replace('d', ''))

    const result = Math.floor(Math.random() * sides) + 1

    setDiceRollResult(result)

    addRollToHistory({
  type: 'quick',
  character: characterSheet.name,
  name: `🎲 Szybki rzut ${selectedDie}`,
  die: selectedDie,
  result: result,
  outcome: 'RZUT KOŚCIĄ',
})
  }}
>
  RZUĆ {selectedDie.toUpperCase()} 🎲
</button>
{diceRollResult !== null && (
  <div className="quick-roll-result">
    <p>WYNIK RZUTU</p>

    <strong>
      {selectedDie.toUpperCase()}: {diceRollResult}
    </strong>
  </div>
)}
  </div>

  <div className="history-header">
    <h2>🎲 HISTORIA RZUTÓW</h2>

    
  </div>

      {rollHistory.map((roll) => (
 <div
  className={`history-card roll-history-card roll-${roll.type || 'test'}`}
  key={roll.id}
>

  <div className="roll-header">

    <strong className="roll-character">
      👤 {roll.character}
    </strong>

    <span className="roll-type">
  {roll.outcome || 'OBRAŻENIA'}
</span>

  </div>

  <h3 className="roll-name">
  {roll.label || roll.name}
</h3>

 <div className="roll-details">

  {roll.diceResults ? (
    <>
      {roll.diceResults.map((dice, index) => (
        <span key={index}>
          🎲 <strong>{dice.label}</strong>:{' '}
          <strong>
            {dice.rolls.join(' + ')}
            {' = '}
            {dice.total}
          </strong>
        </span>
      ))}

      <span>
        💥 OBRAŻENIA:{' '}
        <strong>{roll.result}</strong>
      </span>
    </>
  ) : (
    <>
      <span>
        🎲 Kość:{' '}
        <strong>{roll.die || roll.dice}</strong>
      </span>

      <span>
        🎯 Wynik:{' '}
        <strong>{roll.result}</strong>
      </span>
    </>
  )}

  {roll.pp !== undefined && (
    <span>
      🛡️ PP: <strong>{roll.pp}</strong>
    </span>
  )}

</div>

</div>
      ))}
    </section>
  )
}

if (activeTab === 'initiative') {
  return (
    <section className="tab-content">
      <h2>🃏 INICJATYWA</h2>

      <p>Oczekuj na przygotowanie talii przez MG.</p>


      <p>
        Kart w talii: <strong>{initiativeDeck.length}</strong>
      </p>
    

  <button
  className="roll-button"
  disabled={initiativeDeck.length === 0}
  onClick={async () => {
  const drawnCard = initiativeDeck[0]

  if (!drawnCard) return

  const newDeck = initiativeDeck.slice(1)

  const newResults = [
    ...initiativeResults,
    {
      name: characterSheet.name,
      card: drawnCard,
    },
  ]


  try {
    await updateDoc(
      doc(db, 'gameState', 'initiative'),
      {
        deck: newDeck,
        results: newResults,
      }
    )

    setInitiativeName('')
  } catch (error) {
    console.error(
      'Błąd podczas ciągnięcia karty:',
      error
    )
  }
}}
>
  🃏 CIĄGNIJ KARTĘ
</button>

{initiativeResults.length > 0 && (

  <div className="initiative-results">

    <h3 className="initiative-results-title">
      🃏 WYCIĄGNIĘTE KARTY
    </h3>

    <div className="initiative-results-list">

      {sortInitiativeResults(initiativeResults).map(
        (participant, index) => (

          <div
            className="initiative-result-row initiative-player-row"
            key={`${participant.name}-${index}`}
          >

            <div className="initiative-result-position">
              {index + 1}
            </div>

            <div className="initiative-result-name">
              👤 {participant.name}
            </div>

            <div className="initiative-result-card">
              {participant.card === '🃏 JOKER'
                ? '🃏 JOKER!'
                : `🃏 ${participant.card}`}
            </div>

            {participant.card === '🃏 JOKER' && (
  <div className="initiative-joker-message">
    <strong>🃏 JOKER!</strong>
    <p>
      Postać może działać w dowolnym momencie rundy,
      nawet przerywając akcję kogoś innego.
    </p>
    <p>
      Ponadto otrzymuje w tej rundzie
      <strong> +2 do testów Cech i do obrażeń.</strong>
    </p>
  </div>
)}

          </div>

        )
      )}

    </div>

  </div>

)}

    </section>
  )
}

    if (activeTab === 'gallery') {
  return (
    <section className="tab-content">

      <div className="player-gallery-workspace">

  <div className="player-gallery-column">

    <h2>🖼️ GALERIA</h2>

    {sharedGalleryImages.length > 0 ? (

      ['Postacie', 'NPC', 'Lokacje', 'Mapy', 'Inne'].map(
        (category) => {

          const imagesInCategory = sharedGalleryImages
            .filter(
              (image) =>
                (image.category || 'Inne') === category
            )
            .sort((a, b) =>
              a.title.localeCompare(
                b.title,
                'pl',
                { sensitivity: 'base' }
              )
            )

          if (imagesInCategory.length === 0) {
            return null
          }

          return (
            <div
              key={category}
              className="gallery-category"
            >

              <h3>
                📁 {category.toUpperCase()}
              </h3>

              <div className="gallery-image-grid">

                {imagesInCategory.map((image) => (

                  <div
                    className="gallery-player-view"
                    key={image.id}
                  >

                    <h3>{image.title}</h3>

                    <img
                      src={image.url}
                      alt={image.title}
                      onClick={() =>
                        setSelectedGalleryImage(image)
                      }
                    />

                  </div>

                ))}

              </div>

            </div>
          )
        }
      )

    ) : (

      <p>
        🙈 MG nie udostępnił obecnie żadnych grafik.
      </p>

    )}

  </div>

  <div className="player-game-map-column">

    {selectedGameMap ? (

      <>
        <div className="player-game-map-header">
          <h3>
            🗺️ {selectedGameMap.title}
          </h3>
        </div>

        <div className="player-game-map-image">
  <div className="game-map-canvas">
    {mapMarkers.map((marker) => (
      <div
        key={marker.id}
        className="map-marker"
        style={{
          left: `${marker.x}%`,
          top: `${marker.y}%`,
        }}
      >
        {marker.text}
      </div>
    ))}

    <img
      src={selectedGameMap.url}
      alt={selectedGameMap.title}
      className="game-map-image"
    />
  </div>
</div>
      </>

    ) : (

      <div className="player-game-map-empty">
        <h3>🗺️ MAPA GRY</h3>
        <p>MG nie wybrał jeszcze mapy.</p>
      </div>

    )}

  </div>

</div>

{selectedGalleryImage && (
  <div
    className="gallery-fullscreen-overlay"
    onClick={() => setSelectedGalleryImage(null)}
  >
    <div
      className="gallery-fullscreen-content"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="clear-history-button"
        onClick={() => setSelectedGalleryImage(null)}
      >
        ✖ ZAMKNIJ
      </button>

      <h2>{selectedGalleryImage.title}</h2>

      <img
        src={selectedGalleryImage.url}
        alt={selectedGalleryImage.title}
        style={{
          maxWidth: '95vw',
          maxHeight: '85vh',
          borderRadius: '8px',
        }}
      />
    </div>
  </div>
)}


    </section>
  )
}
  }

  if (selectedCharacter && activeCharacterName) {

  return (
        <main className="dashboard player-dashboard">
          <header className="topbar">
            <div className="logo">SAVAGE TABLE</div>

            <div className="user-area">
              <span>{selectedCharacter.name}</span>

              <button
                className="logout-button"
                onClick={logout}
              >
                Wyloguj
              </button>
            </div>
          </header>

          <nav className="tabs">
            <button
              className={activeTab === 'card' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('card')}
            >
              🎭 KARTA
            </button>

            <button
              className={activeTab === 'rolls' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('rolls')}
            >
              🎲 RZUTY
            </button>

          <button
              className={activeTab === 'initiative' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('initiative')}
>
             🃏 INICJATYWA
            </button>

            <button
              className={activeTab === 'gallery' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('gallery')}
            >
              🖼️ GALERIA
            </button>
          </nav>

          <div className="dashboard-content player-dashboard-content">
            {renderTabContent()}
          </div>

    {selectedRoll && (
  <div className="roll-modal-overlay">
    <div className="roll-modal">
      <h2>🎲 {selectedRoll.name}</h2>

      {selectedRoll.weaponName &&
  selectedRoll.rateOfFire > 1 &&
  !rollResult && 
  !burstResult && (
    <div className="burst-controls">
      <h3>🔥 WYBIERZ DŁUGOŚĆ SERII</h3>

      <div className="burst-buttons">
        {Array.from(
          { length: selectedRoll.rateOfFire - 1 },
          (_, index) => index + 2
        ).map((burstSize) => {
          const ammoCost = getBurstAmmoCost(burstSize)

          return (
            <button
              key={burstSize}
              type="button"
              className="roll-button"
              disabled={ammoCost > characterSheet.equipment.find(
                (item) =>
                  item.name === selectedRoll.weaponName
              )?.ammo}
           onClick={() => {
  setBurstSize(burstSize)
  setBurstResult(null)
}}
            >
              🔥 ×{burstSize}
              <br />
              <small>
                {ammoCost} pocisków
              </small>
            </button>
          )
        })}
      </div>
    </div>
  )}

{burstSize && !burstResult && (
  <div className="burst-roll-controls">
    <h3>🔥 SERIA ×{burstSize}</h3>

    <p>
      Zużycie amunicji:{' '}
      <strong>{getBurstAmmoCost(burstSize)}</strong>
    </p>

    <div className="modifier-control">
      <label htmlFor="burst-modifier">
        Modyfikator
      </label>

      <input
        id="burst-modifier"
        type="number"
        value={rollModifier}
        onChange={(event) =>
          setRollModifier(Number(event.target.value))
        }
      />
    </div>

    <button
      type="button"
      className="roll-button"
      onClick={async () => {
  const ammoCost = getBurstAmmoCost(burstSize)

  const weaponIndex = characterSheet.equipment.findIndex(
    (item) => item.name === selectedRoll.weaponName
  )

  if (weaponIndex === -1) {
    alert('Nie znaleziono broni')
    return
  }

  const weapon = characterSheet.equipment[weaponIndex]

  if ((weapon.ammo ?? 0) < ammoCost) {
    alert('Za mało amunicji')
    return
  }

  const result = performBurstRoll(burstSize)

  const updatedEquipment = characterSheet.equipment.map(
    (item, index) =>
      index === weaponIndex
        ? {
            ...item,
            ammo: item.ammo - ammoCost,
          }
        : item
  )

  const updatedCharacter = {
    ...characterSheet,
    equipment: updatedEquipment,
  }

  setCharacterSheet(updatedCharacter)

  localStorage.setItem(
    getCharacterStorageKey(characterSheet.storageName),
    JSON.stringify(updatedCharacter)
  )

  await saveCharacterToFirestore(updatedCharacter)

 setBurstResult(result)

addRollToHistory({
  type: 'burst',
  character: characterSheet.name,
  name: `🔥 ${selectedRoll.weaponName} — SERIA ×${burstSize}`,
  die: selectedRoll.die,
  result: result.successCount,
  outcome: `${result.successCount} TRAFIENIA`,
  modifier: result.modifier,
  shots: result.shots.map((shot, index) => ({
    shot: index + 1,
    result: shot.finalResult,
  })),
  wildResult:
    result.wildResult.total + result.modifier,
  raises: result.raiseCount,
})
}}
    >
      🔥 RZUĆ SERIĘ ×{burstSize}
    </button>
  </div>
)}


{!burstResult && (
  <>
    <p>
      Kość: <strong>{selectedRoll.die}</strong>
    </p>

    <p>
      Wild Die: <strong>d6</strong>
    </p>
  </>
)}

{burstResult && (
  <div className="roll-result">
    <div className="roll-result-card">
      <div className="result-card-header">
        🔥 SERIA ×{burstSize}
      </div>

      <div className="result-rows">
        {burstResult.shots.map((shot, index) => (
          <p key={index}>
            <span>🎲 Strzał {index + 1}</span>
            <strong>
              {shot.rolls.join(' + ')}
              {' = '}
              {shot.finalResult}
            </strong>
          </p>
        ))}

        <p>
          <span>🃏 Wild Die</span>
          <strong>
            {burstResult.wildResult.rolls.join(' + ')}
            {' = '}
            {burstResult.wildResult.total +
              burstResult.modifier}
          </strong>
        </p>

        <p>
          <span>🎯 Trafienia</span>
          <strong>{burstResult.successCount}</strong>
        </p>

        <p>
          <span>🏆 Podbicia</span>
          <strong>{burstResult.raiseCount}</strong>
        </p>
      </div>

      <div className="final-result-box">
        <span>TRAFIENIA W SERII</span>
        <strong>{burstResult.successCount}</strong>
      </div>
    </div>
  </div>
)}

{burstResult &&
  !burstRerollResult &&
  characterSheet.status.bennies > 0 && (
    <button
      type="button"
      className="reroll-button"
      onClick={() => {
        changeStatusValue('bennies', 'maxBennies', -1)
        rerollBurst()
      }}
    >
      🟡 WYDAJ FUKSA – PRZERZUĆ SERIĘ
    </button>
  )}

  {burstRerollResult && (
  <div className="reroll-result reroll-result-card">
    <div className="result-card-header reroll-header">
      🟡 PRZERZUT SERII
    </div>

    <div className="reroll-compact-results">
      <div className="reroll-compare-row">
        <span>🔥 STARA SERIA</span>
        <strong>
          {burstResult.successCount}
        </strong>
      </div>

      <div className="reroll-compare-row">
        <span>🟡 NOWA SERIA</span>
        <strong>
          {burstRerollResult.successCount}
        </strong>
      </div>
    </div>

    <div className="reroll-choice-buttons">
     <button
  className="keep-old-button"
  type="button"
  onClick={() => {
    addRollToHistory({
  type: 'burst-reroll',
  character: characterSheet.name,
  name: `🟡 Fuks — ${selectedRoll.weaponName} — SERIA ×${burstSize}`,
  die: selectedRoll.die,
  result: burstResult.successCount,
  outcome: `${burstResult.successCount} TRAFIENIA`,
  oldResult: burstResult.successCount,
  newResult: burstRerollResult.successCount,
  chosenResult: burstResult.successCount,
})

    setBurstRerollResult(null)
  }}
>
  ← ZOSTAW {burstResult.successCount}
</button>

     <button
  className="keep-new-button"
  type="button"
  onClick={() => {
   addRollToHistory({
  type: 'burst-reroll',
  character: characterSheet.name,
  name: `🟡 Fuks — ${selectedRoll.weaponName} — SERIA ×${burstSize}`,
  die: selectedRoll.die,
  result: burstRerollResult.successCount,
  outcome: `${burstRerollResult.successCount} TRAFIENIA`,
  oldResult: burstResult.successCount,
  newResult: burstRerollResult.successCount,
  chosenResult: burstRerollResult.successCount,
})

    setBurstResult(burstRerollResult)
    setBurstRerollResult(null)
  }}
>
  WYBIERZ {burstRerollResult.successCount} →
</button>
    </div>
  </div>
)}

      {!rollResult && !burstSize && (
  <>
    <div className="modifier-control">

      <label htmlFor="roll-modifier">
        Modyfikator
      </label>

      <input
        id="roll-modifier"
        type="number"
        value={rollModifier}
        onChange={(event) =>
          setRollModifier(Number(event.target.value))
        }
      />

    </div>

   <button
  className="roll-button"
  onClick={async () => {
    const weaponIndex = characterSheet.equipment.findIndex(
      (item) => item.name === selectedRoll.weaponName
    )

    if (weaponIndex !== -1) {
      const weapon = characterSheet.equipment[weaponIndex]

      // Jeśli broń ma magazynek, zwykły strzał zużywa 1 nabój.
      if (weapon.magazineSize !== undefined) {
        if ((weapon.ammo ?? 0) < 1) {
          alert('Brak amunicji')
          return
        }

        const updatedEquipment = characterSheet.equipment.map(
          (item, index) =>
            index === weaponIndex
              ? {
                  ...item,
                  ammo: item.ammo - 1,
                }
              : item
        )

        const updatedCharacter = {
          ...characterSheet,
          equipment: updatedEquipment,
        }

        setCharacterSheet(updatedCharacter)

        localStorage.setItem(
          getCharacterStorageKey(characterSheet.storageName),
          JSON.stringify(updatedCharacter)
        )

        await saveCharacterToFirestore(updatedCharacter)
      }
    }

    const result = performRoll()

    setRerollResult(null)
    setChosenFinalResult(null)
    setRollResult(result)
    setBurstSize(null)
    setBurstResult(null)

    addRollToHistory({
      type: 'test',
      character: characterSheet.name,
      name: selectedRoll.name,
      die: selectedRoll.die,
      result: result.finalResult,
      outcome: getRollOutcome(result.finalResult),
    })
  }}
>
  RZUĆ 🎲
</button>
  </>
)}

{rollResult && (
  <div className="roll-result">

    <div className="roll-result-card">
      <div className="result-card-header">
        🎯 PIERWSZY RZUT
      </div>

      <div className="result-rows">
        <p>
          <span>Kość umiejętności</span>
          <strong>
            {rollResult.traitResult.rolls.join(' + ')}
            {' = '}
            {rollResult.traitResult.total}
          </strong>
        </p>

        <p>
          <span>Wild Die</span>
          <strong>
            {rollResult.wildResult.rolls.join(' + ')}
            {' = '}
            {rollResult.wildResult.total}
          </strong>
        </p>

        <p>
          <span>Wybrany wynik</span>
          <strong>{rollResult.chosenResult}</strong>
        </p>

        <p>
          <span>Modyfikator</span>
          <strong>
            {rollResult.modifier >= 0
              ? `+${rollResult.modifier}`
              : rollResult.modifier}
          </strong>
        </p>
      </div>

      <div className="final-result-box">
        <span>WYNIK KOŃCOWY</span>
        <strong>{rollResult.finalResult}</strong>
      </div>

      <div
  className={`roll-outcome ${getRollOutcomeClass(
    rollResult.finalResult
  )}`}
>
  {getRollOutcome(rollResult.finalResult)}
</div>
    </div>

    {characterSheet.status.bennies > 0 && !rerollResult && (
      <button
        className="reroll-button"
        onClick={() => {

          changeStatusValue('bennies', 'maxBennies', -1)

          const result = performRoll()

          setRerollResult(result)

          addRollToHistory({
            type: 'reroll',
            character: characterSheet.name,
            name: `🟡 Przerzut Fuksem — ${selectedRoll.name}`,
            die: selectedRoll.die,
            result: result.finalResult,
            outcome: getRollOutcome(result.finalResult),
          })
        }}
      >
        🟡 WYDAJ FUKSA – PRZERZUĆ
      </button>
    )}

    {rerollResult && (
  <div className="reroll-result reroll-result-card">

    <div className="result-card-header reroll-header">
      🟡 PRZERZUT ZA FUKSA
    </div>

    <div className="reroll-compact-results">

      <div className="reroll-compare-row">
        <span>🎯 STARY WYNIK</span>
        <strong>{rollResult.finalResult}</strong>
      </div>

      <div className="reroll-compare-row">
        <span>🟡 NOWY WYNIK</span>
        <strong>{rerollResult.finalResult}</strong>
      </div>

    </div>

    <div className="reroll-choice-buttons">
      <button
        className="keep-old-button"
        onClick={() => {
          setChosenFinalResult(rollResult.finalResult)
          setRerollResult(null)
        }}
      >
        ← ZOSTAW {rollResult.finalResult}
      </button>

      <button
        className="keep-new-button"
        onClick={() => {
          setRollResult(rerollResult)
          setChosenFinalResult(rerollResult.finalResult)
          setRerollResult(null)
        }}
      >
        WYBIERZ {rerollResult.finalResult} →
      </button>
    </div>

  </div>
)}

{chosenFinalResult !== null && (
  <div className="chosen-final-result">
    <span>✅ WYBRANO WYNIK</span>
    <strong>{chosenFinalResult}</strong>
  </div>
)}

  </div>
)}
      <button
        className="modal-close-button"
        onClick={() => {
          setSelectedRoll(null)
          setRollModifier(0)
          setRollResult(null)
          setChosenFinalResult(null)
          setBurstSize(null)
          setBurstResult(null)
          setBurstRerollResult(null)
}}
      >
        ZAMKNIJ
      </button>
    </div>
  </div>
)}

{soakResult && (
  <div className="roll-modal-overlay">
    <div className="roll-modal">
      <h2>🛡️ WYPAROWANIE</h2>

      <p>
        Wigor:{' '}
        <strong>
          {soakResult.vigorResult.rolls.join(' + ')}
          {' = '}
          {soakResult.vigorResult.total}
        </strong>
      </p>

      <p>
        Wild Die:{' '}
        <strong>
          {soakResult.wildResult.rolls.join(' + ')}
          {' = '}
          {soakResult.wildResult.total}
        </strong>
      </p>

      <p>
        Wybrany wynik:{' '}
        <strong>{soakResult.chosenResult}</strong>
      </p>

      <p className="final-result">
        WYNIK WYPAROWANIA:{' '}
        <strong>{soakResult.chosenResult}</strong>
      </p>

      <p className="roll-outcome">
        {getRollOutcome(soakResult.chosenResult)}
      </p>

      <button
        className="modal-close-button"
        onClick={() => setSoakResult(null)}
      >
        ZAMKNIJ
      </button>
    </div>
  </div>
)}

{damageResult && (
  <div className="roll-modal-overlay">
    <div className="roll-modal">
      <h2>💥 OBRAŻENIA</h2>

      <h3>{damageResult.weaponName}</h3>

      <p>
        Kości obrażeń: <strong>{damageResult.damage}</strong>
      </p>

      {damageResult.diceResults.map((dieResult, index) => (
  <p key={index}>
    {dieResult.label || `Kość ${index + 1}`}:{' '}
    <strong>
      {dieResult.rolls.join(' + ')}
      {' = '}
      {dieResult.total}
    </strong>
  </p>
))}

      <p className="final-result">
        ŁĄCZNE OBRAŻENIA:{' '}
        <strong>{damageResult.total}</strong>
      </p>

      <button
        className="modal-close-button"
        onClick={() => setDamageResult(null)}
      >
        ZAMKNIJ
      </button>
    </div>
  </div>
)}

               </main>
      )
  }

  if (selectedCharacter) {
    return (
      <main className="app">

        <section className="welcome-panel login-panel">
          <p className="eyebrow">SAVAGE TABLE</p>

          <h1>{selectedCharacter.name}</h1>

          <p className="subtitle">Podaj PIN swojej postaci</p>

          <input
            className="pin-input"
            type="password"
            inputMode="numeric"
            maxLength="4"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                loginCharacter()
              }
            }}
            placeholder="••••"
            autoFocus
          />

          {error && <p className="error-message">{error}</p>}

          <button className="login-button" onClick={loginCharacter}>
            WEJDŹ
          </button>

         <button className="back-button" onClick={goBack}>
  ← Wróć
</button>

      </section>
    </main>
  )
}

if (isGmLoggedIn) {
  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="logo">SAVAGE TABLE</div>

        <div className="user-area">
          <span>👑 MISTRZ GRY</span>

          <button
            className="logout-button"
            onClick={logoutGm}
          >
            Wyloguj
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={
            gmActiveTab === 'characters'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setGmActiveTab('characters')}
        >
          👥 POSTACIE
        </button>


        <button
  className={
    gmActiveTab === 'npcs'
      ? 'tab active'
      : 'tab'
  }
  onClick={() => setGmActiveTab('npcs')}
>
  👤 NPC
</button>  



          <button
  className={
    gmActiveTab === 'rolls'
      ? 'tab active'
      : 'tab'
  }
  onClick={() => setGmActiveTab('rolls')}
>
  🎲 RZUTY
</button>

  


        <button
          className={
            gmActiveTab === 'initiative'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setGmActiveTab('initiative')}
        >
          🃏 INICJATYWA
        </button>

        <button
          className={
            gmActiveTab === 'gallery'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setGmActiveTab('gallery')}
        >
          🖼️ GALERIA
        </button>

        <button
          className={
            gmActiveTab === 'notes'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setGmActiveTab('notes')}
        >
          📝 NOTATKI MG
        </button>
      </nav>

      <div className="dashboard-content">
       {gmActiveTab === 'characters' && !gmSelectedCharacter && (
  <section className="tab-content">
    <h2>👥 POSTACIE GRACZY</h2>

    <div className="character-grid">
      {getAllCharactersForGm().map((character) => (
        <div
          className="character-button"
          key={character.name}
        >
          <h3>{character.name}</h3>

          <p>
            <strong>Gracz:</strong> {character.player}
          </p>

          <p>
            <strong>Ranga:</strong> {character.rank}
          </p>

         <button
  className="login-button"
  onClick={() => {
    setGmSelectedCharacter(character)
    setIsGmEditingCharacter(false)
  }}
>
  👁️ PODGLĄD
</button>
        </div>
      ))}
        </div>

    <h2>📊 STATUS DRUŻYNY</h2>

<div className="gm-resources-card">

  <h3>👑 ZASOBY MG</h3>

  <div className="gm-edit-row">

  <strong>👑 🟡 Fuksy MG:</strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const newBennies = Math.max(0, gmBennies - 1)

      try {
        await setDoc(
          doc(db, 'gameState', 'gmBennies'),
          {
            count: newBennies,
          }
        )
      } catch (error) {
        console.error(
          'Błąd podczas zmiany Fuksów MG:',
          error
        )
      }
    }}
  >
    ➖
  </button>

  <strong>{gmBennies}</strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const newBennies = gmBennies + 1

      try {
        await setDoc(
          doc(db, 'gameState', 'gmBennies'),
          {
            count: newBennies,
          }
        )
      } catch (error) {
        console.error(
          'Błąd podczas zmiany Fuksów MG:',
          error
        )
      }
    }}
  >
    ➕
  </button>
</div>
</div>


    <div className="gm-team-status">
      {getAllCharactersForGm().map((character) => {
        const status = character.status

        return (
          <div
            key={`status-${character.name}`}
            className="gm-team-status-card"
          >
            <h3>{character.name}</h3>

            <div className="gm-edit-row">
  <strong>🟡 Fuksy:</strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const newBennies = Math.max(
        0,
        (status?.bennies ?? 0) - 1
      )

      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          bennies: newBennies,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)
      
      setGmRefresh((current) => current + 1)

    }}
  >
    ➖
  </button>

  <strong>
    {status?.bennies ?? 0}/{status?.maxBennies ?? 0}
  </strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const maxBennies = status?.maxBennies ?? 3

      const newBennies = Math.min(
        maxBennies,
        (status?.bennies ?? 0) + 1
      )

      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          bennies: newBennies,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)

      setGmRefresh((current) => current + 1)
      
    }}
  >
    ➕
  </button>
</div>

            <div className="gm-edit-row">
  <strong>❤️ Rany:</strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const newWounds = Math.max(
        0,
        (status?.wounds ?? 0) - 1
      )

      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          wounds: newWounds,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)

      setGmRefresh((current) => current + 1)
    }}
  >
    ➖
  </button>

  <strong>
    {status?.wounds ?? 0}/{status?.maxWounds ?? 0}
  </strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const maxWounds = status?.maxWounds ?? 3

      const newWounds = Math.min(
        maxWounds,
        (status?.wounds ?? 0) + 1
      )

      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          wounds: newWounds,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)

      setGmRefresh((current) => current + 1)
    }}
  >
    ➕
  </button>
</div>

            <div className="gm-edit-row">
  <strong>😵 Zmęczenie:</strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const newFatigue = Math.max(
        0,
        (status?.fatigue ?? 0) - 1
      )

      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          fatigue: newFatigue,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)

      setGmRefresh((current) => current + 1)
    }}
  >
    ➖
  </button>

  <strong>
    {status?.fatigue ?? 0}/{status?.maxFatigue ?? 0}
  </strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const maxFatigue = status?.maxFatigue ?? 2

      const newFatigue = Math.min(
        maxFatigue,
        (status?.fatigue ?? 0) + 1
      )

      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          fatigue: newFatigue,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)

      setGmRefresh((current) => current + 1)
    }}
  >
    ➕
  </button>
</div>

            <div className="gm-edit-row">
  <strong>⚡ Szok:</strong>

  <strong>
    {status?.shaken ? 'TAK' : 'NIE'}
  </strong>

  <button
    type="button"
    className="back-button"
    onClick={async () => {
      const updatedCharacter = {
        ...character,
        status: {
          ...status,
          shaken: !status?.shaken,
        },
      }

      localStorage.setItem(
        getCharacterStorageKey(character.storageName),
        JSON.stringify(updatedCharacter)
      )

      await saveCharacterToFirestore(updatedCharacter)

      setGmRefresh((current) => current + 1)
    }}
  >
    {status?.shaken ? '⚡ USUŃ SZOK' : '⚡ DAJ SZOK'}
  </button>
</div>
          </div>
        )
      })}
    </div>

  </section>

)}


{gmActiveTab === 'characters' && gmSelectedCharacter && (
  <section className="tab-content">
    <button
      className="back-button"
      onClick={() => setGmSelectedCharacter(null)}
    >
      ← Wróć do listy
    </button>

    <button
  className="login-button"
  onClick={() => {
    setGmEditName(gmSelectedCharacter.name || '')
    setGmEditPlayer(gmSelectedCharacter.player || '')
    setGmEditRace(gmSelectedCharacter.race || '')
    setGmEditConcept(gmSelectedCharacter.concept || '')
    setGmEditRank(gmSelectedCharacter.rank || '')
    setGmEditAdvancements(gmSelectedCharacter.advancements || 0)

    setGmEditStats(
  gmSelectedCharacter.stats
    ? { ...gmSelectedCharacter.stats }
    : {
        pace: 6,
        parry: 5,
        toughness: 5,
        armor: 0,
      }
)

    setGmEditAttributes(
  gmSelectedCharacter.attributes
    ? [...gmSelectedCharacter.attributes]
    : []
)

    setGmEditSkills(
  gmSelectedCharacter.skills
    ? [...gmSelectedCharacter.skills]
    : []
)

    setGmEditEdges(
  gmSelectedCharacter.edges
    ? [...gmSelectedCharacter.edges]
    : []
)

   setGmEditHindrances(
  gmSelectedCharacter.hindrances
    ? [...gmSelectedCharacter.hindrances]
    : []
)

setGmEditEquipment(
  gmSelectedCharacter.equipment
    ? [...gmSelectedCharacter.equipment]
    : []
)

setGmEditStatus(
  gmSelectedCharacter.status
    ? { ...gmSelectedCharacter.status }
    : {
        bennies: 3,
        maxBennies: 3,
        wounds: 0,
        maxWounds: 3,
        fatigue: 0,
        maxFatigue: 2,
        shaken: false,
      }
)

    setIsGmEditingCharacter(true)
  }}
>
  ✏️ EDYTUJ POSTAĆ
</button>

{isGmEditingCharacter && (
  <div className="loot-form">
    <h3>✏️ EDYCJA POSTACI</h3>

    <label>Imię postaci</label>

<input
  type="text"
  value={gmEditName}
  onChange={(event) =>
    setGmEditName(event.target.value)
  }
/>

    <label>Gracz</label>
    <input
      type="text"
      value={gmEditPlayer}
      onChange={(event) =>
        setGmEditPlayer(event.target.value)
      }
    />

    <label>Rasa</label>
    <input
      type="text"
      value={gmEditRace}
      onChange={(event) =>
        setGmEditRace(event.target.value)
      }
    />

    <label>Koncept</label>
    <input
      type="text"
      value={gmEditConcept}
      onChange={(event) =>
        setGmEditConcept(event.target.value)
      }
    />

    <label>Rozwinięcia</label>

<input
  type="number"
  value={gmEditAdvancements}
  onChange={(event) =>
    setGmEditAdvancements(Number(event.target.value))
  }
/>

<h3>🛡️ WARTOŚCI</h3>

<label>Tempo</label>
<input
  type="number"
  value={gmEditStats.pace}
  onChange={(event) =>
    setGmEditStats({
      ...gmEditStats,
      pace: Number(event.target.value),
    })
  }
/>

<label>Obrona</label>
<input
  type="number"
  value={gmEditStats.parry}
  onChange={(event) =>
    setGmEditStats({
      ...gmEditStats,
      parry: Number(event.target.value),
    })
  }
/>

<label>Wytrzymałość</label>
<input
  type="number"
  value={gmEditStats.toughness}
  onChange={(event) =>
    setGmEditStats({
      ...gmEditStats,
      toughness: Number(event.target.value),
    })
  }
/>

<label>🛡️ Pancerz</label>
<input
  type="number"
  value={gmEditStats.armor ?? 0}
  onChange={(event) =>
    setGmEditStats({
      ...gmEditStats,
      armor: Number(event.target.value),
    })
  }
/>

<h3>📊 ATRYBUTY</h3>

{gmEditAttributes.map((attribute, index) => (
  <div
    key={attribute.name}
    className="gm-edit-row"
  >
    <label>{attribute.name}</label>

    <select
      value={attribute.die}
      onChange={(event) => {
        const updatedAttributes = [...gmEditAttributes]

        updatedAttributes[index] = {
          ...updatedAttributes[index],
          die: event.target.value,
        }

        setGmEditAttributes(updatedAttributes)
      }}
    >
      <option value="d4">d4</option>
      <option value="d6">d6</option>
      <option value="d8">d8</option>
      <option value="d10">d10</option>
      <option value="d12">d12</option>
    </select>
  </div>
))}

  <h3>🎯 UMIEJĘTNOŚCI</h3>

{gmEditSkills.map((skill, index) => (
  <div
    key={index}
    className="gm-edit-row"
  >
    <input
  type="text"
  value={skill.name}
  onChange={(event) => {
    const updatedSkills = [...gmEditSkills]

    updatedSkills[index] = {
      ...updatedSkills[index],
      name: event.target.value,
    }

    setGmEditSkills(updatedSkills)
  }}
/>

    <select
      value={skill.die}
      onChange={(event) => {
        const updatedSkills = [...gmEditSkills]

        updatedSkills[index] = {
          ...updatedSkills[index],
          die: event.target.value,
        }

        setGmEditSkills(updatedSkills)
      }}
    >
      <option value="d4">d4</option>
      <option value="d6">d6</option>
      <option value="d8">d8</option>
      <option value="d10">d10</option>
      <option value="d12">d12</option>
    </select>

      <button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditSkills(
      gmEditSkills.filter((_, skillIndex) => skillIndex !== index)
    )
  }}
>
  🗑️
</button>

  </div>
))}

  <button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditSkills([
      ...gmEditSkills,
      {
        name: 'Nowa umiejętność',
        die: 'd4',
      },
    ])
  }}
>
  ➕ DODAJ UMIEJĘTNOŚĆ
</button>
    
  <h3>🏅 PRZEWAGI</h3>

{gmEditEdges.map((edge, index) => (
  <div
    key={index}
    className="gm-edit-row"
  >
    <input
      type="text"
      placeholder="Nazwa Przewagi"
      value={edge.name}
      onChange={(event) => {
        const updatedEdges = [...gmEditEdges]

        updatedEdges[index] = {
          ...updatedEdges[index],
          name: event.target.value,
        }

        setGmEditEdges(updatedEdges)
      }}
    />

    <textarea
      placeholder="Opis Przewagi"
      value={edge.description}
      onChange={(event) => {
        const updatedEdges = [...gmEditEdges]

        updatedEdges[index] = {
          ...updatedEdges[index],
          description: event.target.value,
        }

        setGmEditEdges(updatedEdges)
      }}
    />

    <button
      type="button"
      className="back-button"
      onClick={() => {
        setGmEditEdges(
          gmEditEdges.filter((_, edgeIndex) => edgeIndex !== index)
        )
      }}
    >
      🗑️
    </button>
  </div>
))}

<button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditEdges([
      ...gmEditEdges,
      {
        name: '',
        description: '',
      },
    ])
  }}
>
  ➕ DODAJ PRZEWAGĘ
</button>


<h3>⚠️ ZAWADY</h3>

{gmEditHindrances.map((hindrance, index) => (
  <div
    key={index}
    className="gm-edit-row"
  >
    <input
      type="text"
      placeholder="Nazwa Zawady"
      value={hindrance.name}
      onChange={(event) => {
        const updatedHindrances = [...gmEditHindrances]

        updatedHindrances[index] = {
          ...updatedHindrances[index],
          name: event.target.value,
        }

        setGmEditHindrances(updatedHindrances)
      }}
    />

    <textarea
      placeholder="Opis Zawady"
      value={hindrance.description}
      onChange={(event) => {
        const updatedHindrances = [...gmEditHindrances]

        updatedHindrances[index] = {
          ...updatedHindrances[index],
          description: event.target.value,
        }

        setGmEditHindrances(updatedHindrances)
      }}
    />

    <button
      type="button"
      className="back-button"
      onClick={() => {
        setGmEditHindrances(
          gmEditHindrances.filter(
            (_, hindranceIndex) => hindranceIndex !== index
          )
        )
      }}
    >
      🗑️
    </button>
  </div>
))}

<button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditHindrances([
      ...gmEditHindrances,
      {
        name: '',
        description: '',
      },
    ])
  }}
>
  ➕ DODAJ ZAWADĘ
</button>

<h3>🎒 EKWIPUNEK</h3>

{gmEditEquipment.map((item, index) => (
  <div
    key={index}
    className="gm-edit-row"
  >
    <input
      type="text"
      placeholder="Nazwa przedmiotu"
      value={item.name}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          name: event.target.value,
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

    <textarea
      placeholder="Opis przedmiotu"
      value={item.description || ''}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          description: event.target.value,
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

      {item.damage !== undefined && (
  <>
    <input
      type="text"
      placeholder="Zasięg np. 10/20/40"
      value={item.range || ''}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          range: event.target.value,
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

    <input
      type="text"
      placeholder="Obrażenia np. 2d6"
      value={item.damage || ''}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          damage: event.target.value,
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

    <input
      type="number"
      placeholder="Szybkostrzelność"
      value={item.rateOfFire ?? 1}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          rateOfFire: Number(event.target.value),
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

    <input
      type="number"
      placeholder="PP"
      value={item.ap ?? 0}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          ap: Number(event.target.value),
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

    <input
      type="number"
      placeholder="Pojemność magazynka"
      value={item.magazineSize ?? 0}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          magazineSize: Number(event.target.value),
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />

    <input
      type="number"
      placeholder="Aktualna amunicja"
      value={item.ammo ?? 0}
      onChange={(event) => {
        const updatedEquipment = [...gmEditEquipment]

        updatedEquipment[index] = {
          ...updatedEquipment[index],
          ammo: Number(event.target.value),
        }

        setGmEditEquipment(updatedEquipment)
      }}
    />
  </>
)}

      <button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditEquipment(
      gmEditEquipment.filter(
        (_, equipmentIndex) => equipmentIndex !== index
      )
    )
  }}
>

  🗑️
</button>

  </div>
))}

<h3>❤️ STATUS POSTACI</h3>

{gmEditStatus && (
  <div className="gm-status-editor">

    <div className="gm-edit-row">
      <label>🟡 Fuksy</label>

      <input
        type="number"
        min="0"
        value={gmEditStatus.bennies}
        onChange={(event) =>
          setGmEditStatus({
            ...gmEditStatus,
            bennies: Number(event.target.value),
          })
        }
      />

      <span>/ {gmEditStatus.maxBennies}</span>
    </div>

    <div className="gm-edit-row">
      <label>❤️ Rany</label>

      <input
        type="number"
        min="0"
        value={gmEditStatus.wounds}
        onChange={(event) =>
          setGmEditStatus({
            ...gmEditStatus,
            wounds: Number(event.target.value),
          })
        }
      />

      <span>/ {gmEditStatus.maxWounds}</span>
    </div>

    <div className="gm-edit-row">
      <label>😵 Zmęczenie</label>

      <input
        type="number"
        min="0"
        value={gmEditStatus.fatigue}
        onChange={(event) =>
          setGmEditStatus({
            ...gmEditStatus,
            fatigue: Number(event.target.value),
          })
        }
      />

      <span>/ {gmEditStatus.maxFatigue}</span>
    </div>

    <div className="gm-edit-row">
      <label>⚡ Szok</label>

      <select
        value={gmEditStatus.shaken ? 'true' : 'false'}
        onChange={(event) =>
          setGmEditStatus({
            ...gmEditStatus,
            shaken: event.target.value === 'true',
          })
        }
      >
        <option value="false">NIE</option>
        <option value="true">TAK</option>
      </select>
    </div>

  </div>
)}

<button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditEquipment([
      ...gmEditEquipment,
      {
        name: 'Nowy przedmiot',
        description: '',
      },
    ])
  }}
>
  ➕ DODAJ PRZEDMIOT
</button>

<button
  type="button"
  className="back-button"
  onClick={() => {
    setGmEditEquipment([
      ...gmEditEquipment,
      {
        name: 'Nowa broń',
        description: '',
        range: '',
        damage: '',
        rateOfFire: 1,
        ap: 0,
        magazineSize: 0,
        ammo: 0,
      },
    ])
  }}
>
  🔫 DODAJ BROŃ
</button>

    <button
  className="login-button"
  onClick={async () => {
    const updatedCharacter = {
      ...gmSelectedCharacter,
      name: gmEditName,
      player: gmEditPlayer,
      race: gmEditRace,
      concept: gmEditConcept,
      rank: gmEditRank,
      advancements: gmEditAdvancements,
      stats: gmEditStats,
      skills: gmEditSkills,
      edges: gmEditEdges,
      hindrances: gmEditHindrances,
      equipment: gmEditEquipment,
      status: gmEditStatus,
      
    }

    const storageKey = getCharacterStorageKey(
  gmSelectedCharacter.storageName
)

    localStorage.setItem(
  storageKey,
  JSON.stringify(updatedCharacter)
)

try {
  await setDoc(
    doc(
      db,
      'characters',
      gmSelectedCharacter.storageName
    ),
    updatedCharacter
  )

  console.log(
    'MG ZAPISAŁ POSTAĆ W FIRESTORE:',
    updatedCharacter.name
  )
} catch (error) {
  console.error(
    'Błąd zapisu postaci MG do Firestore:',
    error
  )
}

setGmSelectedCharacter(updatedCharacter)
    setIsGmEditingCharacter(false)

    console.log(
      'MG ZAPISAŁ POSTAĆ:',
      updatedCharacter.name
    )
  }}
>
  💾 ZAPISZ
</button>

    <button
      className="back-button"
      onClick={() => setIsGmEditingCharacter(false)}
    >
      ANULUJ
    </button>
  </div>
)}


    <h2>🎭 {gmSelectedCharacter.name}</h2>

    <p>
      <strong>Gracz:</strong> {gmSelectedCharacter.player}
    </p>

    <p>
      <strong>Rasa:</strong> {gmSelectedCharacter.race}
    </p>

    <p>
      <strong>Koncept:</strong> {gmSelectedCharacter.concept}
    </p>

    <p>
      <strong>Ranga:</strong> {gmSelectedCharacter.rank}
    </p>

    <p>
      <strong>Rozwinięcia:</strong>{' '}
      {gmSelectedCharacter.advancements}
    </p>

    <h3>📊 ATRYBUTY</h3>

    {gmSelectedCharacter.attributes.map((attribute) => (
      <p key={attribute.name}>
        <strong>{attribute.name}:</strong> {attribute.die}
      </p>
    ))}

    <h3>🎯 UMIEJĘTNOŚCI</h3>

    {gmSelectedCharacter.skills.length > 0 ? (
      gmSelectedCharacter.skills.map((skill) => (
        <p key={skill.name}>
          <strong>{skill.name}:</strong> {skill.die}
        </p>
      ))
    ) : (
      <p>Brak umiejętności.</p>
    )}

    <h3>❤️ STATUS</h3>

    <p>
      🟡 Fuksy: {gmSelectedCharacter.status.bennies}/
      {gmSelectedCharacter.status.maxBennies}
    </p>

    <p>
      🩸 Rany: {gmSelectedCharacter.status.wounds}/
      {gmSelectedCharacter.status.maxWounds}
    </p>

    <p>
      😵 Zmęczenie: {gmSelectedCharacter.status.fatigue}/
      {gmSelectedCharacter.status.maxFatigue}
    </p>

    <p>
      💫 Szok:{' '}
      {gmSelectedCharacter.status.shaken ? 'TAK' : 'NIE'}
    </p>

    <h3>⚔️ EKWIPUNEK</h3>

    {gmSelectedCharacter.equipment.length > 0 ? (
      gmSelectedCharacter.equipment.map((item, index) => (
        <p key={index}>
          <strong>{item.name}</strong>
          {item.description && ` — ${item.description}`}
        </p>
      ))
    ) : (
      <p>Brak ekwipunku.</p>
    )}

    <h3>🎒 ZDOBYCZ</h3>

    {gmSelectedCharacter.loot.length > 0 ? (
      gmSelectedCharacter.loot.map((item, index) => (
        <p key={index}>
          <strong>{item.name}</strong>
          {item.description && ` — ${item.description}`}
        </p>
      ))
    ) : (
      <p>Brak zdobyczy.</p>
    )}
  </section>
)}

  {gmActiveTab === 'rolls' && (
  <section className="tab-content">
    <h2>🎲 RZUTY</h2>

    <div className="dice-roller">

  <h2>🎲 SZYBKI RZUT MG</h2>

  <div className="dice-buttons">
    {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((die) => (
      <button
        key={die}
        className={
          selectedDie === die
            ? 'die-button active'
            : 'die-button'
        }
        onClick={() => setSelectedDie(die)}
      >
        {die}
      </button>
    ))}
  </div>

  <button
    className="roll-button"
    onClick={() => {
      const sides = Number(selectedDie.replace('d', ''))
      const result = Math.floor(Math.random() * sides) + 1

      setDiceRollResult(result)

      addRollToHistory({
  type: 'quick',
  character: 'MG / Szybki rzut',
  name: `🎲 Szybki rzut ${selectedDie}`,
  die: selectedDie,
  result: result,
  outcome: 'RZUT KOŚCIĄ',
})
    }}
  >
    RZUĆ {selectedDie.toUpperCase()} 🎲
  </button>

  {diceRollResult !== null && (
    <div className="roll-result">
      <h3>WYNIK: {diceRollResult}</h3>
    </div>
  )}

</div>

    <p>Historia wszystkich rzutów wykonanych podczas sesji.</p>

    {rollHistory.length === 0 ? (
      <p>Brak rzutów.</p>
    ) : (
      <>
        <button
  className="clear-history-button"
  onClick={async () => {
    const confirmed = window.confirm(
      'Czy na pewno usunąć CAŁĄ historię rzutów?'
    )

    if (!confirmed) return

    try {
      const rollsSnapshot = await getDocs(
        collection(db, 'rollHistory')
      )

      const deletePromises = rollsSnapshot.docs.map(
        (rollDoc) =>
          deleteDoc(
            doc(db, 'rollHistory', rollDoc.id)
          )
      )

      await Promise.all(deletePromises)

    } catch (error) {
      console.error(
        'Błąd podczas czyszczenia historii:',
        error
      )
    }
  }}
>
  🗑️ WYCZYŚĆ HISTORIĘ RZUTÓW
</button>

        <div className="roll-history">

  {rollHistory.map((roll) => (

    <div
      className={`history-card roll-history-card roll-${roll.type || 'test'}`}
      key={roll.id}
    >

      <div className="roll-header">

        <strong className="roll-character">
          👤 {roll.character}
        </strong>

        <span className="roll-type">
          {roll.outcome}
        </span>

      </div>

    <h3 className="roll-name">
  {roll.label || roll.name}
</h3>

<div className="roll-details">

  {roll.diceResults ? (
    <>
      {roll.diceResults.map((dice, index) => (
        <span key={index}>
          🎲 <strong>{dice.label}</strong>:{' '}
          <strong>
            {dice.rolls.join(' + ')}
            {' = '}
            {dice.total}
          </strong>
        </span>
      ))}

      <span>
        💥 OBRAŻENIA:{' '}
        <strong>{roll.result}</strong>
      </span>
    </>
  ) : (
    <>
      <span>
        🎲 Kość:{' '}
        <strong>{roll.die || roll.dice}</strong>
      </span>

      <span>
        🎯 Wynik:{' '}
        <strong>{roll.result}</strong>
      </span>
    </>
  )}

  {roll.pp !== undefined && (
    <span>
      🛡️ PP: <strong>{roll.pp}</strong>
    </span>
  )}

</div>

      {isGmLoggedIn && (
        <button
          className="logout-button"
          onClick={async () => {

            const confirmed = window.confirm(
              'Usunąć ten rzut z historii?'
            )

            if (!confirmed) return

            try {

              await deleteDoc(
                doc(db, 'rollHistory', roll.id)
              )

            } catch (error) {

              console.error(
                'Błąd podczas usuwania rzutu:',
                error
              )

            }

          }}
        >
          🗑️ USUŃ RZUT
        </button>
      )}

    </div>

  ))}

</div>
      </>
    )}
  </section>
)}

{gmActiveTab === 'npcs' && (
  <section className="tab-content">

    <div className="npc-list-header">

  <h2>👤 NPC</h2>

  <p>
    NPC i przeciwnicy Mistrza Gry.
  </p>

</div>

<button
  className="roll-button npc-add-button"
      onClick={() => {
  setNpcForm({
    name: '',
    type: 'extra',

    agility: 'd6',
    smarts: 'd6',
    spirit: 'd6',
    strength: 'd6',
    vigor: 'd6',

    fighting: 'd6',
    shooting: 'd6',
    athletics: 'd6',
    stealth: 'd6',
    notice: 'd6',

    pace: 6,
    defense: 5,
    toughness: 5,

    attacks: [],

    notes: '',
  })

  setNpcAttackName('')
  setNpcAttackDamage('')
  setNpcAttackPP(0)

  setEditingNpc(null)
  setSelectedNpc('new')
}}
    >
      ➕ DODAJ NPC
    </button>

    {npcs.length === 0 ? (
      <p>
        Brak NPC. Dodaj pierwszego NPC.
      </p>
    ) : (
      <div className="npc-groups">

  <div className="npc-group npc-group-wildcards">
    <h3 className="npc-group-title">⭐ WILD CARDS</h3>

    <div className="npc-list npc-selector-list">
      {npcs
        .filter((npc) => npc.type === 'wildcard')
        .map((npc) => (
          <button
            key={npc.id}
            className="history-card npc-selector-card npc-wildcard"
            onClick={() => setSelectedNpc(npc)}
          >
            <strong>{npc.name}</strong>
            <span className="npc-wildcard-badge">⭐ WILD CARD</span>
          </button>
        ))}
    </div>
  </div>

  <div className="npc-group npc-group-extras">
    <h3 className="npc-group-title">👤 EXTRAS</h3>

    <div className="npc-list npc-selector-list">
      {npcs
        .filter((npc) => npc.type !== 'wildcard')
        .map((npc) => (
          <button
            key={npc.id}
            className="history-card npc-selector-card npc-extra"
            onClick={() => setSelectedNpc(npc)}
          >
            <strong>{npc.name}</strong>
            <p>👤 Extra</p>
          </button>
        ))}
    </div>
  </div>

</div>
    )}

  </section>
)}

{gmActiveTab === 'npcs' &&
  (selectedNpc === 'new' || editingNpc) && (
  <section className="tab-content">

    <h2>
  {editingNpc ? '✏️ EDYCJA NPC' : '➕ NOWY NPC'}
</h2>

    <button
      className="logout-button"
      onClick={() => {
  setEditingNpc(null)
  setSelectedNpc(null)
}}
    >
      ← WRÓĆ DO LISTY
    </button>

    <div className="npc-form">

      <label>
        NAZWA NPC
       <input
  type="text"
  placeholder="Np. Foreman Briggs"
  value={npcForm.name}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      name: event.target.value,
    })
  }
/>
      </label>

      <label>
        TYP NPC
        <select
  value={npcForm.type}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      type: event.target.value,
    })
  }
>
  <option value="extra">👤 Extra</option>
  <option value="wildcard">⭐ Wild Card</option>
</select>
      </label>

      <h3>CECHY</h3>

      <div className="npc-stats-grid">

        <label>
          ZRĘCZNOŚĆ
          <select
  value={npcForm.agility}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      agility: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

        <label>
          SPRYT
          <select
  value={npcForm.smarts}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      smarts: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

        <label>
          DUCH
          <select
  value={npcForm.spirit}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      spirit: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

        <label>
          SIŁA
          <select
  value={npcForm.strength}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      strength: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

        <label>
          WIGOR
          <select
  value={npcForm.vigor}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      vigor: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

      </div>

      <h3>UMIEJĘTNOŚCI</h3>

      <div className="npc-stats-grid">

        <label>
          WALKA
          <select
  value={npcForm.fighting}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      fighting: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

        <label>
          STRZELANIE
          <select
  value={npcForm.shooting}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      shooting: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

        <label>
  SKRADANIE
  <select
  value={npcForm.stealth}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      stealth: event.target.value,
    })
  }
>
    <option>d4</option>
    <option>d6</option>
    <option>d8</option>
    <option>d10</option>
    <option>d12</option>
  </select>
</label>

<label>
  SPOSTRZEGAWCZOŚĆ
  <select
  value={npcForm.notice}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      notice: event.target.value,
    })
  }
>
    <option>d4</option>
    <option>d6</option>
    <option>d8</option>
    <option>d10</option>
    <option>d12</option>
  </select>
</label>

        <label>
          ATLETYKA
          <select
  value={npcForm.athletics}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      athletics: event.target.value,
    })
  }
>
            <option>d4</option>
            <option>d6</option>
            <option>d8</option>
            <option>d10</option>
            <option>d12</option>
          </select>
        </label>

      </div>

      <h3>WARTOŚCI</h3>

      <div className="npc-stats-grid">

        <label>
          TEMPO
          <input
  type="number"
  value={npcForm.pace}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      pace: Number(event.target.value),
    })
  }
/>
        </label>

        <label>
          OBRONA
          <input
  type="number"
  value={npcForm.defense}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      defense: Number(event.target.value),
    })
  }
/>
        </label>

        <label>
          WYTRZYMAŁOŚĆ
          <input
  type="number"
  value={npcForm.toughness}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      toughness: Number(event.target.value),
    })
  }
/>
        </label>

      </div>

      <h3>🔫 ATAKI / BROŃ</h3>

<div className="npc-stats-grid">
  <label>
    NAZWA ATAKU
    <input
      type="text"
      placeholder="Np. M41A Pulse Rifle"
      value={npcAttackName}
      onChange={(event) =>
        setNpcAttackName(event.target.value)
      }
    />
  </label>

  <label>
    OBRAŻENIA
    <input
      type="text"
      placeholder="Np. 2d8"
      value={npcAttackDamage}
      onChange={(event) =>
        setNpcAttackDamage(event.target.value)
      }
    />
  </label>

  <label>
    PP
    <input
      type="number"
      min="0"
      value={npcAttackPP}
      onChange={(event) =>
        setNpcAttackPP(Number(event.target.value))
      }
    />
  </label>
</div>

<button
  type="button"
  className="back-button"
  onClick={() => {
    if (
      !npcAttackName.trim() ||
      !npcAttackDamage.trim()
    ) {
      alert('Podaj nazwę ataku i obrażenia')
      return
    }

    const newAttack = {
      name: npcAttackName.trim(),
      damage: npcAttackDamage.trim(),
      pp: npcAttackPP,
    }

    setNpcForm((currentForm) => ({
      ...currentForm,
      attacks: [
        ...currentForm.attacks,
        newAttack,
      ],
    }))

    setNpcAttackName('')
    setNpcAttackDamage('')
    setNpcAttackPP(0)
  }}
>
  ➕ DODAJ ATAK
</button>

{npcForm.attacks.length > 0 && (
  <div className="npc-list">
    <h3>DODANE ATAKI</h3>

    {npcForm.attacks.map((attack, index) => (
      <div
        className="history-card"
        key={`${attack.name}-${index}`}
      >
        <strong>🔫 {attack.name}</strong>

        <p>
          💥 Obrażenia: <strong>{attack.damage}</strong>
        </p>

        <p>
          🔫 PP: <strong>{attack.pp}</strong>
        </p>

        <button
          type="button"
          className="logout-button"
          onClick={() => {
            setNpcForm((currentForm) => ({
              ...currentForm,
              attacks: currentForm.attacks.filter(
                (_, attackIndex) =>
                  attackIndex !== index
              ),
            }))
          }}
        >
          🗑️ USUŃ ATAK
        </button>
      </div>
    ))}
  </div>
)}

<h3>🔫 ATAKI / BROŃ</h3>

{selectedNpc.attacks &&
selectedNpc.attacks.length > 0 ? (

  <div className="npc-list">
    {selectedNpc.attacks.map((attack, index) => (
      <div
        className="history-card"
        key={`${attack.name}-${index}`}
      >
        <h3>🔫 {attack.name}</h3>

        <p>
          💥 Obrażenia:{' '}
          <strong>{attack.damage}</strong>
        </p>

        <p>
          🔫 PP:{' '}
          <strong>{attack.pp}</strong>
        </p>

      </div>
    ))}
  </div>

) : (

  <p>Brak dodanych ataków.</p>

)}


      <h3>NOTATKI</h3>

      <textarea
  className="gm-notes-area"
  placeholder="Np. Zdolności specjalne, wyposażenie, opis..."
  rows={8}
  value={npcForm.notes}
  onChange={(event) =>
    setNpcForm({
      ...npcForm,
      notes: event.target.value,
    })
  }
/>

      <button
  className="roll-button"
  onClick={async () => {
    if (!npcForm.name.trim()) {
      alert('Podaj nazwę NPC')
      return
    }

    try {
      const attacksToSave = [...npcForm.attacks]

if (
  npcAttackName.trim() &&
  npcAttackDamage.trim()
) {
  attacksToSave.push({
    name: npcAttackName.trim(),
    damage: npcAttackDamage.trim(),
    pp: npcAttackPP,
  })
}
      if (editingNpc) {
  await updateDoc(
    doc(db, 'npcs', editingNpc.id),
    {
  ...npcForm,
  attacks: attacksToSave,
  updatedAt: Date.now(),
}
  )

  console.log(
    'NPC ZAKTUALIZOWANY:',
    npcForm.name
  )
} else {
  await addDoc(
    collection(db, 'npcs'),
    {
  ...npcForm,
  attacks: attacksToSave,
  createdAt: Date.now(),
}
  )

  console.log(
    'NPC UTWORZONY:',
    npcForm.name
  )
}

      setNpcForm({
        name: '',
        type: 'extra',

        agility: 'd6',
        smarts: 'd6',
        spirit: 'd6',
        strength: 'd6',
        vigor: 'd6',

        fighting: 'd6',
        shooting: 'd6',
        athletics: 'd6',
        stealth: 'd6',
        notice: 'd6',

        pace: 6,
        defense: 5,
        toughness: 5,

        attacks: [],

        notes: '',
      })

      setEditingNpc(null)
      setSelectedNpc(null)

    } catch (error) {
      console.error(
        'Błąd podczas zapisywania NPC:',
        error
      )
    }
  }}
>
  {editingNpc ? '💾 ZAPISZ ZMIANY' : '💾 ZAPISZ NPC'}
</button>

    </div>

  </section>
)}


{gmActiveTab === 'npcs' &&
  selectedNpc &&
  selectedNpc !== 'new' && 
    !editingNpc && (
    <section className="tab-content npc-main-layout">
  <div className="npc-main-column">

     

      <button
        className="logout-button"
        onClick={() => setSelectedNpc(null)}
      >
        ← WRÓĆ DO LISTY
      </button>

      <h2>👤 {selectedNpc.name}</h2>
      <button
  className="roll-button"
  onClick={() => {
    setEditingNpc(selectedNpc)
    setNpcForm({
      name: selectedNpc.name,
      type: selectedNpc.type,
      agility: selectedNpc.agility,
      smarts: selectedNpc.smarts,
      spirit: selectedNpc.spirit,
      strength: selectedNpc.strength,
      vigor: selectedNpc.vigor,
      fighting: selectedNpc.fighting,
      shooting: selectedNpc.shooting,
      athletics: selectedNpc.athletics,
      stealth: selectedNpc.stealth,
      notice: selectedNpc.notice,
      pace: selectedNpc.pace,
      defense: selectedNpc.defense,
      toughness: selectedNpc.toughness,
      attacks: selectedNpc.attacks || [],
      notes: selectedNpc.notes || '',
    })
   
  }}
>
  ✏️ EDYTUJ NPC
</button>

      <p>
        {selectedNpc.type === 'wildcard'
          ? '⭐ WILD CARD'
          : '👤 EXTRA'}
      </p>

      {selectedNpc.attacks?.length > 0 && (

  <div className="npc-attacks-section">

  <h3>🔫 ATAKI / BROŃ</h3>

    {selectedNpc.attacks.map((attack, index) => (

      <div
  className="history-card npc-attack-card"
  key={`${attack.name}-${index}`}
>
        <strong>🔫 {attack.name}</strong>

       <p>
  💥 Obrażenia:{' '}
  <strong>
    {attack.damage
      ?.toLowerCase()
      .startsWith('strength+')
      ? `Siła + ${attack.damage.replace(/^strength\+/i, '')}`
      : attack.damage}
  </strong>
</p>

        <p>
          PP: {attack.pp}
        </p>

      <button
  className="roll-button npc-damage-button"
  onClick={() =>
    rollNpcDamage(selectedNpc, attack)
  }
>
  💥 RZUĆ OBRAŻENIA
</button>

      </div>
    ))}
  </div>
  
)}

        <div className="npc-status-section">

  <h3>⚔️ STATUS BOJOWY</h3>

  <div className="history-card npc-status-card">

          {selectedNpc.type === 'wildcard' && (
  <div className="gm-edit-row npc-status-row">
    <strong>🟡 FUKSY:</strong>

    <button
      type="button"
      className="back-button"
      onClick={async () => {
        const newBennies = Math.max(
          0,
          (selectedNpc.bennies ?? 0) - 1
        )

        try {
          await updateDoc(
            doc(db, 'npcs', selectedNpc.id),
            {
              bennies: newBennies,
            }
          )

          setSelectedNpc({
            ...selectedNpc,
            bennies: newBennies,
          })
        } catch (error) {
          console.error(
            'Błąd podczas zmiany Fuksów NPC:',
            error
          )
        }
      }}
    >
      ➖
    </button>

    <strong>{selectedNpc.bennies ?? 0}</strong>

    <button
      type="button"
      className="back-button"
      onClick={async () => {
        const newBennies =
          (selectedNpc.bennies ?? 0) + 1

        try {
          await updateDoc(
            doc(db, 'npcs', selectedNpc.id),
            {
              bennies: newBennies,
            }
          )

          setSelectedNpc({
            ...selectedNpc,
            bennies: newBennies,
          })
        } catch (error) {
          console.error(
            'Błąd podczas zmiany Fuksów NPC:',
            error
          )
        }
      }}
    >
      ➕
    </button>
  </div>
)}


  {selectedNpc.type === 'wildcard' && (
    <div className="gm-edit-row npc-status-row">
      <strong>❤️ RANY:</strong>

      <button
        type="button"
        className="back-button"
        onClick={async () => {
          const newWounds = Math.max(
            0,
            (selectedNpc.wounds ?? 0) - 1
          )

          try {
            await updateDoc(
              doc(db, 'npcs', selectedNpc.id),
              {
                wounds: newWounds,
              }
            )

            setSelectedNpc({
              ...selectedNpc,
              wounds: newWounds,
            })
          } catch (error) {
            console.error(
              'Błąd podczas zmiany Ran NPC:',
              error
            )
          }
        }}
      >
        ➖
      </button>

      <strong>
        {selectedNpc.wounds ?? 0}/3
      </strong>

      <button
        type="button"
        className="back-button"
        onClick={async () => {
          const newWounds =
            Math.min(3, (selectedNpc.wounds ?? 0) + 1)

          try {
            await updateDoc(
              doc(db, 'npcs', selectedNpc.id),
              {
                wounds: newWounds,
              }
            )

            setSelectedNpc({
              ...selectedNpc,
              wounds: newWounds,
            })
          } catch (error) {
            console.error(
              'Błąd podczas zmiany Ran NPC:',
              error
            )
          }
        }}
      >
        ➕
      </button>
    </div>
  )}

  <div className="gm-edit-row npc-status-row npc-shaken-row">
    <strong>⚡ SZOK:</strong>

    <strong>
      {selectedNpc.shaken ? 'TAK' : 'NIE'}
    </strong>

    <button
      type="button"
      className="back-button"
      onClick={async () => {
        const newShaken = !selectedNpc.shaken

        try {
          await updateDoc(
            doc(db, 'npcs', selectedNpc.id),
            {
              shaken: newShaken,
            }
          )

          setSelectedNpc({
            ...selectedNpc,
            shaken: newShaken,
          })
        } catch (error) {
          console.error(
            'Błąd podczas zmiany Szoku NPC:',
            error
          )
        }
      }}
    >
      {selectedNpc.shaken
        ? '⚡ USUŃ SZOK'
        : '⚡ DAJ SZOK'}
    </button>
  </div>

</div>
</div>


      <div className="npc-info-section">

 <h3>🧬 CECHY</h3>

<div className="npc-stats-grid npc-attributes-grid">

  <button
    className="history-card"
    onClick={() =>
      rollNpcTrait(
        selectedNpc,
        'Zręczność',
        selectedNpc.agility
      )
    }
  >
    <strong>🏃 ZRĘCZNOŚĆ</strong>
    <p>{selectedNpc.agility}</p>
  </button>

  <button
    className="history-card"
    onClick={() =>
      rollNpcTrait(
        selectedNpc,
        'Spryt',
        selectedNpc.smarts
      )
    }
  >
    <strong>🧠 SPRYT</strong>
    <p>{selectedNpc.smarts}</p>
  </button>

  <button
    className="history-card"
    onClick={() =>
      rollNpcTrait(
        selectedNpc,
        'Duch',
        selectedNpc.spirit
      )
    }
  >
    <strong>👁️ DUCH</strong>
    <p>{selectedNpc.spirit}</p>
  </button>

  <button
    className="history-card"
    onClick={() =>
      rollNpcTrait(
        selectedNpc,
        'Siła',
        selectedNpc.strength
      )
    }
  >
    <strong>💪 SIŁA</strong>
    <p>{selectedNpc.strength}</p>
  </button>

  <button
    className="history-card"
    onClick={() =>
      rollNpcTrait(
        selectedNpc,
        'Wigor',
        selectedNpc.vigor
      )
    }
  >
    <strong>🛡️ WIGOR</strong>
    <p>{selectedNpc.vigor}</p>
  </button>

</div>
    </div>

      <div className="npc-info-section npc-skills-section">

  <h3>🎯 UMIEJĘTNOŚCI</h3>

  <div className="npc-stats-grid npc-skills-grid">
        
          <button
  className="history-card"
  onClick={() =>
    rollNpcTrait(
      selectedNpc,
      'Walka',
      selectedNpc.fighting
    )
  }
>
  <strong>⚔️ WALKA</strong>
  <p>{selectedNpc.fighting}</p>
</button>

        <button
  className="history-card"
  onClick={() =>
    rollNpcTrait(
      selectedNpc,
      'Strzelanie',
      selectedNpc.shooting
    )
  }
>
  <strong>🔫 STRZELANIE</strong>
  <p>{selectedNpc.shooting}</p>
</button>


        <button
  className="history-card"
  onClick={() =>
    rollNpcTrait(
      selectedNpc,
      'Atletyka',
      selectedNpc.athletics
    )
  }
>
  <strong>🏃 ATLETYKA</strong>
  <p>{selectedNpc.athletics}</p>
</button>

        <button
  className="history-card"
  onClick={() =>
    rollNpcTrait(
      selectedNpc,
      'Skradanie',
      selectedNpc.stealth
    )
  }
>
  <strong>🥷 SKRADANIE</strong>
  <p>{selectedNpc.stealth}</p>
</button>

        <button
  className="history-card"
  onClick={() =>
    rollNpcTrait(
      selectedNpc,
      'Spostrzegawczość',
      selectedNpc.notice
    )
  }
>
  <strong>👁️ SPOSTRZ.</strong>
  <p>{selectedNpc.notice}</p>
</button>
      </div>
    </div>

      <div className="npc-info-section npc-values-section">

  <h3>📊 WARTOŚCI</h3>

  <div className="npc-stats-grid npc-values-grid">
        <div>
          <strong>TEMPO</strong>
          <p>{selectedNpc.pace}</p>
        </div>

        <div>
          <strong>OBRONA</strong>
          <p>{selectedNpc.defense}</p>
        </div>

        <div>
          <strong>WYTRZYMAŁOŚĆ</strong>
          <p>{selectedNpc.toughness}</p>
        </div>
      </div>
      </div>

      <div className="npc-info-section npc-notes-section">

  <h3>📝 NOTATKI</h3>

  <div className="history-card npc-notes-card">
    {selectedNpc.notes || 'Brak notatek'}
  </div>

</div>

      <button
  className="logout-button"
  onClick={async () => {
    const confirmed = window.confirm(
      `Usunąć NPC: ${selectedNpc.name}?`
    )

    if (!confirmed) return

    try {
      await deleteDoc(
        doc(db, 'npcs', selectedNpc.id)
      )

      setSelectedNpc(null)

    } catch (error) {
      console.error(
        'Błąd podczas usuwania NPC:',
        error
      )
    }
  }}
>
  🗑️ USUŃ NPC
</button>

    </div>

    <div className="npc-rolls-column">
      {renderRecentRolls()}
    </div>

  </section>
)}


        {gmActiveTab === 'initiative' && (
  <section className="tab-content">
    <h2>🃏 INICJATYWA</h2>

    <p>
      Panel kontroli inicjatywy dla MG.
    </p>

    <button
      className="login-button"
      onClick={() => {
        const deck = [
          'A♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠',
          '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠',

          'A♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥',
          '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥',

          'A♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦',
          '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦',

          'A♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣',
          '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣',

          '🃏 JOKER',
          '🃏 JOKER',
        ]

        const shuffledDeck = [...deck]

for (let i = shuffledDeck.length - 1; i > 0; i--) {
  const randomIndex = Math.floor(
    Math.random() * (i + 1)
  )

  const temporaryCard = shuffledDeck[i]
  shuffledDeck[i] = shuffledDeck[randomIndex]
  shuffledDeck[randomIndex] = temporaryCard
}

setDoc(
  doc(db, 'gameState', 'initiative'),
  {
    deck: shuffledDeck,
    results: [],
  }
)

      }}
    >
      🃏 PRZYGOTUJ TALIĘ
    </button>




    <p className="initiative-deck-count">
  Pozostało kart: <strong>{initiativeDeck.length}</strong>
</p>

    <input
  className="initiative-name-input"
  type="text"
  placeholder="Nazwa uczestnika, np. Xenomorf"
  value={initiativeName}
  onChange={(event) =>
    setInitiativeName(event.target.value)
  }
/>

<button
  className="login-button"
  disabled={
    initiativeDeck.length === 0 ||
    !initiativeName.trim()
  }
  onClick={async () => {
    const drawnCard = initiativeDeck[0]

    if (!drawnCard) return

    const newDeck = initiativeDeck.slice(1)

    const newResults = [
      ...initiativeResults,
      {
        name: initiativeName.trim(),
        card: drawnCard,
      },
    ]

    try {
      await updateDoc(
        doc(db, 'gameState', 'initiative'),
        {
          deck: newDeck,
          results: newResults,
        }
      )

      setInitiativeName('')
    } catch (error) {
      console.error(
        'Błąd podczas ciągnięcia karty MG:',
        error
      )
    }
  }}
>
  🎴 CIĄGNIJ KARTĘ
</button>

    {initiativeResults.length > 0 && (
  <div className="initiative-results">

    <h3 className="initiative-results-title">
  🃏 WYCIĄGNIĘTE KARTY
</h3>

<div className="initiative-results-list">
  {sortInitiativeResults(initiativeResults).map(
    (participant, index) => (
      <div
        className="initiative-result-row"
        key={`${participant.name}-${index}`}
      >
        <div className="initiative-result-position">
          {index + 1}
        </div>

        <div className="initiative-result-name">
          👤 {participant.name}
        </div>

        <div className="initiative-result-card">
          {participant.card === '🃏 JOKER'
            ? '🃏 JOKER!'
            : `🃏 ${participant.card}`}
        </div>

           {participant.card === '🃏 JOKER' && (
  <div className="initiative-joker-message">
    <strong>🃏 JOKER!</strong>
    <p>
      Postać może działać w dowolnym momencie rundy,
      nawet przerywając akcję kogoś innego.
    </p>
    <p>
      Ponadto otrzymuje w tej rundzie
      <strong> +2 do testów Cech i do obrażeń.</strong>
    </p>
  </div>
)} 



        <button
  className="clear-history-button initiative-delete-button initiative-delete"
          onClick={async () => {
            try {
              const newResults = initiativeResults.filter(
                (item) =>
                  !(
                    item.name === participant.name &&
                    item.card === participant.card
                  )
              )

              await updateDoc(
                doc(db, 'gameState', 'initiative'),
                {
                  results: newResults,
                }
              )
            } catch (error) {
              console.error(
                'Błąd podczas usuwania karty inicjatywy:',
                error
              )
            }
          }}
        >
          🗑️ USUŃ
        </button>
      </div>
    )
  )}

</div>

</div>

)}

  </section>
)}

{gmActiveTab === 'gallery' && (

  <section className="tab-content">

      <h2>🖼️ GALERIA MG</h2>

    <p>Wybierz grafikę z dysku i prześlij ją do galerii.</p>

    <label className="gallery-label">
  📁 KATEGORIA
</label>

<select
  className="gallery-select"
  value={galleryCategory}
  onChange={(event) =>
    setGalleryCategory(event.target.value)
  }
>
  <option value="Postacie">📁 Postacie</option>
  <option value="NPC">📁 NPC</option>
  <option value="Lokacje">📁 Lokacje</option>
  <option value="Mapy">📁 Mapy</option>
  <option value="Inne">📁 Inne</option>
</select>

    <label className="gallery-label">
  📝 NAZWA GRAFIKI
</label>

<input
  className="gallery-name-input"
  type="text"
  placeholder="Np. Kestrel-9 – główny hangar"
  value={galleryImageTitle}
  onChange={(event) =>
    setGalleryImageTitle(event.target.value)
  }
/>

   <label className="gallery-label">
  📎 PLIK GRAFIKI
</label>

<input
  className="gallery-file-input"
  type="file"
  accept="image/*"
  onChange={(event) => {
    const selectedFile = event.target.files[0]
    setGalleryImageFile(selectedFile || null)
  }}
/>

    <div className="gallery-file-status">

  {galleryImageFile ? (
    <>
      🖼️ WYBRANO PLIK:{' '}
      <strong>{galleryImageFile.name}</strong>
    </>
  ) : null}

</div>

    <button
      className="gallery-upload-button"
      disabled={
        !galleryImageTitle.trim() ||
        !galleryImageFile
      }
      onClick={async () => {
        try {
          const fileName = `${Date.now()}-${galleryImageFile.name}`
const storagePath = `gallery/${fileName}`

const storageRef = ref(
  storage,
  storagePath
)

          await uploadBytes(
            storageRef,
            galleryImageFile
          )

          const imageUrl = await getDownloadURL(storageRef)

          const newImage = {
  title: galleryImageTitle.trim(),
  url: imageUrl,
  category: galleryCategory,
  storagePath: storagePath,
  createdAt: Date.now(),
}

const docRef = await addDoc(
  collection(db, 'galleryImages'),
  newImage
)

setGalleryImages((currentImages) => [
  ...currentImages,
  {
    id: docRef.id,
    ...newImage,
  },
])

          setGalleryImageTitle('')
          setGalleryImageFile(null)

        } catch (error) {
          console.error(
            'Błąd podczas przesyłania obrazka:',
            error
          )
        }
      }}
    >
      ⬆️ PRZEŚLIJ DO GALERII
    </button>

    <p>
  DEBUG: Udostępnione grafiki: {sharedGalleryImages.length}
</p>


<div className="game-map-selector">
  <h3>🗺️ MAPA GRY</h3>

  <select
    className="game-map-select"
    value={selectedGameMap?.id || ''}
    onChange={async (event) => {
      const mapId = event.target.value

      if (!mapId) {
        await deleteDoc(
          doc(db, 'gallerySettings', 'gameMap')
        )
        setSelectedGameMap(null)
        return
      }

      const selectedMap = galleryImages.find(
        (image) => image.id === mapId
      )

      if (!selectedMap) return

      try {
        await setDoc(
          doc(db, 'gallerySettings', 'gameMap'),
          {
            imageId: selectedMap.id,
            title: selectedMap.title,
            url: selectedMap.url,
          }
        )

        setSelectedGameMap(selectedMap)
      } catch (error) {
        console.error(
          'Błąd podczas ustawiania mapy gry:',
          error
        )
      }
    }}
  >
    <option value="">
      — Wybierz mapę gry —
    </option>

    {galleryImages
      .filter((image) => image.category === 'Mapy')
      .sort((a, b) =>
        a.title.localeCompare(
          b.title,
          'pl',
          { sensitivity: 'base' }
        )
      )
      .map((image) => (
        <option
          key={image.id}
          value={image.id}
        >
          {image.title}
        </option>
      ))}
  </select>
</div>


{selectedGameMap && (
  <div className="game-map-preview">
    <div className="game-map-header">
      <h3>🗺️ {selectedGameMap.title}</h3>

      <button
        type="button"
        className="game-map-toggle-button"
        onClick={() =>
          setIsGameMapOpen((current) => !current)
        }
      >
        {isGameMapOpen
          ? '▲ ZWIŃ MAPĘ'
          : '▼ POKAŻ MAPĘ'}
      </button>

          <label className="map-marker-control">
  ZNAK:
  <input
    type="text"
    maxLength={2}
    value={mapMarkerText}
    onChange={(event) =>
      setMapMarkerText(event.target.value)
    }
  />
</label>


    </div>

    {isGameMapOpen && (
      <div className="game-map-image-wrapper">
  <div className="game-map-canvas">
    {mapMarkers.map((marker) => (
 <div
  key={marker.id}
  className="map-marker"
  style={{
    left: `${marker.x}%`,
    top: `${marker.y}%`,
  }}
  onClick={async (event) => {
  event.stopPropagation()

  const updatedMarkers = mapMarkers.filter(
    (currentMarker) => currentMarker.id !== marker.id
  )

  setMapMarkers(updatedMarkers)

  try {
    await setDoc(
      doc(db, 'gallerySettings', 'gameMap'),
      {
        markers: updatedMarkers,
      },
      { merge: true }
    )
  } catch (error) {
    console.error(
      'Błąd podczas usuwania znacznika mapy:',
      error
    )
  }
}}
>
  {marker.text}
</div>
))}

    <img
      className="game-map-image"
      src={selectedGameMap.url}
      alt={selectedGameMap.title}
      onClick={async (event) => {
  const rect = event.currentTarget.getBoundingClientRect()

  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  const newMarker = {
    id: Date.now(),
    text: mapMarkerText,
    x,
    y,
  }

  const updatedMarkers = [...mapMarkers, newMarker]

  setMapMarkers(updatedMarkers)

  try {
    await setDoc(
      doc(db, 'gallerySettings', 'gameMap'),
      {
        markers: updatedMarkers,
      },
      { merge: true }
    )
  } catch (error) {
    console.error(
      'Błąd podczas zapisywania znaczników mapy:',
      error
    )
  }
}}
    />
  </div>
</div>
    )}
  </div>
)}



    {galleryImages.length > 0 && (
      <div className="initiative-results">

        <h3>DODANE GRAFIKI</h3>

{['Postacie', 'NPC', 'Lokacje', 'Mapy', 'Inne'].map((category) => {

  const imagesInCategory = galleryImages
  .filter(
    (image) => (image.category || 'Inne') === category
  )
  .sort((a, b) =>
    a.title.localeCompare(
      b.title,
      'pl',
      { sensitivity: 'base' }
    )
  )

  return (
    <div key={category} className="gallery-category">

     <h3>
  📁 {category.toUpperCase()} ({imagesInCategory.length})
</h3>

<div className="gallery-image-grid">
  {imagesInCategory.map((image) => (
          <div
  className="history-card gallery-image-card"
  key={image.id}
>
            <h3>{image.title}</h3>

            <img
              src={image.url}
              alt={image.title}
              style={{
                maxWidth: '100%',
                maxHeight: '250px',
                borderRadius: '8px',
              }}
            />

            <button
              className="roll-button"
              onClick={async () => {

  try {

    await setDoc(
      doc(db, 'gallerySettings', 'sharedImages'),
      {
        [image.id]: {
          title: image.title,
          url: image.url,
          category: image.category || 'Inne',
        },
      },
      {
        merge: true,
      }
    )

  } catch (error) {

    console.error(
      'Błąd podczas udostępniania grafiki:',
      error
    )

  }

}}
            >
              👁️ POKAŻ GRACZOM
            </button>

            <button
  className="clear-history-button"
  onClick={async () => {
    try {
      // Jeśli ta grafika jest aktualnie pokazywana,
      // najpierw ukrywamy ją przed graczami
      if (activeGalleryImage?.id === image.id) {
        await deleteDoc(
          doc(db, 'gallerySettings', 'activeImage')
        )

        setActiveGalleryImage(null)
      }

      // Usuwamy plik ze Storage
      if (image.storagePath) {
        const imageRef = ref(
          storage,
          image.storagePath
        )

        await deleteObject(imageRef)
      }

      // Usuwamy wpis z Firestore
      await deleteDoc(
        doc(db, 'galleryImages', image.id)
      )

      // Usuwamy z aktualnego widoku MG
      setGalleryImages((currentImages) =>
        currentImages.filter(
          (currentImage) =>
            currentImage.id !== image.id
        )
      )

    } catch (error) {
      console.error(
        'Błąd podczas usuwania grafiki:',
        error
      )
    }
  }}
>
  🗑️ USUŃ Z GALERII
</button>

    {sharedGalleryImages.some(
  (sharedImage) => sharedImage.id === image.id
) && (
  <button
    className="clear-history-button"
    onClick={async () => {

  try {

    await updateDoc(
      doc(db, 'gallerySettings', 'sharedImages'),
      {
        [image.id]: deleteField(),
      }
    )

  } catch (error) {

    console.error(
      'Błąd podczas ukrywania grafiki:',
      error
    )

  }

}}
  >
    🙈 UKRYJ PRZED GRACZAMI
  </button>
)}


                    </div>

        ))}
        </div>
        
      </div>

    )
  })}

      </div>
        )}
   
  </section>
)}

        {gmActiveTab === 'notes' && (
  <section className="tab-content">

    <h2>📝 NOTATKI MG</h2>

    <p>
      Prywatne notatki Mistrza Gry.
    </p>

    <textarea
  className="gm-notes-area"
  value={gmNotes}
  onChange={(event) => setGmNotes(event.target.value)}
  placeholder="Wpisz prywatne notatki Mistrza Gry..."
    />

    <button
      className="roll-button"
      onClick={async () => {
        try {
          await setDoc(
            doc(db, 'gmData', 'notes'),
            {
              content: gmNotes,
              updatedAt: Date.now(),
            }
          )

          alert('Notatki zostały zapisane 💾')

        } catch (error) {
          console.error(
            'Błąd podczas zapisywania notatek MG:',
            error
          )
        }
      }}
    >
      💾 ZAPISZ NOTATKI
    </button>

  </section>
)}
      </div>
    </main>
  )
}

if (isGmLogin) {
  return (
    <main className="app">
      <section className="welcome-panel login-panel">
        <p className="eyebrow">SAVAGE TABLE</p>

        <h1>🔐 PANEL MISTRZA GRY</h1>

        <p className="subtitle">
          Podaj PIN MG
        </p>

        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          maxLength="4"
          value={gmPinInput}
          onChange={(event) => setGmPinInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              loginGm()
            }
          }}
          placeholder="••••"
          autoFocus
        />

        {gmError && (
          <p className="error-message">
            {gmError}
          </p>
        )}

        <button
          className="login-button"
          onClick={loginGm}
        >
          WEJDŹ JAKO MG
        </button>

        <button
          className="back-button"
          onClick={() => {
            setIsGmLogin(false)
            setGmPinInput('')
            setGmError('')
          }}
        >
          ← Wróć
        </button>
      </section>
    </main>
  )
}




return (
  <main
    className="app welcome-screen"
    style={{
      '--welcome-bg': `url(${alienBackground})`,
    }}
  >
    <section className="welcome-panel">
      <p className="eyebrow">SWADE • ONLINE TABLE</p>

      <h1>SAVAGE TABLE</h1>

      <p className="subtitle">Wybierz swoją postać</p>

      <div className="character-grid">
        {characters.map((character) => (
          <button
            className="character-button"
            key={character.name}
            onClick={() => selectCharacter(character)}
          >
            {character.name}
          </button>
        ))}
      </div>

      <div className="divider" />

      <button
  className="gm-button"
  onClick={openGmLogin}
>
  🔐 WEJŚCIE MG
</button>
    </section>
  </main>
)
}

export default App