import type { AppLanguage } from '../types/pdf';

interface TranslationMap {
  appName: string;
  home: string;
  myPdfs: string;
  settings: string;
  newPdf: string;
  imageToPdf: string;
  imageToPdfDesc: string;
  cameraToPdf: string;
  cameraToPdfDesc: string;
  recentPdfs: string;
  recentPdfsDesc: string;
  allPdfs: string;
  allPdfsDesc: string;
  recentCreated: string;
  viewAll: string;
  searchPlaceholder: string;
  noPdfsTitle: string;
  noPdfsDesc: string;
  createFirstPdf: string;
}

const STRINGS: Record<AppLanguage, TranslationMap> = {
  en: {
    appName: 'PDF Maker',
    home: 'Home',
    myPdfs: 'My PDFs',
    settings: 'Settings',
    newPdf: 'New PDF',
    imageToPdf: 'Image to PDF',
    imageToPdfDesc: 'Pick JPG, PNG, or WEBP photos and convert to PDF',
    cameraToPdf: 'Camera to PDF',
    cameraToPdfDesc: 'Capture multi-page document scans with live camera',
    recentPdfs: 'Recent PDFs',
    recentPdfsDesc: 'Open and share your latest converted files',
    allPdfs: 'All PDFs',
    allPdfsDesc: 'Browse, sort, rename, and manage every document',
    recentCreated: 'Recent Created PDFs',
    viewAll: 'View all',
    searchPlaceholder: 'Search PDF files by name...',
    noPdfsTitle: 'No PDF documents yet',
    noPdfsDesc: 'Select photos from your gallery or scan pages with your camera to create your first PDF.',
    createFirstPdf: 'Create Image PDF',
  },
  es: {
    appName: 'PDF Maker',
    home: 'Inicio',
    myPdfs: 'Mis PDFs',
    settings: 'Ajustes',
    newPdf: 'Nuevo PDF',
    imageToPdf: 'Imagen a PDF',
    imageToPdfDesc: 'Elige fotos JPG, PNG o WEBP y conviértelas a PDF',
    cameraToPdf: 'Cámara a PDF',
    cameraToPdfDesc: 'Escanea documentos de varias páginas con la cámara',
    recentPdfs: 'PDFs Recientes',
    recentPdfsDesc: 'Abre y comparte tus archivos más recientes',
    allPdfs: 'Todos los PDFs',
    allPdfsDesc: 'Explora, ordena, renombra y gestiona documentos',
    recentCreated: 'PDFs Creados Recientemente',
    viewAll: 'Ver todo',
    searchPlaceholder: 'Buscar archivos PDF por nombre...',
    noPdfsTitle: 'Aún no hay documentos PDF',
    noPdfsDesc: 'Selecciona fotos de tu galería o escanea páginas con la cámara para crear tu primer PDF.',
    createFirstPdf: 'Crear PDF de Imágenes',
  },
  fr: {
    appName: 'PDF Maker',
    home: 'Accueil',
    myPdfs: 'Mes PDF',
    settings: 'Paramètres',
    newPdf: 'Nouveau PDF',
    imageToPdf: 'Image vers PDF',
    imageToPdfDesc: 'Sélectionnez des photos JPG, PNG ou WEBP en PDF',
    cameraToPdf: 'Caméra vers PDF',
    cameraToPdfDesc: 'Numérisez des documents multipages avec la caméra',
    recentPdfs: 'PDF Récents',
    recentPdfsDesc: 'Ouvrez et partagez vos derniers fichiers créés',
    allPdfs: 'Tous les PDF',
    allPdfsDesc: 'Parcourez, triez, renommez et gérez vos fichiers',
    recentCreated: 'PDF Créés Récemment',
    viewAll: 'Tout voir',
    searchPlaceholder: 'Rechercher un fichier PDF...',
    noPdfsTitle: 'Aucun document PDF',
    noPdfsDesc: 'Choisissez des images dans la galerie ou scannez avec la caméra pour créer votre premier PDF.',
    createFirstPdf: 'Créer un PDF',
  },
  de: {
    appName: 'PDF Maker',
    home: 'Start',
    myPdfs: 'Meine PDFs',
    settings: 'Einstellungen',
    newPdf: 'Neues PDF',
    imageToPdf: 'Bild zu PDF',
    imageToPdfDesc: 'JPG-, PNG- oder WEBP-Bilder in PDF umwandeln',
    cameraToPdf: 'Kamera zu PDF',
    cameraToPdfDesc: 'Mehrseitige Dokumente direkt mit der Kamera scannen',
    recentPdfs: 'Neueste PDFs',
    recentPdfsDesc: 'Zuletzt erstellte Dokumente öffnen und teilen',
    allPdfs: 'Alle PDFs',
    allPdfsDesc: 'Alle PDF-Dateien durchsuchen, sortieren und verwalten',
    recentCreated: 'Zuletzt erstellte PDFs',
    viewAll: 'Alle anzeigen',
    searchPlaceholder: 'PDF-Dateien nach Namen suchen...',
    noPdfsTitle: 'Noch keine PDF-Dokumente',
    noPdfsDesc: 'Wähle Fotos aus deiner Galerie oder scanne Seiten mit der Kamera.',
    createFirstPdf: 'Erstes PDF erstellen',
  },
  hi: {
    appName: 'PDF Maker',
    home: 'होम',
    myPdfs: 'मेरी PDFs',
    settings: 'सेटिंग्स',
    newPdf: 'नया PDF',
    imageToPdf: 'इमेज से PDF',
    imageToPdfDesc: 'JPG, PNG या WEBP फ़ोटो चुनें और PDF बनाएं',
    cameraToPdf: 'कैमरा से PDF',
    cameraToPdfDesc: 'लाइव कैमरे से मल्टी-पेज डॉक्यूमेंट स्कैन करें',
    recentPdfs: 'हाल के PDFs',
    recentPdfsDesc: 'अपनी हाल ही में बनाई गई फ़ाइलें खोलें और शेयर करें',
    allPdfs: 'सभी PDFs',
    allPdfsDesc: 'सभी डॉक्यूमेंट देखें, क्रमबद्ध करें और प्रबंधित करें',
    recentCreated: 'हाल में बनाए गए PDFs',
    viewAll: 'सभी देखें',
    searchPlaceholder: 'नाम से PDF फ़ाइलें खोजें...',
    noPdfsTitle: 'अभी कोई PDF डॉक्यूमेंट नहीं है',
    noPdfsDesc: 'अपना पहला PDF बनाने के लिए गैलरी से फ़ोटो चुनें या कैमरे से स्कैन करें।',
    createFirstPdf: 'पहला PDF बनाएं',
  },
};

export function getStrings(lang: AppLanguage): TranslationMap {
  return STRINGS[lang] || STRINGS.en;
}
