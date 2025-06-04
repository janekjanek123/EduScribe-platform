import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Polish translations
const pl = {
  // Navigation & Header
  nav: {
    home: 'Strona główna',
    dashboard: 'Panel',
    pricing: 'Cennik',
    about: 'O nas',
    help: 'Pomoc',
    login: 'Zaloguj się',
    logout: 'Wyloguj się',
    profile: 'Profil',
    settings: 'Ustawienia'
  },
  
  // Home Page
  home: {
    title: 'Przekształć dowolną treść w uporządkowane notatki',
    subtitle: 'Wykorzystaj AI do generowania kompleksowych notatek z filmów YouTube, przesłanych plików, wideo lub tekstu. Wybierz preferowaną metodę poniżej.',
    generateNotes: 'Generuj notatki',
    
    // Cards
    youtubeVideos: 'Filmy YouTube',
    youtubeDescription: 'Wyciągnij kompleksowe notatki z dowolnego filmu YouTube, po prostu wklejając URL.',
    enterLink: 'Wprowadź link →',
    
    uploadFile: 'Prześlij plik',
    uploadFileDescription: 'Prześlij dokumenty (PDF, DOC, TXT) i przekształć je w zorganizowane, przeszukiwalne notatki.',
    uploadFileAction: 'Prześlij plik →',
    
    uploadVideo: 'Prześlij wideo',
    uploadVideoDescription: 'Prześlij pliki wideo i przekształć je w notatki używając transkrypcji AI i analizy.',
    uploadVideoAction: 'Prześlij wideo →',
    
    textInput: 'Wprowadź tekst',
    textInputDescription: 'Wklej dowolną treść tekstową i przekształć ją w dobrze uporządkowane, kompleksowe notatki.',
    enterText: 'Wprowadź tekst →',
    
    // Features
    whyChoose: 'Dlaczego wybrać EduScribe?',
    aiPowered: 'Wsparty AI',
    aiPoweredDescription: 'Zaawansowana technologia AI wyciąga kluczowe informacje i tworzy uporządkowane podsumowania.',
    fastEfficient: 'Szybki i wydajny',
    fastEfficientDescription: 'Generuj kompleksowe notatki w minuty, a nie godziny ręcznej pracy.',
    multipleFormats: 'Wiele formatów',
    multipleFormatsDescription: 'Obsługa filmów, dokumentów i tekstu z konsekwentną jakością wyników.'
  },
  
  // Help/Support Page
  help: {
    title: 'Centrum Pomocy',
    subtitle: 'Jesteśmy tutaj, aby pomóc!',
    welcomeMessage: 'Jeśli napotkasz jakiekolwiek problemy lub masz pytania, skontaktuj się z nami. Odpowiemy tak szybko, jak to możliwe. Dziękujemy za cierpliwość i przepraszamy za wszelkie niedogodności.',
    contactForm: 'Formularz kontaktowy',
    emailLabel: 'Adres email',
    emailPlaceholder: 'twoj.email@example.com',
    subjectLabel: 'Temat (opcjonalnie)',
    subjectPlaceholder: 'Krótki opis problemu',
    messageLabel: 'Wiadomość',
    messagePlaceholder: 'Opisz szczegółowo swój problem lub pytanie...',
    sendButton: 'Wyślij zapytanie',
    sending: 'Wysyłanie...',
    successMessage: 'Wiadomość została wysłana pomyślnie! Skontaktujemy się z Tobą wkrótce.',
    errorMessage: 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie lub napisz bezpośrednio na support.edzuscribe@gmail.com',
    
    // Validation messages
    emailRequired: 'Adres email jest wymagany',
    emailInvalid: 'Wprowadź prawidłowy adres email',
    messageRequired: 'Wiadomość jest wymagana',
    messageMinLength: 'Wiadomość musi mieć co najmniej 10 znaków',
    
    // Quick help sections
    quickHelp: 'Szybka pomoc',
    commonIssues: 'Najczęstsze problemy',
    accountIssue: 'Problem z kontem',
    accountIssueDesc: 'Nie możesz się zalogować lub masz problemy z kontem?',
    uploadIssue: 'Problem z przesyłaniem',
    uploadIssueDesc: 'Masz trudności z przesłaniem pliku lub wideo?',
    noteGeneration: 'Problem z generowaniem notatek',
    noteGenerationDesc: 'Notatki nie generują się prawidłowo?',
    
    // Contact info
    directContact: 'Bezpośredni kontakt',
    emailDirect: 'Email: support.edzuscribe@gmail.com',
    responseTime: 'Czas odpowiedzi: zwykle w ciągu 24 godzin'
  },
  
  // Legal Pages
  legal: {
    // Terms of Use
    termsTitle: 'Terms of Use – EduScribe',
    effectiveDate: 'Data wejścia w życie:',
    lastUpdated: 'Ostatnia aktualizacja:',
    termsAcceptance: 'Akceptacja Warunków',
    termsAcceptanceText: 'Używając usługi EduScribe ("Usługa"), potwierdzasz, że masz co najmniej 13 lat i zgadzasz się być związany niniejszymi Warunkami Użytkowania. Jeśli masz mniej niż 18 lat, musisz mieć zgodę rodzica lub opiekuna na korzystanie z naszej Usługi.',
    
    serviceDescription: 'Opis Usługi',
    serviceDescriptionText: 'EduScribe zapewnia użytkownikom narzędzia do generowania treści edukacyjnych z różnych źródeł, w tym filmów YouTube, przesłanych plików i tekstu. Nasza platforma wspierana przez AI tworzy notatki, podsumowania i materiały edukacyjne wspierające działania związane z nauką i nauczaniem.',
    
    accountsSubscriptions: 'Konta i Subskrypcje',
    accountsSubscriptionsText: 'Jesteś odpowiedzialny za zachowanie poufności danych logowania do swojego konta i za wszystkie działania, które mają miejsce w ramach twojego konta. Oferujemy różne plany subskrypcji z różnymi limitami użytkowania i funkcjami. Opłaty za subskrypcję są pobierane zgodnie z wybranym planem.',
    
    noGuarantee: 'Brak Gwarancji Nieprzerwanej Usługi',
    noGuaranteeText: 'Dążymy do utrzymania EduScribe w działaniu przez cały czas, ale nie możemy zagwarantować 100% czasu działania. Usługa może być tymczasowo niedostępna z powodu konserwacji, aktualizacji lub problemów technicznych. Nie ponosimy odpowiedzialności za jakiekolwiek niedogodności lub straty wynikające z przerw w działaniu usługi.',
    
    noRefunds: 'Brak Zwrotów',
    noRefundsText: 'EduScribe jest dostarczany "jak jest" i "jak dostępny". Nie oferujemy zwrotów za opłaty za subskrypcję, niewykorzystane kredyty lub jakiekolwiek inne opłaty, chyba że wymaga tego obowiązujące prawo. Wszelkie sprzedaże są ostateczne. Możesz anulować subskrypcję w dowolnym momencie, aby zapobiec przyszłym opłatom.',
    
    userContent: 'Treści Generowane przez Użytkownika',
    userContentText: 'Jesteś wyłącznie odpowiedzialny za wszelkie treści, które przesyłasz, wprowadzasz lub generujesz przy użyciu naszej Usługi. Gwarantujesz, że masz niezbędne prawa do używania takich treści i że nie naruszają one praw stron trzecich ani obowiązujących przepisów. Zastrzegamy sobie prawo do usuwania treści naruszających niniejsze warunki.',
    
    intellectualProperty: 'Własność Intelektualna',
    intellectualPropertyText: 'Wszystkie treści, projekty i kod w EduScribe są własnością EduScribe lub jego licencjodawców. Treści generowane przez nasze narzędzia AI na podstawie twojego wkładu są dostarczane tobie do użytku edukacyjnego. Zachowujesz prawa do swoich oryginalnych treści wejściowych.',
    
    modifications: 'Modyfikacje Warunków',
    modificationsText: 'Możemy od czasu do czasu aktualizować niniejsze Warunki. Powiadomimy użytkowników o znaczących zmianach za pośrednictwem poczty elektronicznej lub poprzez Usługę. Dalsze korzystanie z Usługi po wprowadzeniu zmian oznacza akceptację zaktualizowanych Warunków.',
    
    termination: 'Rozwiązanie',
    terminationText: 'Zastrzegamy sobie prawo do zawieszenia lub zakończenia dostępu do Usługi w dowolnym momencie za naruszenie niniejszych Warunków lub z jakiegokolwiek innego powodu według naszego wyłącznego uznania. Możesz zakończyć swoje konto w dowolnym momencie, kontaktując się z nami lub poprzez ustawienia konta.',
    
    limitation: 'Ograniczenie Odpowiedzialności',
    limitationText: 'W maksymalnym zakresie dozwolonym przez prawo, EduScribe nie ponosi odpowiedzialności za jakiekolwiek szkody pośrednie, przypadkowe, specjalne lub wynikowe wynikające z korzystania z Usługi. Nasza całkowita odpowiedzialność nie przekroczy kwoty zapłaconej przez ciebie za Usługę w ciągu dwunastu miesięcy poprzedzających roszczenie.',
    
    governingLaw: 'Prawo Właściwe',
    governingLawText: 'Niniejsze Warunki będą regulowane prawem Polski, bez względu na przepisy dotyczące konfliktu prawa. Wszelkie spory wynikające z niniejszych Warunków lub Usługi będą rozstrzygane w sądach Polski.',
    
    contact: 'Kontakt',
    contactText: 'W przypadku pytań lub wątpliwości dotyczących niniejszych Warunków Użytkowania, skontaktuj się z nami pod adresem:',
    
    // Privacy Policy
    privacyTitle: 'Polityka Prywatności',
    privacyWelcome: 'Witaj w EduScribe! Niniejsza Polityka Prywatności wyjaśnia, w jaki sposób gromadzimy, używamy i chronimy twoje informacje podczas korzystania z naszej strony internetowej i usług.',
    
    infoWeCollect: 'Informacje, które gromadzimy',
    accountInfo: 'Informacje o koncie:',
    accountInfoText: 'Podczas rejestracji gromadzimy twój adres e-mail i hasło.',
    usageData: 'Dane użytkowania:',
    usageDataText: 'Gromadzimy dane o tym, jak korzystasz z naszej platformy, w tym generowane treści i wzorce użytkowania.',
    paymentData: 'Dane płatności:',
    paymentDataText: 'Płatności są obsługiwane przez Stripe. Nie przechowujemy danych kart kredytowych.',
    
    howWeUse: 'Jak wykorzystujemy twoje dane',
    howWeUseList: [
      'Aby dostarczać i ulepszać nasze usługi',
      'Aby przetwarzać płatności i subskrypcje',
      'Aby personalizować twoje doświadczenia i dostarczać treści',
      'Do analiz i ulepszeń systemu'
    ],
    
    dataSharing: 'Udostępnianie danych',
    dataSharingList: [
      'Nie sprzedajemy twoich danych.',
      'Możemy udostępniać dane zaufanym stronom trzecim (np. dostawcom hostingu, narzędziom analitycznym) tylko w celu obsługi naszej platformy.'
    ],
    
    cookiesTracking: 'Pliki cookie i śledzenie',
    cookiesTrackingText: 'Używamy plików cookie i podobnych technologii do uwierzytelniania, analiz i wydajności. Możesz zarządzać preferencjami dotyczącymi plików cookie w swojej przeglądarce.',
    
    yourRights: 'Twoje prawa',
    yourRightsList: [
      'Możesz w dowolnym momencie uzyskać dostęp, zaktualizować lub usunąć swoje dane osobowe.',
      'Możesz anulować swoje konto za pośrednictwem platformy.'
    ],
    
    dataSecurity: 'Bezpieczeństwo danych',
    dataSecurityText: 'Używamy standardowych w branży środków ochrony twoich danych. Jednak żadna metoda transmisji przez internet nie jest całkowicie bezpieczna.',
    
    policyChanges: 'Zmiany w tej Polityce',
    policyChangesText: 'Możemy aktualizować niniejszą Politykę Prywatności. Znaczące zmiany będą komunikowane za pośrednictwem poczty elektronicznej lub powiadomienia na platformie.',
    
    thankYou: 'Dziękujemy za zaufanie EduScribe!',
    
    // FAQ
    faqTitle: 'Często Zadawane Pytania (FAQ)',
    faq1Q: 'Czym jest EduScribe?',
    faq1A: 'EduScribe to platforma wspierana przez AI, która pomaga generować ustrukturyzowane notatki, podsumowania i quizy z filmów, prezentacji i treści tekstowych.',
    
    faq2Q: 'Ile to kosztuje?',
    faq2A: 'Oferujemy trzy plany:',
    faq2Free: 'Darmowy: 2 generacje notatek/miesiąc, 3 zapisane notatki',
    faq2Student: 'Student: 10 notatek/miesiąc, 12 zapisanych notatek, obsługa YouTube, przesyłanie PPT, quizy',
    faq2Pro: 'Pro: Nielimitowane notatki, 50 zapisanych notatek, dostęp do wszystkich funkcji z priorytetowym przetwarzaniem',
    
    faq3Q: 'Czy mogę anulować subskrypcję?',
    faq3A: 'Tak. Możesz anulować w dowolnym momencie z ustawień konta. Po anulowaniu zostaniesz przeniesiony na plan Darmowy.',
    
    faq4Q: 'Jakie formaty mogę przesyłać?',
    faq4A: 'Możesz przesyłać tekst, prezentacje PowerPoint (.pptx) i filmy (poniżej 100MB). Obsługiwane są również linki YouTube.',
    
    faq5Q: 'Jak działa generowanie notatek przez AI?',
    faq5A: 'Nasza AI wyciąga kluczowe punkty i strukturyzuje twoją treść w przyswajalne, tematyczne sekcje. Otrzymasz również podsumowanie TL;DR.',
    
    faq6Q: 'Czy moje dane są bezpieczne?',
    faq6A: 'Tak. Używamy nowoczesnego szyfrowania i bezpiecznych usług chmurowych. Zobacz naszą Politykę Prywatności po więcej szczegółów.',
    
    faq7Q: 'Czy mogę używać EduScribe do celów komercyjnych?',
    faq7A: 'Tak, o ile przestrzegasz naszych Warunków Usługi.',
    
    faq8Q: 'Dlaczego moje generowanie notatek było ograniczone?',
    faq8A: 'Każdy plan ma limity. Ulepsz swój plan, aby zwiększyć limit lub poczekaj na reset limitu.',
    
    faq9Q: 'Czy mogę eksportować notatki na komputer?',
    faq9A: 'Tak! Możesz eksportować notatki do lokalnej aplikacji Notatnik na obsługiwanych urządzeniach.',
    
    faq10Q: 'Nadal mam pytania. Gdzie mogę uzyskać pomoc?',
    faq10A: 'Skontaktuj się z nami w dowolnym momencie pod adresem',
    faq10A2: '— chętnie ci pomożemy!'
  },
  
  // Dashboard
  dashboard: {
    title: 'Panel użytkownika',
    subtitle: 'Zarządzaj wszystkimi wygenerowanymi notatkami w jednym miejscu',
    myNotes: 'Moje notatki',
    recentNotes: 'Ostatnie notatki',
    usage: 'Wykorzystanie',
    upgrade: 'Ulepsz plan',
    noNotes: 'Nie masz jeszcze żadnych notatek',
    noNotesInCategory: 'Brak notatek w tej kategorii',
    createFirst: 'Stwórz swoją pierwszą notatkę',
    createFirstNote: 'Stwórz pierwszą notatkę',
    tryDifferentFilter: 'Spróbuj innego filtra lub stwórz nowe notatki',
    generateNotes: 'Generuj notatki',
    generateFirstNote: 'Wygeneruj pierwszą notatkę',
    logout: 'Wyloguj się',
    loginRequired: 'Musisz się zalogować, aby zobaczyć panel',
    goToHomepage: 'Przejdź do strony głównej',
    loadingNotes: 'Ładowanie notatek...',
    tryAgain: 'Spróbuj ponownie',
    deleteNote: 'Usuń notatkę',
    createdOn: 'Utworzono',
    slideCount: '{{count}} slajdów',
    quizAvailable: '{{count}} pytań quizu',
    
    filters: {
      allNotes: 'Wszystkie notatki',
      videoNotes: 'Notatki wideo',
      fileNotes: 'Notatki z plików',
      textNotes: 'Notatki tekstowe',
      uploadedVideoNotes: 'Przesłane wideo'
    },
    
    noteTypes: {
      video: 'YouTube',
      'video-upload': 'Przesłane wideo',
      file: 'Plik',
      text: 'Tekst'
    },
    
    confirmLogout: {
      title: 'Potwierdź wylogowanie',
      message: 'Czy na pewno chcesz się wylogować? Będziesz musiał się ponownie zalogować, aby uzyskać dostęp do swoich notatek.',
      cancel: 'Anuluj',
      confirm: 'Wyloguj się'
    },
    
    deleteConfirm: {
      title: 'Usuń notatkę',
      message: 'Czy na pewno chcesz usunąć tę notatkę?',
      warning: 'Ta akcja nie może zostać cofnięta.',
      cancel: 'Anuluj',
      confirm: 'Usuń notatkę'
    }
  },
  
  // Notes Generation
  notes: {
    generating: 'Generowanie notatek...',
    success: 'Notatki wygenerowane pomyślnie!',
    error: 'Wystąpił błąd podczas generowania notatek',
    title: 'Tytuł notatek',
    content: 'Treść',
    summary: 'Podsumowanie',
    keyPoints: 'Kluczowe punkty',
    export: 'Eksportuj',
    save: 'Zapisz',
    delete: 'Usuń',
    edit: 'Edytuj'
  },
  
  // Forms & Inputs
  forms: {
    email: 'Email',
    password: 'Hasło',
    confirmPassword: 'Potwierdź hasło',
    submit: 'Wyślij',
    cancel: 'Anuluj',
    save: 'Zapisz',
    loading: 'Ładowanie...',
    required: 'To pole jest wymagane',
    invalidEmail: 'Nieprawidłowy adres email',
    passwordTooShort: 'Hasło musi mieć co najmniej 6 znaków',
    passwordsNotMatch: 'Hasła nie są identyczne'
  },
  
  // Pricing
  pricing: {
    title: 'Wybierz swój plan',
    subtitle: 'Znajdź idealny plan dla swoich potrzeb edukacyjnych',
    free: 'Darmowy',
    student: 'Student',
    pro: 'Pro',
    monthly: 'miesięcznie',
    yearly: 'rocznie',
    month: 'miesiąc',
    year: 'rok',
    mostPopular: 'Najpopularniejszy',
    choosePlan: 'Wybierz plan',
    currentPlan: 'Aktualny plan',
    unknown: 'Nieznany',
    subscriptionEndsOn: 'Subskrypcja kończy się {{date}}',
    saveUpTo: 'Oszczędź do 25%',
    whenBilledAnnually: 'przy rozliczeniu rocznym',
    saveAmount: 'Oszczędź {{amount}} rocznie',
    backToDashboard: 'Powrót do panelu',
    
    plans: {
      free: {
        name: 'Darmowy',
        description: 'Podstawowe generowanie notatek dla studentów'
      },
      student: {
        name: 'Student',
        description: 'Idealny dla studentów z rozszerzonymi funkcjami'
      },
      pro: {
        name: 'Pro',
        description: 'Najlepszy plan dla zaawansowanych użytkowników i profesjonalistów'
      }
    },
    
    cancelModal: {
      title: 'Czy na pewno chcesz anulować subskrypcję?',
      warningMessage: 'Jeśli anulujesz plan, **wszystkie notatki przekraczające limit Planu Darmowego (3 notatki)** zostaną trwale usunięte.',
      irreversible: 'Ta akcja jest nieodwracalna.',
      checkingNotes: 'Sprawdzanie zapisanych notatek...',
      freePlanLimit: 'Limit planu darmowego: 3 notatki',
      notesWillBeDeleted: '⚠️ {{count}} {{count, plural, one {notatka zostanie usunięta} few {notatki zostaną usunięte} many {notatek zostanie usuniętych} other {notatek zostanie usuniętych}}}',
      keepSubscription: 'Zachowaj subskrypcję',
      confirmCancel: 'Tak, anuluj subskrypcję',
      successMessage: 'Twoja subskrypcja została anulowana. Szkoda, że odchodzisz – mamy nadzieję, że jeszcze się zobaczymy!',
      errorMessage: 'Nie udało się anulować subskrypcji: {{error}}. Skontaktuj się z pomocą techniczną, jeśli problem będzie się powtarzał.'
    },
    
    faq: {
      title: 'Często Zadawane Pytania',
      changePlan: {
        question: 'Czy mogę zmienić plan w dowolnym momencie?',
        answer: 'Tak, możesz podwyższyć lub obniżyć plan w dowolnym momencie. Zmiany wchodzą w życie natychmiast w przypadku podwyższenia i na koniec cyklu rozliczeniowego w przypadku obniżenia.'
      },
      exceedLimits: {
        question: 'Co się stanie, jeśli przekroczę limity?',
        answer: 'Jeśli osiągniesz miesięczny limit generowania notatek, będziesz musiał podwyższyć plan lub poczekać do następnego cyklu rozliczeniowego. Zapisane notatki pozostają dostępne.'
      },
      freeTrial: {
        question: 'Czy jest okres próbny?',
        answer: 'Nasz Plan Darmowy pozwala wypróbować EduScribe z 2 notatkami miesięcznie. Możesz podwyższyć plan w dowolnym momencie, aby odblokować więcej funkcji i wyższe limity.'
      },
      billing: {
        question: 'Jak działa rozliczanie?',
        answer: 'Opłata jest pobierana na początku każdego cyklu rozliczeniowego. Plany roczne oferują znaczne oszczędności w porównaniu z rozliczaniem miesięcznym.'
      }
    },
    
    features: {
      notesGeneration: 'generowanie notatek/miesiąc',
      savedNotes: 'zapisane notatki',
      youtubeSupport: 'Obsługa YouTube',
      fileUpload: 'Przesyłanie plików',
      quizzes: 'Quizy',
      prioritySupport: 'Wsparcie priorytetowe',
      unlimited: 'Nielimitowane',
      characterLimit: 'Limit {{limit}} znaków na notatkę',
      pptUploads: 'Przesyłanie PPT',
      uploadVideo: 'Przesyłanie wideo do notatek',
      exportNotepad: 'Eksport do Notatnika',
      highestPriority: 'Najwyższy priorytet przetwarzania',
      mediumPriority: 'Średni priorytet przetwarzania',
      lowestPriority: 'Najniższy priorytet przetwarzania'
    },
    
    buttons: {
      creatingCheckout: 'Tworzenie płatności...',
      cancelling: 'Anulowanie...',
      cancellingAtPeriodEnd: 'Anulowanie na koniec okresu',
      currentPlan: 'Aktualny plan',
      cancelSubscription: 'Anuluj subskrypcję',
      getStartedFree: 'Zacznij za darmo',
      choosePlan: 'Wybierz plan'
    }
  },
  
  // Footer
  footer: {
    description: 'Generator notatek z filmów YouTube wspierany sztuczną inteligencją. Stworzony z myślą o uczniach, studentach i nauczycielach.',
    navigation: 'Nawigacja',
    documentation: 'Dokumentacja',
    privacyPolicy: 'Polityka prywatności',
    termsOfUse: 'Warunki użytkowania',
    faq: 'FAQ',
    rights: 'Wszelkie prawa zastrzeżone.'
  },
  
  // Auth
  auth: {
    signIn: 'Zaloguj się',
    signUp: 'Zarejestruj się',
    signOut: 'Wyloguj się',
    forgotPassword: 'Zapomniałeś hasła?',
    resetPassword: 'Resetuj hasło',
    createAccount: 'Utwórz konto',
    alreadyHaveAccount: 'Masz już konto?',
    dontHaveAccount: 'Nie masz konta?',
    welcomeBack: 'Witaj z powrotem!',
    createYourAccount: 'Utwórz swoje konto'
  },
  
  // Common
  common: {
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    warning: 'Ostrzeżenie',
    info: 'Informacja',
    close: 'Zamknij',
    open: 'Otwórz',
    yes: 'Tak',
    no: 'Nie',
    ok: 'OK',
    back: 'Wstecz',
    next: 'Dalej',
    previous: 'Poprzedni',
    continue: 'Kontynuuj'
  },
  
  // About Page
  about: {
    title: 'O nas',
    paragraph1: 'Jesteśmy grupą studentów, którzy stworzyli tę aplikację jako projekt poboczny. Wszystko zaczęło się od prostego pomysłu — chcieliśmy znaleźć lepszy sposób na robienie notatek z wykładów online, szczególnie gdy czas nas gonił przed egzaminami.',
    paragraph2: 'Na początku to był tylko skrypt, który pomagał nam przetwarzać nagrania z zajęć. Ale z czasem pomyśleliśmy: "Skoro nam to pomaga, może przyda się też innym?". I tak narodził się EduScribe.',
    paragraph3: 'Po wielu nieprzespanych nocach spędzonych na debugowaniu (i niekończących się dyskusjach o rozmiarach czcionek o 2 nad ranem), udało nam się stworzyć coś, z czego jesteśmy naprawdę dumni.',
    paragraph4: 'Mamy nadzieję, że ta aplikacja ułatwi komuś życie — czy to podczas przygotowań do matury, nauki nowego języka, czy po prostu próby ogarnięcia materiału z zajęć. Dziękujemy, że jesteście z nami w tej podróży.',
    quote: '"Najlepsze pomysły rodzą się z próby rozwiązania własnych problemów."',
    backToHome: 'Powrót do strony głównej'
  }
}

