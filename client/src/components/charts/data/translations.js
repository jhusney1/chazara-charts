/**
 * Translation labels for the chart UI
 */

const translations = {
  en: {
    // Common translations
    reviews: 'Number of Reviews',
    useHebrew: 'Use Hebrew Letters for Numbering',
    downloadFormat: 'Download Format',
    excel: 'Excel Spreadsheet',
    excelDesc: 'For digital editing',
    pdf: 'PDF Document',
    pdfDesc: 'For printing',
    generating: 'Generating...',
    generate: 'Generate Chart',
    columnsPerPage: 'Columns Per Page',
    includeDateColumn: 'Include Date Column',
    startDate: 'Start Date',
    chazaraDays: 'Chazara days (no new learning)',
    weekdays: { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Shabbat' },
    customization: 'Chart Customization',
    mainSettings: 'Main Settings',
    
    // Gemara chart specific
    generateChart: 'Gemara Chart Generator',
    selectMasechet: 'Select Masechet',
    searchMasechet: 'Type to search a masechet...',
    noMasechetMatches: 'No masechet matches',
    startingDaf: 'Starting Daf',
    endingDaf: 'Ending Daf',
    dafPerDay: 'Learning Mode',
    dafMode: 'Daf Mode',
    amudMode: 'Amud Mode',
    includePerakim: 'Show perakim',
    perek: 'Perek',
    footer: 'This will generate a chart for the selected masechet with columns for the date learned and each review session.',
    
    // Mishnayot chart specific
    mishnayotGenerator: 'Mishnayot Chart Generator',
    selectSeder: 'Select Seder',
    startingChapter: 'Starting Chapter',
    startingMishnah: 'Starting Mishnah',
    endingChapter: 'Ending Chapter',
    endingMishnah: 'Ending Mishnah',
    chaptersPerDay: 'Learning Mode',
    chapterMode: 'Chapter Mode',
    mishnahMode: 'Mishnah Mode',
    mishnayotFooter: 'This will generate a chart for the selected Mishnayot with columns for the date learned and each review session.',
    
    // Mishna Berura chart specific
    mishnaBeruraGenerator: 'Mishna Berura Chart Generator',
    selectSection: 'Select Book (Chelek)',
    selectTopic: 'Select Topic',
    startingSiman: 'Starting Siman',
    endingSiman: 'Ending Siman',
    selectionMode: 'Selection Mode',
    topicMode: 'Topic Mode',
    bookMode: 'Book Mode',
    customMode: 'Custom Mode',
    simanMode: 'Siman Mode',
    mishnaBeruraFooter: 'This will generate a chart for the selected Mishna Berura section with columns for the date learned and each review session.',
    
    tooltips: {
      columnsPerPage: 'Determines how many columns to split your chart into on each page',
      includeDateColumn: 'Include a column for marking the date when each item was learned',
      startDate: 'If date column is included, start filling dates from this day',
      chazaraDays: 'Days of the week reserved for review. The date column skips them and schedules the next item on the following allowed day.',
      dafPerDay: 'Switch between Daf mode (full page) and Amud mode (half page)',
      includePerakim: 'Add a heading row before the first daf of each perek. It is a label, not a daf: no date and no review boxes.',
      chaptersPerDay: 'Switch between Chapter mode (full chapter) and Mishnah mode (individual mishnah)'
    }
  },
  he: {
    // Common translations
    reviews: 'מספר חזרות',
    useHebrew: 'השתמש באותיות עבריות למספרים',
    downloadFormat: 'פורמט להורדה',
    excel: 'גיליון אקסל',
    excelDesc: 'פורמט לעריכה דיגיטלית',
    pdf: 'מסמך PDF',
    pdfDesc: 'פורמט להדפסה',
    generating: 'מייצר...',
    generate: 'צור טבלה',
    columnsPerPage: 'עמודות בכל דף',
    includeDateColumn: 'כלול עמודת תאריך',
    startDate: 'תאריך התחלה',
    chazaraDays: 'ימי חזרה (ללא לימוד חדש)',
    weekdays: { sun: 'א׳', mon: 'ב׳', tue: 'ג׳', wed: 'ד׳', thu: 'ה׳', fri: 'ו׳', sat: 'שבת' },
    customization: 'התאמה אישית של הטבלה',
    mainSettings: 'הגדרות ראשיות',
    
    // Gemara chart specific
    generateChart: 'מחולל טבלאות גמרא',
    selectMasechet: 'בחר מסכת',
    searchMasechet: 'הקלד לחיפוש מסכת...',
    noMasechetMatches: 'לא נמצאה מסכת מתאימה',
    startingDaf: 'דף התחלה',
    endingDaf: 'דף סיום',
    dafPerDay: 'מצב לימוד',
    dafMode: 'מצב דף',
    amudMode: 'מצב עמוד',
    includePerakim: 'הצג פרקים',
    perek: 'פרק',
    footer: 'זה ייצור טבלה עבור המסכת שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.',
    
    // Mishnayot chart specific
    mishnayotGenerator: 'מחולל טבלאות משניות',
    selectSeder: 'בחר סדר',
    startingChapter: 'פרק התחלה',
    startingMishnah: 'משנה התחלה',
    endingChapter: 'פרק סיום',
    endingMishnah: 'משנה סיום',
    chaptersPerDay: 'מצב לימוד',
    chapterMode: 'מצב פרק',
    mishnahMode: 'מצב משנה',
    mishnayotFooter: 'זה ייצור טבלה למסכת המשניות שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.',
    
    // Mishna Berura chart specific
    mishnaBeruraGenerator: 'מחולל טבלאות משנה ברורה',
    selectSection: 'בחר חלק',
    selectTopic: 'בחר נושא',
    startingSiman: 'סימן התחלה',
    endingSiman: 'סימן סיום',
    selectionMode: 'מצב בחירה',
    topicMode: 'מצב נושא',
    bookMode: 'מצב ספר',
    customMode: 'מצב מותאם אישית',
    simanMode: 'מצב סימן',
    mishnaBeruraFooter: 'זה ייצור טבלה למשנה ברורה שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.',
    
    tooltips: {
      columnsPerPage: 'קובע לכמה עמודות לחלק את הטבלה שלך בכל עמוד',
      includeDateColumn: 'כלול עמודה לסימון התאריך שבו נלמד כל פריט',
      startDate: 'אם עמודת תאריך נכללת, התחל למלא תאריכים מיום זה',
      chazaraDays: 'ימים בשבוע המיועדים לחזרה. עמודת התאריך מדלגת עליהם וקובעת את הפריט הבא ליום המותר הבא.',
      dafPerDay: 'בחר בין מצב דף (עמוד שלם) ומצב עמוד (חצי עמוד)',
      includePerakim: 'הוסף שורת כותרת לפני הדף הראשון של כל פרק. זו כותרת בלבד, לא דף: בלי תאריך ובלי תיבות חזרה.',
      chaptersPerDay: 'בחר בין מצב פרק (פרק שלם) ומצב משנה (משנה בודדת)'
    }
  }
};

export default translations; 