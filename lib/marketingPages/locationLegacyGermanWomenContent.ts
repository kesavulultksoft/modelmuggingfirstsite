/**
 * Legacy marketing copy from `self-defense-location-gewaltabwehrtraining-muenchen.html` /
 * `self-defense-location-gewaltabwehrtraining-koln.html` (UTF-8 cleaned, Köln city line corrected).
 */

export type LegacyGermanSection = { heading: string; paragraphs: string[] }

const originalSystemBullets: LegacyGermanSection = {
  heading: 'Das ORIGINAL Vollkraft-Stressadrenalin-Trainingssystem',
  paragraphs: [
    '• Angst in Kraft verwandeln!',
    '• Vollkraftschläge und –tritte gegen Angreifer im Schutzanzug!',
    '• Eine lebensverändernde Erfahrung!',
    '• Lerne realitätserprobte Gewaltabwehr!',
  ],
}

function weekendKursIntro(cityLine: string, p1: string): LegacyGermanSection[] {
  return [
    {
      heading: 'Wochenendkurs Gewaltabwehr für Frauen',
      paragraphs: [
        p1,
        'Unser Gewaltabwehr-Einstiegskurs ist ein ganzheitliches Programm, das auf weitreichender Gewaltforschung und über 40 Jahren praktischer Erfahrung basiert und auf den Fünf Prinzipien der Selbstverteidigung aufbaut.',
        'Die Teilnehmerinnen unseres Gewaltabwehr-Einsteigerkurses schaffen es durch die persönliche Abwehrkampferfahrung im Stressadrenalin-Training, sich beim Kampf auf Kraft nicht mehr allein auf Entschlossenheit verlassen zu müssen.',
      ],
    },
    {
      heading: 'Absolventinnen',
      paragraphs: [
        'Die meisten Absolventinnen des Einsteigerkurses bezeichnen das Training als eine lebensverändernde Erfahrung!',
      ],
    },
    {
      heading: 'Warum Model Mugging Gewaltabwehr das beste Selbstschutzprogramm für Frauen ist',
      paragraphs: [
        '• Du nutzt die Kraft Deiner Angst',
        '• Anwendung der Fünf Prinzipien der Selbstverteidigung',
        '• Jahrzehnte der Analyse und Forschung im Bereich Gewaltverbrechen',
        '• Realistische Abwehrlösungen gerade unter Stressadrenalin',
        '• Originales Vollkraft-Trainingssystem',
        '• Abwehr üben ohne Zurückhaltung',
        '• Top-Schutzausrüstung des Angreifers ermöglicht Vollkraftschläge und –tritte gegen dessen Schwachstellen',
        '• Klein – sicher – gruppendynamisch unterstützende Umgebung und Teilnehmerzahl; individualisierte Szenarien',
        '• Kurz – intensiv – umfassend',
        '• Realistisches Training – bewährte Abwehrlösungen – stärkendes Coaching',
        '• Zeiteffizient und kostengünstig',
        '• Eine lebensverändernde Erfahrung!',
      ],
    },
    {
      heading: 'Auswahl eines geeigneten Gewaltabwehr-Programms',
      paragraphs: [
        'Immer an die „Kopier-Regel“ denken: Eine Kopie von einer Kopie verliert wichtige Details. In Nachahmerprogrammen wird die Realitätsnähe verwässert, die Sicherheit der Übungen ist nicht gewährleistet und die sorgfältig aufeinander abgestimmten Inhalte werden kompromittiert.',
        'Model Mugging ist das ORIGINAL Stressadrenalintraining, das auf weitreichender Forschung, der Analyse von Gewaltverbrechen und den Fünf Prinzipien der Selbstverteidigung aufbaut.',
        cityLine,
      ],
    },
  ]
}

export function buildLegacyGermanMunichSections(): LegacyGermanSection[] {
  const p1 =
    'Jahrzehntelang haben Model Mugging Gewaltabwehr-Absolventinnen gefährlichen Situationen aus dem Weg gehen können, ohne ihre physischen Abwehrfähigkeiten aktiv einsetzen zu müssen.'
  return [
    originalSystemBullets,
    ...weekendKursIntro(
      'Wir bieten Vollkraft-Gewaltabwehrkurse oder kompaktes Training zur persönlichen Sicherheit und Abwehr von Sexualverbrechen in München.',
      p1,
    ),
  ]
}

export function buildLegacyGermanCologneSections(): LegacyGermanSection[] {
  const p1 =
    'Jahrzehntelang haben Model Mugging Gewaltabwehr-Absolventinnen gefährlichen Situationen aus dem Weg gehen können, ohne ihre physischen Abwehrfähigkeiten aktiv einsetzen zu müssen.'
  return [
    originalSystemBullets,
    ...weekendKursIntro(
      'Wir bieten Vollkraft-Gewaltabwehrkurse oder kompaktes Training zur persönlichen Sicherheit und Abwehr von Sexualverbrechen in Köln.',
      p1,
    ),
  ]
}
