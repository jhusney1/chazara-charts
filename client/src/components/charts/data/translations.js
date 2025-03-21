/**
 * Translation labels for the chart UI
 */

const translations = {
  en: {
    // Common translations
    reviews: 'Number of Reviews',
    useHebrew: 'Use Hebrew letters for numbers',
    downloadFormat: 'Download Format',
    excel: 'Excel Spreadsheet',
    excelDesc: 'Editable format for digital use',
    pdf: 'PDF Document',
    pdfDesc: 'Printable format for physical use',
    generating: 'Generating...',
    generate: 'Generate Chart',
    columnsPerPage: 'Columns per Page',
    includeDateColumn: 'Include Date Column',
    startDate: 'Start Date',
    customization: 'Chart Customization',
    mainSettings: 'Main Settings',
    
    // Gemara chart specific
    generateChart: 'Gemara Chart Generator',
    selectMasechet: 'Select Masechet',
    startingDaf: 'Starting Daf',
    endingDaf: 'Ending Daf',
    dafPerDay: 'Learning Mode',
    dafMode: 'Daf Mode',
    amudMode: 'Amud Mode',
    footer: 'This will generate a chart for the selected tractate with columns for the date learned and each review session.',
    
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
    mishnayotFooter: 'This will generate a chart for the selected Mishnayot tractate with columns for the date learned and each review session.',
    
    // Mishna Berura chart specific
    mishnaBeruraGenerator: 'Mishna Berura Chart Generator',
    selectSection: 'Select Section',
    selectTopic: 'Select Topic',
    startingSiman: 'Starting Siman',
    startingSeif: 'Starting Se\'if',
    endingSiman: 'Ending Siman',
    endingSeif: 'Ending Se\'if',
    simanPerDay: 'Learning Mode',
    simanMode: 'Siman Mode',
    seifMode: 'Se\'if Mode',
    mishnaBeruraFooter: 'This will generate a chart for the selected Mishna Berura section with columns for the date learned and each review session.',
    
    tooltips: {
      columnsPerPage: 'Determines how many columns to split your chart into on each page',
      includeDateColumn: 'Include a column for marking the date when each item was learned',
      startDate: 'If date column is included, start filling dates from this day',
      dafPerDay: 'Switch between Daf mode (full page) and Amud mode (half page)',
      chaptersPerDay: 'Switch between Chapter mode (full chapter) and Mishnah mode (individual mishnah)',
      simanPerDay: 'Switch between Siman mode (full siman) and Se\'if mode (individual se\'if)'
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
    customization: 'התאמה אישית של הטבלה',
    mainSettings: 'הגדרות ראשיות',
    
    // Gemara chart specific
    generateChart: 'מחולל טבלאות גמרא',
    selectMasechet: 'בחר מסכת',
    startingDaf: 'דף התחלה',
    endingDaf: 'דף סיום',
    dafPerDay: 'מצב לימוד',
    dafMode: 'מצב דף',
    amudMode: 'מצב עמוד',
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
    startingSeif: 'סעיף התחלה',
    endingSiman: 'סימן סיום',
    endingSeif: 'סעיף סיום',
    simanPerDay: 'מצב לימוד',
    simanMode: 'מצב סימן',
    seifMode: 'מצב סעיף',
    mishnaBeruraFooter: 'זה ייצור טבלה למשנה ברורה שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.',
    
    tooltips: {
      columnsPerPage: 'קובע לכמה עמודות לחלק את הטבלה שלך בכל עמוד',
      includeDateColumn: 'כלול עמודה לסימון התאריך שבו נלמד כל פריט',
      startDate: 'אם עמודת תאריך נכללת, התחל למלא תאריכים מיום זה',
      dafPerDay: 'בחר בין מצב דף (עמוד שלם) ומצב עמוד (חצי עמוד)',
      chaptersPerDay: 'בחר בין מצב פרק (פרק שלם) ומצב משנה (משנה בודדת)',
      simanPerDay: 'בחר בין מצב סימן (סימן שלם) ומצב סעיף (סעיף בודד)'
    }
  }
};

export default translations; 