/**
 * Translation labels for the chart UI
 */

const translations = {
  en: {
    generateChart: 'Gemara Chart Generator',
    selectMasechet: 'Select Masechet',
    startingDaf: 'Starting Daf',
    endingDaf: 'Ending Daf',
    reviews: 'Number of Reviews',
    useHebrew: 'Use Hebrew letters for daf numbers',
    downloadFormat: 'Download Format',
    excel: 'Excel Spreadsheet',
    excelDesc: 'Editable format for digital use',
    pdf: 'PDF Document',
    pdfDesc: 'Printable format for physical use',
    generating: 'Generating...',
    generate: 'Generate Chart',
    footer: 'This will generate a chart for the selected tractate with columns for the date learned and each review session.',
    columnsPerPage: 'Columns per Page',
    includeDateColumn: 'Include Date Column',
    startDate: 'Start Date',
    dafPerDay: 'Learning Mode',
    dafMode: 'Daf Mode',
    amudMode: 'Amud Mode',
    customization: 'Chart Customization',
    mainSettings: 'Main Settings',
    tooltips: {
      columnsPerPage: 'Determines how many columns to split your chart into on each page',
      includeDateColumn: 'Include a column for marking the date when each daf/amud was learned',
      startDate: 'If date column is included, start filling dates from this day',
      dafPerDay: 'Switch between Daf mode (full page) and Amud mode (half page)'
    }
  },
  he: {
    generateChart: 'צור את הטבלה שלך',
    selectMasechet: 'בחר מסכת',
    startingDaf: 'דף התחלה',
    endingDaf: 'דף סיום',
    reviews: 'מספר חזרות',
    useHebrew: 'השתמש באותיות עבריות למספרי דפים',
    downloadFormat: 'פורמט להורדה',
    excel: 'גיליון אקסל',
    excelDesc: 'פורמט לעריכה דיגיטלית',
    pdf: 'מסמך PDF',
    pdfDesc: 'פורמט להדפסה',
    generating: 'מייצר...',
    generate: 'צור טבלה',
    footer: 'זה ייצור טבלה עבור המסכת שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.',
    columnsPerPage: 'עמודות בכל דף',
    includeDateColumn: 'כלול עמודת תאריך',
    startDate: 'תאריך התחלה',
    dafPerDay: 'מצב לימוד',
    dafMode: 'מצב דף',
    amudMode: 'מצב עמוד',
    customization: 'התאמה אישית של הטבלה',
    mainSettings: 'הגדרות ראשיות',
    tooltips: {
      columnsPerPage: 'קובע לכמה עמודות לחלק את הטבלה שלך בכל עמוד',
      includeDateColumn: 'כלול עמודה לסימון התאריך שבו נלמד כל דף/עמוד',
      startDate: 'אם עמודת תאריך נכללת, התחל למלא תאריכים מיום זה',
      dafPerDay: 'בחר בין מצב דף (עמוד שלם) ומצב עמוד (חצי עמוד)'
    }
  }
};

export default translations; 