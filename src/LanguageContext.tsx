import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageType = 'en' | 'hi';

export interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<LanguageType, Record<string, string>> = {
  en: {
    // Brand
    'brand.name': 'Amber Royale Resort',
    'brand.subtitle': 'Automated Enterprise Center',
    
    // Core Status / Navbar
    'lobby.time': 'Lobby Local Time',
    'syncing': 'Syncing..',
    'workspace': 'Workspace',
    'logout': 'LOGOUT CELL',
    'logged.in.as': 'Logged in as',
    
    // Admin navigation items
    'nav.dashboard': 'Overview',
    'nav.rooms': 'Rooms Inventory',
    'nav.customers': 'Guests File',
    'nav.bookings': 'Reservations',
    'nav.restaurant': 'Menu Card Manager',
    'nav.ordering': 'Room Service Deliveries',
    'nav.housekeeping': 'Housekeeping Desk',
    'nav.complaints': 'Helpdesk Tickets',
    'nav.staff': 'Staff Roster',
    'nav.maintenance': 'Room Maintenance',
    'nav.email-logs': 'Corporate Mail Logs',
    'nav.visitors': 'Visitor Register',
    'nav.lostfound': 'Lost & Found Logs',
    'nav.feedback': 'Experience Audit',
    'nav.attendance': 'Work Attendance',
    'nav.inventory': 'Kitchen Inventory',
    'nav.emergency': 'Distress Signals Desk',
    'nav.billing': 'Billing Invoices',
    'nav.reports': 'Business Audits',

    // Customer Navigation Items
    'nav.customer_dashboard': 'My Suite Portal',
    'nav.recommendation': 'Smart Cabin Finder',
    'nav.browse_rooms': 'Browse Suite Catalog',
    'nav.my_bookings': 'My Reservations',
    'nav.ordering_room_service': 'Order Room Service',
    'nav.my_invoices': 'My Invoices',
    'nav.log_service_ticket': 'Log Service Ticket',
    'nav.visitor_clearance': 'Visitor Clearance',
    'nav.report_lost_items': 'Report Lost Items',
    'nav.leave_feedbacks': 'Leave Feedbacks',
    'nav.loyalty_club_points': 'Loyalty Club Points',
    'nav.safety_panic_sos': 'Safety Panic SOS',

    // Buttons & UI Controls
    'btn.cancel': 'Cancel',
    'btn.save': 'Save Changes',
    'btn.confirm': 'Confirm',
    'btn.delete': 'Delete',
    'btn.dismiss': 'Dismiss',
    
    // General / Notifications
    'notif.center': 'Notifications Center',
    'notif.new': 'New',
    'notif.read_all': 'Read All',
    'notif.force_reload': 'Force Reload',
    'notif.empty': 'No system notifications found',
    'all.up.to.date': 'You are fully up to date!',
    'notif.dismiss': 'Dismiss',
    'audit.center': 'Amber Royale Enterprise Audit Center',

    // Login / Registration Page
    'auth.title': 'AMBER ROYALE ENTERPRISE',
    'auth.subtitle': 'GRAND LUXURY RESORT & SPA PORTAL',
    'auth.login_btn': 'ACCESS SECURE CORE',
    'auth.register_btn': 'REGISTER NEW GUEST MEMBER',
    'auth.username_placeholder': 'Portal Username',
    'auth.password_placeholder': 'Security Access Key / Password',
    'auth.have_account': 'Already registered with Amber Royale?',
    'auth.no_account': 'New patron or first-time luxury guest?',
    'auth.sign_in': 'Sign In to Dashboard',
    'auth.create_account': 'Create Guest Profile',
    'auth.fullname_placeholder': 'Full Legal Name',
    'auth.email_placeholder': 'Contact Email Address',
    'auth.phone_placeholder': 'Primary Phone Number',
    'auth.logging_in': 'AUTHENTICATING ENCRYPTION KEY...',
    'auth.registering': 'PROVISIONING PROFILE...',
    'auth.system_notice': '⚠️ System access and user audit records are monitored under strict administrative security compliance protocols.'
  },
  hi: {
    // Brand
    'brand.name': 'एम्बर रॉयल रिज़ॉर्ट',
    'brand.subtitle': 'स्वचालित उद्यम केंद्र',
    
    // Core Status / Navbar
    'lobby.time': 'लॉबी स्थानीय समय',
    'syncing': 'सिंक हो रहा है..',
    'workspace': 'कार्यक्षेत्र',
    'logout': 'लॉग आउट करें',
    'logged.in.as': 'लॉग इन किया हुआ उपयोगकर्ता',
    
    // Admin navigation items
    'nav.dashboard': 'सिंहावलोकन',
    'nav.rooms': 'कमरों की सूची',
    'nav.customers': 'अतिथि रिकॉर्ड',
    'nav.bookings': 'आरक्षण',
    'nav.restaurant': 'मेनू कार्ड प्रबंधक',
    'nav.ordering': 'कमरा सेवा वितरण',
    'nav.housekeeping': 'हाउसकीपिंग डेस्क',
    'nav.complaints': 'सहायता डेस्क टिकट',
    'nav.staff': 'कर्मचारी रोस्टर',
    'nav.maintenance': 'कमरा रखरखाव',
    'nav.email-logs': 'कॉर्पोरेट मेल लॉग',
    'nav.visitors': 'आगंतुक रजिस्टर',
    'nav.lostfound': 'खोया और पाया लॉग',
    'nav.feedback': 'अनुभव लेखापरीक्षा',
    'nav.attendance': 'कार्य उपस्थिति',
    'nav.inventory': 'रसोई सूची',
    'nav.emergency': 'आपातकालीन डेस्क',
    'nav.billing': 'बिलिंग चालान',
    'nav.reports': 'व्यापार लेखापरीक्षा',

    // Customer Navigation Items
    'nav.customer_dashboard': 'मेरा सुइट पोर्टल',
    'nav.recommendation': 'स्मार्ट केबिन खोजक',
    'nav.browse_rooms': 'सुइट कैटलॉग ब्राउज़ करें',
    'nav.my_bookings': 'मेरे आरक्षण',
    'nav.ordering_room_service': 'कमरा सेवा ऑर्डर करें',
    'nav.my_invoices': 'मेरे चालान',
    'nav.log_service_ticket': 'सेवा टिकट लॉग करें',
    'nav.visitor_clearance': 'आगंतुक मंजूरी',
    'nav.report_lost_items': 'खोई हुई वस्तुओं की रिपोर्ट',
    'nav.leave_feedbacks': 'फीडबैक छोड़ें',
    'nav.loyalty_club_points': 'लॉयल्टी क्लब अंक',
    'nav.safety_panic_sos': 'सुरक्षा पैनिक एसओएस',

    // Buttons & UI Controls
    'btn.cancel': 'रद्द करें',
    'btn.save': 'बदलाव सहेजें',
    'btn.confirm': 'पुष्टि करें',
    'btn.delete': 'हटाएं',
    'btn.dismiss': 'खारिज करें',
    
    // General / Notifications
    'notif.center': 'अधिसूचना केंद्र',
    'notif.new': 'नया',
    'notif.read_all': 'सभी पढ़ें',
    'notif.force_reload': 'पुनः लोड करें',
    'notif.empty': 'कोई सिस्टम सूचनाएं नहीं मिलीं',
    'all.up.to.date': 'आप पूरी तरह से अद्यतित हैं!',
    'notif.dismiss': 'खारिज करें',
    'audit.center': 'एम्बर रॉयल एंटरप्राइज ऑडिट सेंटर',

    // Login / Registration Page
    'auth.title': 'एम्बर रॉयल एंटरप्राइज',
    'auth.subtitle': 'भव्य लक्ज़री रिज़ॉर्ट और स्पा पोर्टल',
    'auth.login_btn': 'सुरक्षित कोर तक पहुँचें',
    'auth.register_btn': 'नया अतिथि सदस्य पंजीकृत करें',
    'auth.username_placeholder': 'पोर्टल उपयोगकर्ता नाम',
    'auth.password_placeholder': 'सुरक्षा एक्सेस कुंजी / पासवर्ड',
    'auth.have_account': 'क्या आप पहले से एम्बर रॉयल में पंजीकृत हैं?',
    'auth.no_account': 'नए संरक्षक या पहली बार आए लक्ज़री अतिथि?',
    'auth.sign_in': 'डैशबोर्ड में साइन इन करें',
    'auth.create_account': 'अतिथि प्रोफ़ाइल बनाएं',
    'auth.fullname_placeholder': 'पूरा कानूनी नाम',
    'auth.email_placeholder': 'संपर्क ईमेल पता',
    'auth.phone_placeholder': 'प्राथमिक फोन नंबर',
    'auth.logging_in': 'प्रमाणीकरण एन्क्रिप्शन कुंजी...',
    'auth.registering': 'सदस्य प्रोफ़ाइल का प्रावधान...',
    'auth.system_notice': '⚠️ सख्त प्रशासनिक सुरक्षा अनुपालन प्रोटोकॉल के तहत सिस्टम एक्सेस और उपयोगकर्ता ऑडिट रिकॉर्ड की निगरानी की जाती है।'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, defaultValue?: string): string => {
    const localeDict = translations[language];
    if (localeDict && localeDict[key]) {
      return localeDict[key];
    }
    return defaultValue !== undefined ? defaultValue : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
