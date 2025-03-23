/**
 * Mishnayot data - orders and their tractates with chapter and mishnah counts
 */

const mishnayotData = {
  // Original structure for backwards compatibility
  "Zeraim": {
    "Berakhot": 9,
    "Pe'ah": 8,
    "Demai": 7,
    "Kilayim": 9,
    "Shevi'it": 10,
    "Terumot": 11,
    "Ma'aserot": 5,
    "Ma'aser Sheni": 5,
    "Challah": 4,
    "Orlah": 3,
    "Bikkurim": 3
  },
  "Moed": {
    "Shabbat": 24,
    "Eruvin": 10,
    "Pesachim": 10,
    "Shekalim": 8,
    "Yoma": 8,
    "Sukkah": 5,
    "Beitzah": 5,
    "Rosh Hashanah": 4,
    "Ta'anit": 4,
    "Megillah": 4,
    "Moed Katan": 3,
    "Chagigah": 3
  },
  "Nashim": {
    "Yevamot": 16,
    "Ketubot": 13,
    "Nedarim": 11,
    "Nazir": 9,
    "Sotah": 9,
    "Gittin": 9,
    "Kiddushin": 4
  },
  "Nezikin": {
    "Bava Kamma": 10,
    "Bava Metzia": 10,
    "Bava Batra": 10,
    "Sanhedrin": 11,
    "Makkot": 3,
    "Shevuot": 8,
    "Eduyot": 8,
    "Avodah Zarah": 5,
    "Avot": 5,
    "Horayot": 3
  },
  "Kodashim": {
    "Zevachim": 14,
    "Menachot": 13,
    "Chullin": 12,
    "Bechorot": 9,
    "Arachin": 9,
    "Temurah": 7,
    "Keritot": 6,
    "Me'ilah": 6,
    "Tamid": 7,
    "Middot": 5,
    "Kinnim": 3
  },
  "Tahorot": {
    "Kelim": 30,
    "Oholot": 18,
    "Negaim": 14,
    "Parah": 12,
    "Tohorot": 10,
    "Mikvaot": 10,
    "Niddah": 10,
    "Machshirin": 6,
    "Zavim": 5,
    "Tevul Yom": 4,
    "Yadayim": 4,
    "Uktzim": 3
  },
  
  // Detailed structure with individual mishnah counts
  "sedarim": [
   {
    "name": "Zeraim",
    "masechtot": [
     {
      "name": "Berakhot",
      "perakim": [
       { "perek": 1, "mishnayot": 5 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 5 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 5 }
      ]
     },
     {
      "name": "Pe'ah",
      "perakim": [
       { "perek": 1, "mishnayot": 6 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 8 },
       { "perek": 6, "mishnayot": 11 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 9 }
      ]
     },
     {
      "name": "Demai",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 5 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 10 },
       { "perek": 6, "mishnayot": 12 },
       { "perek": 7, "mishnayot": 8 }
      ]
     },
     {
      "name": "Kilayim",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 11 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 8 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 9 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 5 },
       { "perek": 9, "mishnayot": 10 }
      ]
     },
     {
      "name": "Shevi'it",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 10 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 8 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 11 },
       { "perek": 9, "mishnayot": 9 },
       { "perek": 10, "mishnayot": 9 }
      ]
     },
     {
      "name": "Terumot",
      "perakim": [
       { "perek": 1, "mishnayot": 10 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 9 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 9 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 10 },
       { "perek": 8, "mishnayot": 12 },
       { "perek": 9, "mishnayot": 13 },
       { "perek": 10, "mishnayot": 10 },
       { "perek": 11, "mishnayot": 10 }
      ]
     },
     {
      "name": "Ma'aserot",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 11 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 8 }
      ]
     },
     {
      "name": "Ma'aser Sheni",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 11 },
       { "perek": 4, "mishnayot": 12 },
       { "perek": 5, "mishnayot": 15 }
      ]
     },
     {
      "name": "Challah",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 7 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 11 }
      ]
     },
     {
      "name": "Orlah",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 7 },
       { "perek": 3, "mishnayot": 9 }
      ]
     },
     {
      "name": "Bikkurim",
      "perakim": [
       { "perek": 1, "mishnayot": 5 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 12 }
      ]
     }
    ]
   },
   {
    "name": "Moed",
    "masechtot": [
     {
      "name": "Shabbat",
      "perakim": [
       { "perek": 1, "mishnayot": 11 },
       { "perek": 2, "mishnayot": 7 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 6 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 10 },
       { "perek": 7, "mishnayot": 4 },
       { "perek": 8, "mishnayot": 7 },
       { "perek": 9, "mishnayot": 7 },
       { "perek": 10, "mishnayot": 5 },
       { "perek": 11, "mishnayot": 6 },
       { "perek": 12, "mishnayot": 5 },
       { "perek": 13, "mishnayot": 6 },
       { "perek": 14, "mishnayot": 4 },
       { "perek": 15, "mishnayot": 3 },
       { "perek": 16, "mishnayot": 8 },
       { "perek": 17, "mishnayot": 8 },
       { "perek": 18, "mishnayot": 3 },
       { "perek": 19, "mishnayot": 6 },
       { "perek": 20, "mishnayot": 7 },
       { "perek": 21, "mishnayot": 4 },
       { "perek": 22, "mishnayot": 6 },
       { "perek": 23, "mishnayot": 5 },
       { "perek": 24, "mishnayot": 5 }
      ]
     },
     {
      "name": "Eruvin",
      "perakim": [
       { "perek": 1, "mishnayot": 10 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 9 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 11 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 7 },
       { "perek": 10, "mishnayot": 15 }
      ]
     },
     {
      "name": "Pesachim",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 9 },
       { "perek": 5, "mishnayot": 10 },
       { "perek": 6, "mishnayot": 4 },
       { "perek": 7, "mishnayot": 13 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 11 },
       { "perek": 10, "mishnayot": 9 }
      ]
     },
     {
      "name": "Shekalim",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 4 },
       { "perek": 4, "mishnayot": 9 },
       { "perek": 5, "mishnayot": 9 },
       { "perek": 6, "mishnayot": 5 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 8 }
      ]
     },
     {
      "name": "Yoma",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 11 },
       { "perek": 4, "mishnayot": 4 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 9 }
      ]
     },
     {
      "name": "Sukkah",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 9 },
       { "perek": 3, "mishnayot": 15 },
       { "perek": 4, "mishnayot": 9 },
       { "perek": 5, "mishnayot": 8 }
      ]
     },
     {
      "name": "Beitzah",
      "perakim": [
       { "perek": 1, "mishnayot": 11 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 10 },
       { "perek": 4, "mishnayot": 9 },
       { "perek": 5, "mishnayot": 7 }
      ]
     },
     {
      "name": "Rosh Hashanah",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 9 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 9 }
      ]
     },
     {
      "name": "Ta'anit",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 9 },
       { "perek": 4, "mishnayot": 8 }
      ]
     },
     {
      "name": "Megillah",
      "perakim": [
       { "perek": 1, "mishnayot": 11 },
       { "perek": 2, "mishnayot": 4 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 10 }
      ]
     },
     {
      "name": "Moed Katan",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 4 },
       { "perek": 3, "mishnayot": 9 }
      ]
     },
     {
      "name": "Chagigah",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 7 },
       { "perek": 3, "mishnayot": 6 }
      ]
     }
    ]
   },
   {
    "name": "Nashim",
    "masechtot": [
     {
      "name": "Yevamot",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 10 },
       { "perek": 4, "mishnayot": 13 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 7 },
       { "perek": 9, "mishnayot": 5 },
       { "perek": 10, "mishnayot": 10 },
       { "perek": 11, "mishnayot": 6 },
       { "perek": 12, "mishnayot": 6 },
       { "perek": 13, "mishnayot": 7 },
       { "perek": 14, "mishnayot": 7 },
       { "perek": 15, "mishnayot": 9 },
       { "perek": 16, "mishnayot": 7 }
      ]
     },
     {
      "name": "Ketubot",
      "perakim": [
       { "perek": 1, "mishnayot": 10 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 12 },
       { "perek": 5, "mishnayot": 9 },
       { "perek": 6, "mishnayot": 4 },
       { "perek": 7, "mishnayot": 10 },
       { "perek": 8, "mishnayot": 11 },
       { "perek": 9, "mishnayot": 9 },
       { "perek": 10, "mishnayot": 5 },
       { "perek": 11, "mishnayot": 8 },
       { "perek": 12, "mishnayot": 4 },
       { "perek": 13, "mishnayot": 11 }
      ]
     },
     {
      "name": "Nedarim",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 10 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 7 },
       { "perek": 9, "mishnayot": 7 },
       { "perek": 10, "mishnayot": 8 },
       { "perek": 11, "mishnayot": 11 }
      ]
     },
     {
      "name": "Nazir",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 11 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 2 },
       { "perek": 9, "mishnayot": 5 }
      ]
     },
     {
      "name": "Sotah",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 12 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 10 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 6 },
       { "perek": 9, "mishnayot": 15 }
      ]
     },
     {
      "name": "Gittin",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 7 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 9 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 10 },
       { "perek": 9, "mishnayot": 8 }
      ]
     },
     {
      "name": "Kiddushin",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 13 },
       { "perek": 4, "mishnayot": 14 }
      ]
     }
    ]
   },
   {
    "name": "Nezikin",
    "masechtot": [
     {
      "name": "Bava Kamma",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 10 },
       { "perek": 4, "mishnayot": 8 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 7 },
       { "perek": 8, "mishnayot": 6 },
       { "perek": 9, "mishnayot": 12 },
       { "perek": 10, "mishnayot": 6 }
      ]
     },
     {
      "name": "Bava Metzia",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 11 },
       { "perek": 3, "mishnayot": 11 },
       { "perek": 4, "mishnayot": 12 },
       { "perek": 5, "mishnayot": 9 },
       { "perek": 6, "mishnayot": 13 },
       { "perek": 7, "mishnayot": 10 },
       { "perek": 8, "mishnayot": 6 },
       { "perek": 9, "mishnayot": 12 },
       { "perek": 10, "mishnayot": 4 }
      ]
     },
     {
      "name": "Bava Batra",
      "perakim": [
       { "perek": 1, "mishnayot": 6 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 10 },
       { "perek": 6, "mishnayot": 3 },
       { "perek": 7, "mishnayot": 12 },
       { "perek": 8, "mishnayot": 7 },
       { "perek": 9, "mishnayot": 10 },
       { "perek": 10, "mishnayot": 8 }
      ]
     },
     {
      "name": "Sanhedrin",
      "perakim": [
       { "perek": 1, "mishnayot": 5 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 7 },
       { "perek": 9, "mishnayot": 6 },
       { "perek": 10, "mishnayot": 6 },
       { "perek": 11, "mishnayot": 6 }
      ]
     },
     {
      "name": "Makkot",
      "perakim": [
       { "perek": 1, "mishnayot": 10 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 16 }
      ]
     },
     {
      "name": "Shevuot",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 13 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 6 }
      ]
     },
     {
      "name": "Eduyot",
      "perakim": [
       { "perek": 1, "mishnayot": 14 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 11 },
       { "perek": 4, "mishnayot": 10 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 2 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 7 }
      ]
     },
     {
      "name": "Avodah Zarah",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 9 },
       { "perek": 4, "mishnayot": 12 },
       { "perek": 5, "mishnayot": 12 }
      ]
     },
     {
      "name": "Avot",
      "perakim": [
       { "perek": 1, "mishnayot": 18 },
       { "perek": 2, "mishnayot": 16 },
       { "perek": 3, "mishnayot": 21 },
       { "perek": 4, "mishnayot": 22 },
       { "perek": 5, "mishnayot": 23 }
      ]
     },
     {
      "name": "Horayot",
      "perakim": [
       { "perek": 1, "mishnayot": 6 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 8 }
      ]
     }
    ]
   },
   {
    "name": "Kodashim",
    "masechtot": [
     {
      "name": "Zevachim",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 6 },
       { "perek": 5, "mishnayot": 8 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 6 },
       { "perek": 9, "mishnayot": 8 },
       { "perek": 10, "mishnayot": 5 },
       { "perek": 11, "mishnayot": 6 },
       { "perek": 12, "mishnayot": 5 },
       { "perek": 13, "mishnayot": 6 },
       { "perek": 14, "mishnayot": 10 }
      ]
     },
     {
      "name": "Menachot",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 8 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 8 },
       { "perek": 10, "mishnayot": 9 },
       { "perek": 11, "mishnayot": 6 },
       { "perek": 12, "mishnayot": 5 },
       { "perek": 13, "mishnayot": 11 }
      ]
     },
     {
      "name": "Chullin",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 16 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 7 },
       { "perek": 9, "mishnayot": 6 },
       { "perek": 10, "mishnayot": 6 },
       { "perek": 11, "mishnayot": 12 },
       { "perek": 12, "mishnayot": 5 }
      ]
     },
     {
      "name": "Bechorot",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 11 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 6 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 7 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 8 }
      ]
     },
     {
      "name": "Arachin",
      "perakim": [
       { "perek": 1, "mishnayot": 5 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 5 },
       { "perek": 4, "mishnayot": 4 },
       { "perek": 5, "mishnayot": 6 },
       { "perek": 6, "mishnayot": 5 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 6 },
       { "perek": 9, "mishnayot": 8 }
      ]
     },
     {
      "name": "Temurah",
      "perakim": [
       { "perek": 1, "mishnayot": 6 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 6 },
       { "perek": 6, "mishnayot": 5 },
       { "perek": 7, "mishnayot": 4 }
      ]
     },
     {
      "name": "Keritot",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 4 },
       { "perek": 3, "mishnayot": 9 },
       { "perek": 4, "mishnayot": 3 },
       { "perek": 5, "mishnayot": 8 },
       { "perek": 6, "mishnayot": 9 }
      ]
     },
     {
      "name": "Me'ilah",
      "perakim": [
       { "perek": 1, "mishnayot": 3 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 4 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 4 }
      ]
     },
     {
      "name": "Tamid",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 9 },
       { "perek": 4, "mishnayot": 3 },
       { "perek": 5, "mishnayot": 1 },
       { "perek": 6, "mishnayot": 3 },
       { "perek": 7, "mishnayot": 3 }
      ]
     },
     {
      "name": "Middot",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 4 }
      ]
     },
     {
      "name": "Kinnim",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 6 }
      ]
     }
    ]
   },
   {
    "name": "Tahorot",
    "masechtot": [
     {
      "name": "Kelim",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 6 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 16 },
       { "perek": 5, "mishnayot": 10 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 8 },
       { "perek": 8, "mishnayot": 10 },
       { "perek": 9, "mishnayot": 7 },
       { "perek": 10, "mishnayot": 4 },
       { "perek": 11, "mishnayot": 11 },
       { "perek": 12, "mishnayot": 8 },
       { "perek": 13, "mishnayot": 7 },
       { "perek": 14, "mishnayot": 8 },
       { "perek": 15, "mishnayot": 6 },
       { "perek": 16, "mishnayot": 8 },
       { "perek": 17, "mishnayot": 13 },
       { "perek": 18, "mishnayot": 10 },
       { "perek": 19, "mishnayot": 8 },
       { "perek": 20, "mishnayot": 8 },
       { "perek": 21, "mishnayot": 3 },
       { "perek": 22, "mishnayot": 10 },
       { "perek": 23, "mishnayot": 6 },
       { "perek": 24, "mishnayot": 14 },
       { "perek": 25, "mishnayot": 9 },
       { "perek": 26, "mishnayot": 9 },
       { "perek": 27, "mishnayot": 10 },
       { "perek": 28, "mishnayot": 10 },
       { "perek": 29, "mishnayot": 8 },
       { "perek": 30, "mishnayot": 3 }
      ]
     },
     {
      "name": "Oholot",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 8 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 7 },
       { "perek": 10, "mishnayot": 4 },
       { "perek": 11, "mishnayot": 8 },
       { "perek": 12, "mishnayot": 5 },
       { "perek": 13, "mishnayot": 11 },
       { "perek": 14, "mishnayot": 6 },
       { "perek": 15, "mishnayot": 8 },
       { "perek": 16, "mishnayot": 7 },
       { "perek": 17, "mishnayot": 13 },
       { "perek": 18, "mishnayot": 10 }
      ]
     },
     {
      "name": "Negaim",
      "perakim": [
       { "perek": 1, "mishnayot": 4 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 6 },
       { "perek": 4, "mishnayot": 13 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 8 },
       { "perek": 7, "mishnayot": 5 },
       { "perek": 8, "mishnayot": 10 },
       { "perek": 9, "mishnayot": 5 },
       { "perek": 10, "mishnayot": 10 },
       { "perek": 11, "mishnayot": 7 },
       { "perek": 12, "mishnayot": 5 },
       { "perek": 13, "mishnayot": 11 },
       { "perek": 14, "mishnayot": 13 }
      ]
     },
     {
      "name": "Parah",
      "perakim": [
       { "perek": 1, "mishnayot": 5 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 11 },
       { "perek": 4, "mishnayot": 4 },
       { "perek": 5, "mishnayot": 5 },
       { "perek": 6, "mishnayot": 3 },
       { "perek": 7, "mishnayot": 6 },
       { "perek": 8, "mishnayot": 10 },
       { "perek": 9, "mishnayot": 6 },
       { "perek": 10, "mishnayot": 5 },
       { "perek": 11, "mishnayot": 5 },
       { "perek": 12, "mishnayot": 5 }
      ]
     },
     {
      "name": "Tohorot",
      "perakim": [
       { "perek": 1, "mishnayot": 6 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 5 },
       { "perek": 5, "mishnayot": 4 },
       { "perek": 6, "mishnayot": 5 },
       { "perek": 7, "mishnayot": 7 },
       { "perek": 8, "mishnayot": 8 },
       { "perek": 9, "mishnayot": 4 },
       { "perek": 10, "mishnayot": 6 }
      ]
     },
     {
      "name": "Mikvaot",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 4 },
       { "perek": 4, "mishnayot": 6 },
       { "perek": 5, "mishnayot": 6 },
       { "perek": 6, "mishnayot": 6 },
       { "perek": 7, "mishnayot": 7 },
       { "perek": 8, "mishnayot": 4 },
       { "perek": 9, "mishnayot": 6 },
       { "perek": 10, "mishnayot": 8 }
      ]
     },
     {
      "name": "Niddah",
      "perakim": [
       { "perek": 1, "mishnayot": 7 },
       { "perek": 2, "mishnayot": 7 },
       { "perek": 3, "mishnayot": 10 },
       { "perek": 4, "mishnayot": 7 },
       { "perek": 5, "mishnayot": 7 },
       { "perek": 6, "mishnayot": 14 },
       { "perek": 7, "mishnayot": 4 },
       { "perek": 8, "mishnayot": 3 },
       { "perek": 9, "mishnayot": 7 },
       { "perek": 10, "mishnayot": 8 }
      ]
     },
     {
      "name": "Machshirin",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 8 },
       { "perek": 4, "mishnayot": 11 },
       { "perek": 5, "mishnayot": 10 },
       { "perek": 6, "mishnayot": 4 }
      ]
     },
     {
      "name": "Zavim",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 4 },
       { "perek": 4, "mishnayot": 6 },
       { "perek": 5, "mishnayot": 12 }
      ]
     },
     {
      "name": "Tevul Yom",
      "perakim": [
       { "perek": 1, "mishnayot": 9 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 7 },
       { "perek": 4, "mishnayot": 7 }
      ]
     },
     {
      "name": "Yadayim",
      "perakim": [
       { "perek": 1, "mishnayot": 5 },
       { "perek": 2, "mishnayot": 5 },
       { "perek": 3, "mishnayot": 2 },
       { "perek": 4, "mishnayot": 8 }
      ]
     },
     {
      "name": "Uktzim",
      "perakim": [
       { "perek": 1, "mishnayot": 8 },
       { "perek": 2, "mishnayot": 10 },
       { "perek": 3, "mishnayot": 12 }
      ]
     }
    ]
   }
  ]
 }
 

export default mishnayotData; 