// English translations
const en = {
  // Navigation & Header
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    pricing: 'Pricing',
    about: 'About',
    help: 'Help',
    login: 'Login',
    logout: 'Logout',
    profile: 'Profile',
    settings: 'Settings'
  },
  
  // Home Page
  home: {
    title: 'Transform Any Content Into Structured Notes',
    subtitle: 'Use AI to generate comprehensive notes from YouTube videos, uploaded files, videos, or raw text. Choose your preferred method below.',
    generateNotes: 'Generate Notes',
    
    // Cards
    youtubeVideos: 'YouTube Videos',
    youtubeDescription: 'Extract comprehensive notes from any YouTube video by simply pasting the URL.',
    enterLink: 'Enter Link →',
    
    uploadFile: 'Upload File',
    uploadFileDescription: 'Upload documents (PDF, DOC, TXT) and convert them into organized, searchable notes.',
    uploadFileAction: 'Upload File →',
    
    uploadVideo: 'Upload Video',
    uploadVideoDescription: 'Upload video files and convert them to notes using AI transcription and analysis.',
    uploadVideoAction: 'Upload Video →',
    
    textInput: 'Text Input',
    textInputDescription: 'Paste any text content and transform it into well-structured, comprehensive notes.',
    enterText: 'Enter Text →',
    
    // Features
    whyChoose: 'Why Choose EduScribe?',
    aiPowered: 'AI-Powered',
    aiPoweredDescription: 'Advanced AI technology extracts key information and creates structured summaries.',
    fastEfficient: 'Fast & Efficient',
    fastEfficientDescription: 'Generate comprehensive notes in minutes, not hours of manual work.',
    multipleFormats: 'Multiple Formats',
    multipleFormatsDescription: 'Support for videos, documents, and text with consistent quality output.'
  },
  
  // Help/Support Page
  help: {
    title: 'Help Center',
    subtitle: 'We\'re here to help!',
    welcomeMessage: 'If you\'re facing any issues or have questions, reach out to us. We\'ll respond as soon as possible. Thank you for your patience and sorry for any inconvenience.',
    contactForm: 'Contact Form',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your.email@example.com',
    subjectLabel: 'Subject (optional)',
    subjectPlaceholder: 'Brief description of your issue',
    messageLabel: 'Message',
    messagePlaceholder: 'Describe your problem or question in detail...',
    sendButton: 'Send Message',
    sending: 'Sending...',
    successMessage: 'Message sent successfully! We\'ll get back to you soon.',
    errorMessage: 'Error sending message. Please try again or email us directly at support.edzuscribe@gmail.com',
    
    // Validation messages
    emailRequired: 'Email address is required',
    emailInvalid: 'Please enter a valid email address',
    messageRequired: 'Message is required',
    messageMinLength: 'Message must be at least 10 characters long',
    
    // Quick help sections
    quickHelp: 'Quick Help',
    commonIssues: 'Common Issues',
    accountIssue: 'Account Issues',
    accountIssueDesc: 'Can\'t log in or having trouble with your account?',
    uploadIssue: 'Upload Problems',
    uploadIssueDesc: 'Having trouble uploading files or videos?',
    noteGeneration: 'Note Generation Issues',
    noteGenerationDesc: 'Notes not generating properly?',
    
    // Contact info
    directContact: 'Direct Contact',
    emailDirect: 'Email: support.edzuscribe@gmail.com',
    responseTime: 'Response time: usually within 24 hours'
  },
  
  // Legal Pages (English translations)
  legal: {
    // Terms of Use
    termsTitle: 'Terms of Use – EduScribe',
    effectiveDate: 'Effective Date:',
    lastUpdated: 'Last updated:',
    termsAcceptance: 'Acceptance of Terms',
    termsAcceptanceText: 'By using the EduScribe service ("Service"), you confirm that you are at least 13 years old and agree to be bound by these Terms of Use. If you are under 18, you must have parental or guardian consent to use our Service.',
    
    serviceDescription: 'Description of Service',
    serviceDescriptionText: 'EduScribe provides users with tools to generate educational content from various sources including YouTube videos, uploaded files, and text input. Our AI-powered platform creates notes, summaries, and educational materials to support learning and teaching activities.',
    
    accountsSubscriptions: 'Accounts and Subscriptions',
    accountsSubscriptionsText: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We offer various subscription plans with different usage limits and features. Subscription fees are charged according to your selected plan.',
    
    noGuarantee: 'No Guarantee of Uninterrupted Service',
    noGuaranteeText: 'We aim to keep EduScribe operational at all times, but we cannot guarantee 100% uptime. The Service may be temporarily unavailable due to maintenance, updates, or technical issues. We are not liable for any inconvenience or loss resulting from service interruptions.',
    
    noRefunds: 'No Refunds',
    noRefundsText: 'EduScribe is provided "as-is" and "as available." We do not offer refunds for subscription fees, unused credits, or any other charges unless required by applicable law. All sales are final. You may cancel your subscription at any time to prevent future charges.',
    
    userContent: 'User-Generated Content',
    userContentText: 'You are solely responsible for any content you upload, input, or generate using our Service. You warrant that you have the necessary rights to use such content and that it does not violate any third-party rights or applicable laws. We reserve the right to remove content that violates these terms.',
    
    intellectualProperty: 'Intellectual Property',
    intellectualPropertyText: 'All content, design, and code on EduScribe is the property of EduScribe or its licensors. The content generated by our AI tools based on your input is provided to you for your educational use. You retain rights to your original input content.',
    
    modifications: 'Modifications to Terms',
    modificationsText: 'We may update these Terms from time to time. We will notify users of significant changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the updated Terms.',
    
    termination: 'Termination',
    terminationText: 'We reserve the right to suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason at our sole discretion. You may terminate your account at any time by contacting us or through account settings.',
    
    limitation: 'Limitation of Liability',
    limitationText: 'To the fullest extent permitted by law, EduScribe shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you for the Service in the twelve months preceding the claim.',
    
    governingLaw: 'Governing Law',
    governingLawText: 'These Terms shall be governed by the laws of Poland, without regard to conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts of Poland.',
    
    contact: 'Contact',
    contactText: 'For any questions or concerns regarding these Terms of Use, please contact us at:',
    
    // Privacy Policy
    privacyTitle: 'Privacy Policy',
    privacyWelcome: 'Welcome to EduScribe! This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.',
    
    infoWeCollect: 'Information We Collect',
    accountInfo: 'Account Information:',
    accountInfoText: 'When you register, we collect your email address and password.',
    usageData: 'Usage Data:',
    usageDataText: 'We collect data about how you use our platform, including generated content and usage patterns.',
    paymentData: 'Payment Data:',
    paymentDataText: 'Payments are handled by Stripe. We do not store credit card details.',
    
    howWeUse: 'How We Use Your Data',
    howWeUseList: [
      'To provide and improve our services',
      'To process payments and subscriptions',
      'To personalize your experience and deliver content',
      'For analytics and system improvements'
    ],
    
    dataSharing: 'Data Sharing',
    dataSharingList: [
      'We do not sell your data.',
      'We may share data with trusted third parties (e.g., hosting providers, analytics tools) only for operating our platform.'
    ],
    
    cookiesTracking: 'Cookies and Tracking',
    cookiesTrackingText: 'We use cookies and similar technologies for authentication, analytics, and performance. You can manage cookie preferences in your browser.',
    
    yourRights: 'Your Rights',
    yourRightsList: [
      'You may access, update, or delete your personal data at any time.',
      'You can cancel your account via the platform.'
    ],
    
    dataSecurity: 'Data Security',
    dataSecurityText: 'We use industry-standard measures to protect your data. However, no method of transmission over the internet is completely secure.',
    
    policyChanges: 'Changes to This Policy',
    policyChangesText: 'We may update this Privacy Policy. Significant changes will be communicated via email or platform notification.',
    
    thankYou: 'Thank you for trusting EduScribe!',
    
    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faq1Q: 'What is EduScribe?',
    faq1A: 'EduScribe is an AI-powered platform that helps you generate structured notes, summaries, and quizzes from videos, presentations, and text content.',
    
    faq2Q: 'How much does it cost?',
    faq2A: 'We offer three plans:',
    faq2Free: 'Free: 2 note generations/month, 3 saved notes',
    faq2Student: 'Student: 10 notes/month, 12 saved notes, includes YouTube video support, PPT uploads, quizzes',
    faq2Pro: 'Pro: Unlimited notes, 50 saved notes, access to all features with priority processing',
    
    faq3Q: 'Can I cancel my subscription?',
    faq3A: 'Yes. You can cancel anytime from your account settings. Once cancelled, you\'ll be downgraded to the Free plan.',
    
    faq4Q: 'What formats can I upload?',
    faq4A: 'You can upload text, PowerPoint presentations (.pptx), and videos (under 100MB). YouTube links are also supported.',
    
    faq5Q: 'How does AI note generation work?',
    faq5A: 'Our AI extracts key points and structures your content into digestible, thematic sections. You\'ll also get a TL;DR summary.',
    
    faq6Q: 'Is my data secure?',
    faq6A: 'Yes. We use modern encryption and secure cloud services. See our Privacy Policy for more details.',
    
    faq7Q: 'Can I use EduScribe for commercial purposes?',
    faq7A: 'Yes, as long as you comply with our Terms of Service.',
    
    faq8Q: 'Why was my note generation limited?',
    faq8A: 'Each plan has limits. Upgrade your plan to increase your quota or wait for your limit to reset.',
    
    faq9Q: 'Can I export notes to my computer?',
    faq9A: 'Yes! You can export notes to your local Notepad application on supported devices.',
    
    faq10Q: 'I still have questions. Where can I get help?',
    faq10A: 'Contact us anytime at',
    faq10A2: '— we\'re happy to assist you!'
  },
  
  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Manage all your generated notes in one place',
    myNotes: 'My Notes',
    recentNotes: 'Recent Notes',
    usage: 'Usage',
    upgrade: 'Upgrade Plan',
    noNotes: 'You don\'t have any notes yet',
    noNotesInCategory: 'No notes in this category',
    createFirst: 'Create your first note',
    createFirstNote: 'Create first note',
    tryDifferentFilter: 'Try a different filter or create new notes',
    generateNotes: 'Generate Notes',
    generateFirstNote: 'Generate first note',
    logout: 'Logout',
    loginRequired: 'You need to log in to view the dashboard',
    goToHomepage: 'Go to Homepage',
    loadingNotes: 'Loading notes...',
    tryAgain: 'Try again',
    deleteNote: 'Delete note',
    createdOn: 'Created on',
    slideCount: '{{count}} slides',
    quizAvailable: '{{count}} quiz questions',
    
    filters: {
      allNotes: 'All Notes',
      videoNotes: 'Video Notes',
      fileNotes: 'File Notes',
      textNotes: 'Text Notes',
      uploadedVideoNotes: 'Uploaded Videos'
    },
    
    noteTypes: {
      video: 'YouTube',
      'video-upload': 'Uploaded Video',
      file: 'File',
      text: 'Text'
    },
    
    confirmLogout: {
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out? You will need to sign in again to access your notes.',
      cancel: 'Cancel',
      confirm: 'Logout'
    },
    
    deleteConfirm: {
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      warning: 'This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Delete Note'
    }
  },
  
  // Notes Generation
  notes: {
    generating: 'Generating notes...',
    success: 'Notes generated successfully!',
    error: 'Error occurred while generating notes',
    title: 'Note Title',
    content: 'Content',
    summary: 'Summary',
    keyPoints: 'Key Points',
    export: 'Export',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit'
  },
  
  // Forms & Inputs
  forms: {
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsNotMatch: 'Passwords do not match'
  },
  
  // Pricing
  pricing: {
    title: 'Choose Your Plan',
    subtitle: 'Find the perfect plan for your educational needs',
    free: 'Free',
    student: 'Student',
    pro: 'Pro',
    monthly: 'monthly',
    yearly: 'yearly',
    month: 'month',
    year: 'year',
    mostPopular: 'Most Popular',
    choosePlan: 'Choose Plan',
    currentPlan: 'Current Plan',
    unknown: 'Unknown',
    subscriptionEndsOn: 'Subscription ends on {{date}}',
    saveUpTo: 'Save up to 25%',
    whenBilledAnnually: 'when billed annually',
    saveAmount: 'Save {{amount}} annually',
    backToDashboard: 'Back to Dashboard',
    
    plans: {
      free: {
        name: 'Free',
        description: 'Basic note generation for students'
      },
      student: {
        name: 'Student',
        description: 'Ideal for students with extended features'
      },
      pro: {
        name: 'Pro',
        description: 'Best plan for advanced users and professionals'
      }
    },
    
    cancelModal: {
      title: 'Are you sure you want to cancel your subscription?',
      warningMessage: 'If you cancel your plan, **all notes exceeding the Free Plan limit (3 notes)** will be permanently deleted.',
      irreversible: 'This action is irreversible.',
      checkingNotes: 'Checking saved notes...',
      freePlanLimit: 'Free plan limit: 3 notes',
      notesWillBeDeleted: '⚠️ {{count}} {{count, plural, one {note will be deleted} few {notes will be deleted} many {notes will be deleted} other {notes will be deleted}}}',
      keepSubscription: 'Keep subscription',
      confirmCancel: 'Yes, cancel subscription',
      successMessage: 'Your subscription has been cancelled. We\'re sorry to see you go – we hope to see you again soon!',
      errorMessage: 'Failed to cancel subscription: {{error}}. Please contact support if the issue persists.'
    },
    
    faq: {
      title: 'Frequently Asked Questions',
      changePlan: {
        question: 'Can I change my plan at any time?',
        answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades and at the end of the billing cycle for downgrades.'
      },
      exceedLimits: {
        question: 'What happens if I exceed my limits?',
        answer: 'If you reach your monthly note generation limit, you will need to upgrade your plan or wait for the next billing cycle. Saved notes remain available.'
      },
      freeTrial: {
        question: 'Is there a free trial?',
        answer: 'Our Free Plan allows you to try EduScribe with 2 notes per month. You can upgrade your plan at any time to unlock more features and higher limits.'
      },
      billing: {
        question: 'How does billing work?',
        answer: 'Payment is charged at the start of each billing cycle. Annual plans offer significant savings compared to monthly billing.'
      }
    },
    
    features: {
      notesGeneration: 'note generations/month',
      savedNotes: 'saved notes',
      youtubeSupport: 'YouTube Support',
      fileUpload: 'File Upload',
      quizzes: 'Quizzes',
      prioritySupport: 'Priority Support',
      unlimited: 'Unlimited',
      characterLimit: 'Limit {{limit}} characters per note',
      pptUploads: 'PPT Uploads',
      uploadVideo: 'Upload Video to Notes',
      exportNotepad: 'Export to Notepad',
      highestPriority: 'Highest Processing Priority',
      mediumPriority: 'Medium Processing Priority',
      lowestPriority: 'Lowest Processing Priority'
    },
    
    buttons: {
      creatingCheckout: 'Creating checkout...',
      cancelling: 'Cancelling...',
      cancellingAtPeriodEnd: 'Cancelling at period end',
      currentPlan: 'Current Plan',
      cancelSubscription: 'Cancel Subscription',
      getStartedFree: 'Get Started for Free',
      choosePlan: 'Choose Plan'
    }
  },
  
  // Footer
  footer: {
    description: 'AI-powered note generator from YouTube videos. Created for students, learners, and teachers.',
    navigation: 'Navigation',
    documentation: 'Documentation',
    privacyPolicy: 'Privacy Policy',
    termsOfUse: 'Terms of Use',
    faq: 'FAQ',
    rights: 'All rights reserved.'
  },
  
  // Auth
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
    welcomeBack: 'Welcome Back!',
    createYourAccount: 'Create Your Account'
  },
  
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    close: 'Close',
    open: 'Open',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    continue: 'Continue'
  },
  
  // About Page
  about: {
    title: 'About Us',
    paragraph1: 'We are a group of students who created this application as a side project. It all started with a simple idea — we wanted to find a better way to take notes from online lectures, especially when time was running out before exams.',
    paragraph2: 'At first, it was just a script that helped us process lecture recordings. But then we thought: "If it helps us, it might help others too?". And so EduScribe was born.',
    paragraph3: 'After countless sleepless nights spent debugging (and endless discussions about font sizes at 2 AM), we managed to create something that we are truly proud of.',
    paragraph4: 'We hope this application makes someone\'s life easier — whether it\'s during exam preparation, learning a new language, or just trying to get a handle on the material from lectures. Thank you for being with us on this journey.',
    quote: '"The best ideas come from trying to solve your own problems."',
    backToHome: 'Back to Homepage'
  }
}

const resources = {
  pl: { translation: pl },
  en: { translation: en }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl',
    lng: 'pl', // default language
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n 