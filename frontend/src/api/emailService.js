import emailjs from '@emailjs/browser';

/**
 * CONFIGURATION EMAILJS
 * 
 * Les clés sont laissées vides par défaut pour des raisons de sécurité 
 * et pour éviter d'envoyer des emails vers des comptes personnels.
 * 
 * Si un développeur / testeur souhaite tester l'envoi d'emails :
 * 1. Créer un compte sur https://www.emailjs.com/
 * 2. Renseigner ses propres identifiants soit ici, soit dans son fichier .env local :
 *    - VITE_EMAILJS_SERVICE_ID
 *    - VITE_EMAILJS_PUBLIC_KEY
 *    - VITE_EMAILJS_OFFER_TEMPLATE_ID
 *    - VITE_EMAILJS_COMPLETION_TEMPLATE_ID
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const OFFER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_OFFER_TEMPLATE_ID || '';
const COMPLETION_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_COMPLETION_TEMPLATE_ID || '';

export const sendOfferEmail = async (projectData, clientData) => {
  // Si les clés ne sont pas configurées, on simule l'envoi sans déclencher d'erreur
  if (!SERVICE_ID || !PUBLIC_KEY || !OFFER_TEMPLATE_ID) {
    console.info('ℹ️ [EmailService] Envoi d\'offre ignoré : clés non configurées. Renseignez vos propres clés pour tester.');
    return { status: 200, message: 'Email non envoyé (clés non configurées)' };
  }

  try {
    const templateParams = {
      title: `Offre - ${projectData.name}`,
      name: clientData.name,
      email: clientData.email,
      to_email: clientData.email,
      client_email: clientData.email,
      to_name: clientData.name,
      client_name: clientData.name,
      project_name: projectData.name,
      project_description: projectData.description || 'Aucune description.',
      total_price: (projectData.total_price || projectData.total_cost || 0).toLocaleString(),
      start_date: projectData.start_date || 'Non définie',
    };

    const response = await emailjs.send(SERVICE_ID, OFFER_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return response;
  } catch (error) {
    console.error('Failed to send Offer email:', error);
    throw error;
  }
};

export const sendCompletionEmail = async (projectData) => {
  if (!SERVICE_ID || !PUBLIC_KEY || !COMPLETION_TEMPLATE_ID) {
    console.info('ℹ️ [EmailService] Envoi de confirmation ignoré : clés non configurées. Renseignez vos propres clés pour tester.');
    return { status: 200, message: 'Email non envoyé (clés non configurées)' };
  }

  try {
    const templateParams = {
      client_name: projectData.client_name,
      client_email: projectData.client_email,
      project_name: projectData.name,
    };

    const response = await emailjs.send(SERVICE_ID, COMPLETION_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return response;
  } catch (error) {
    console.error('Failed to send Completion email:', error);
    throw error;
  }
};
